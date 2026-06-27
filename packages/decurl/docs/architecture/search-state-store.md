# Search State Store 状态机

本文档用于记录 `useSearchValues` / `useSearchValue` 背后的 store 状态机设计。

## 核心原则

每次 pending entry 都应被视为已经同步生效。

这里的同步与 React `setState` 的时间机制类似：调用 hook setter 后，业务读取到的 decoded data 必须立即反映这次更新。

URL 写入是异步持久化。它可以延迟 flush，也可以等待 React Router 完成 location 同步。

因此状态机的核心职责是保证时序正确：

- hook setter 立即改变 optimistic state。
- flush 只是把 optimistic state 持久化到 React Router。
- React Router 后续发出的 location change 需要判断来源。
- 如果 location change 来自 decurl 自己的 flush，则视为持久化确认。
- 如果 location change 来自外部，则以外部结果为准，并丢弃 pending entry。

## State

Store 至少持有以下状态：

```ts
type SearchStoreState = {
  confirmedLocation: SearchLocation
  optimisticLocation: SearchLocation
  pendingEntries: PendingEntry[]
}

type SearchLocation = {
  pathname: string
  search: string
}

// Store 还会在状态外维护 inflightFlushes。
// inflightFlushes 是 runtime 归因信息，不参与 React snapshot。
type InflightFlushes = string[]
```

### confirmedLocation

`confirmedLocation` 是 React Router 已经确认的 location。

它来自 runtime 的当前 location 或 runtime 的 location change 通知。

## Initialization

Runtime configuration 是 store 初始化的一部分。

在 singleton store 场景下，store 创建时还无法读取 React Router hooks，因此不能把占位 location 视为有效业务状态。

首次 `configureRuntime(runtime)` 会调用：

```ts
runtime.getLocation()
```

并用该 location 初始化：

```txt
confirmedLocation
optimisticLocation
```

这次初始化不应通知 subscribers。

如果在 runtime 配置前读取 snapshot，store 应抛出错误，提示开发者需要先调用 `useConfigureRuntime()`。

### optimisticLocation

`optimisticLocation` 是业务当前应看到的 location。

search hooks decode 的永远是 `optimisticLocation.search`，而不是直接读取 React Router location。

### pendingEntries

`pendingEntries` 是已经同步生效，但尚未被 flush 持久化的变更。

每个 entry 至少绑定创建时的上下文和 search 转换函数：

```ts
type PendingEntry = {
  id: number
  baseLocation: SearchLocation
  apply: (searchParams: URLSearchParams) => URLSearchParams
  options?: SearchNavigateOptions
}
```

`baseLocation` 是 entry 创建时的 visible base location。

它用于记录 entry 的原始上下文，也可以用于调试和后续更严格的失效判断。

它不代表每次 replay 都必须从该 location 开始。

### inflightFlushes

`inflightFlushes` 表示 decurl 已经调用 runtime navigate，但 React Router 还没有确认的 search 目标队列。

它用于区分：

- decurl 自己 flush 导致的 location change。
- 外部系统导致的 location change。

`inflightFlushes` 不属于 `SearchStoreState`，而是 store 内部维护的静态归因信息。它不参与 React snapshot，也不应因为归因记录变化而通知 subscribers。

P0 中，pathname 是更高优先级的边界。只有当 incoming location 的 pathname 与当前 confirmed pathname 相同时，才会用 `search` 匹配 `inflightFlushes`。

`inflightFlushes` 使用数组而不是 Set，因为连续 flush 可能出现重复 search：

```txt
A: name=1
B: name=2
C: name=1
inflightFlushes = [A, B, C]
```

数组保留 flush 顺序。匹配时使用 `lastIndexOf(search)`，命中后移除该 index 及其之前的 inflight search。

这代表 P0 偏向 React Router 可能合并或延迟 location 通知的行为：如果收到某个 decurl-owned search，则将它之前的 inflight search 视为中间态。

`hash` 和 `state` 不纳入 search state 状态机考量。

## Visible Search

正常 dirty 阶段：

```ts
optimisticLocation = replay(confirmedLocation, pendingEntries)
```

flush 已发出但尚未确认时：

```ts
optimisticLocation = replay(latestInflightFlushLocation, pendingEntries)
```

换句话说，visible base 是：

```ts
const visibleBase = latestInflightFlushLocation ?? confirmedLocation
const optimisticLocation = replay(visibleBase, pendingEntries)
```

当前实现中，普通 `addEntry` 不会每次全量 replay。它会将新 entry 增量 apply 到当前 `optimisticLocation`，以避免连续 add 时产生 O(N²) 计算。

当后续引入 entry remove、replace 或更复杂的 base 修正时，仍可以使用 replay 作为 dirty 重算路径。

## Pending Entry

Public setter 语义由 [Search State Hook 目标](search-state-hook.md) 定义。

Store 接收的是已经绑定创建上下文和 `apply` 函数的 pending entry。

Store 不关心 entry 来自 `useSearchValues`、`useSearchValue`，还是后续其他写入形态。

如果 hook setter 接收的是 updater，updater 应封装在 entry 的 `apply` 中，并在 replay 时重新执行。

entry 可以携带 navigate options。

## Replay

Replay 从 base location 开始，按顺序应用 pending entries。

```ts
let search = new URLSearchParams(base.search)

for (const entry of pendingEntries) {
  search = entry.apply(search)
}

return {
  pathname: base.pathname,
  search: search.toString(),
}
```

Replay 必须保持顺序。

后续 entry 不应覆盖它没有声明的字段。

不同写入形态可以共同作用于同一个 search string，因为每个 entry 自己决定如何 apply。

## addEntry

Hook setter 最终会转换为 `store.addEntry`。

`addEntry` 的状态转移：

```txt
base = latestInflightFlushLocation ?? confirmedLocation
entry = createEntry(base, apply, options)
pendingEntries.push(entry)
optimisticLocation = applyEntryToLocation(optimisticLocation, entry)
notify subscribers
schedule flush
```

这保证每次 entry 都立即同步生效。

## Flush

Flush 将当前 optimistic location 持久化到 React Router。

```txt
flushTarget = optimisticLocation
flushEntries = pendingEntries
resolvedOptions = resolveNavigateOptions(flushEntries)
inflightFlushes.push(flushTarget.search)
latestInflightFlushLocation = flushTarget
pendingEntries = []
runtime.navigate(flushTarget, resolvedOptions)
```

如果 flush target 与当前已确认 location 相同，则作为 no-op。

此时不应调用 runtime navigate，也不应记录新的 `inflightFlushes`。

flush 后再发生的 `setValues` 会进入新的 `pendingEntries`。

此时业务看到的状态是：

```txt
replay(latestInflightFlushLocation, pendingEntries)
```

例如：

```txt
confirmed search: page=1
setValues({ page: 2 })
setValues({ page: 3 })
flush target: page=3
setValues({ page: 4 })
optimistic search: page=4
```

当 React Router 随后通知 `page=3` 时，它是 decurl flush 的确认，不应覆盖当前 `page=4` optimistic state。

## Location Change

Store 接收到 location change 时，必须判断来源。

判断顺序：

```txt
if pathname changed:
  reset with next location
else if search matches inflightFlushes:
  consume inflight searches up to the matched item
  confirmedLocation = nextLocation
else if search === confirmedLocation.search:
  noop
else:
  reset with next location
```

同 pathname 下，`inflightFlushes` 必须优先于 `confirmedLocation.search` 匹配。

原因是如果先匹配 confirmed，下面这种重复 search 会留下 stale inflight：

```txt
confirmed search: name=1
flush A: name=1
flush B: name=2
flush C: name=1
inflightFlushes: [name=1, name=2, name=1]
```

如果 incoming `name=1` 先被 confirmed 命中并 no-op，`inflightFlushes` 不会被消费。后续外部 search 恰好为 `name=2` 时，可能被误判为 decurl confirmation。

因此同 pathname 下应先用 `lastIndexOf(search)` 消费 inflight，再判断 confirmed noop。StrictMode 重复通知也能成立：第一次命中 inflight 并更新 confirmed，第二次相同 search 会命中 confirmed noop。

### Decurl Flush Confirmation

如果 next location 的 pathname 未变化，且 search 命中 `inflightFlushes`：

```txt
confirmedLocation = nextLocation
inflightFlushes = inflightFlushes.slice(lastIndexOf(search) + 1)
optimisticLocation unchanged
pendingEntries unchanged
no notify
```

此分支只确认 router 已经到达 decurl 之前发出的某个 search。

它不应覆盖当前 optimistic state，也不应清理 `latestInflightFlushLocation`。

如果 location pathname 变化，则不会进入 inflight 匹配，而是直接按 external pathname change reset。

即使 next location 与当前 `optimisticLocation` 不同，也不代表外部覆盖。

它可能只是 React Router 正在确认 decurl 之前发出的 flush，而 decurl 在确认到达前又收到了新的 `setValues`。

### External Location Change

如果 pathname 变化，或者同 pathname 下 search 既不匹配 `inflightFlushes`、也不等于 `confirmedLocation.search`，则视为外部 location change。

```txt
confirmedLocation = nextLocation
inflightFlushes = []
latestInflightFlushLocation = undefined
pendingEntries = []
optimisticLocation = nextLocation
notify subscribers
```

外部变化以外部结果为准。

原因是 pending entry 在语义上已经被视为同步生效。如果真实系统随后给出一个无法归因到 decurl flush 的 location，它代表更晚发生的事实结果。

保留旧 pending entry 会导致“时序更早的 entry”在外部结果之后重新应用，从而产生错误顺序。

## Pathname Boundary

P0 中，pending entry 默认绑定创建时的 `pathname`。

多数情况下，`pathname` 变化意味着当前页面 search schema 也发生变化。

因此外部 pathname change 应丢弃所有 pending entry。

跨 pathname 的 search memory 是高级能力，不属于 P0 状态机。

## Pending Durability Boundary

Pending entry 是已经同步生效的 optimistic state，但不是 durable state。

只有 flush 到 React Router 并被 location 确认后，它才成为 URL 层面的持久状态。

如果存在 pending entries 时，用户或外部系统主动切换 pathname，例如：

```txt
/users -> /users/:id
```

且该 navigation 不是 decurl 当前 `inflightFlushes` 的确认，则它属于 external location change。

P0 行为：

```txt
confirmedLocation = nextLocation
inflightFlushes = []
latestInflightFlushLocation = undefined
pendingEntries = []
optimisticLocation = nextLocation
```

这意味着未 flush 的 entries 会被丢弃。

如果之后用户回到旧页面，URL 不会恢复这些未持久化的 optimistic entries。

这是刻意接受的边界，而不是状态机错误。

原因：

- 外部 navigation 是更晚发生的事实结果。
- 保留旧 pathname 的 pending entries 会造成时序反转。
- 在离开旧 pathname 后继续序列化旧 search，可能制造额外导航或错误 history。
- pending 到 flush 的窗口通常很短，真实用户触发该边界的概率很低。

如果业务需要跨页面恢复 search state，应使用后续高级能力，或在业务侧降低 flush delay。

## Search Format

Store 内部统一使用不带 `?` 前缀的 search string。

外部 location 进入 store 前，应先格式化：

```txt
?page=1 -> page=1
page=1 -> page=1
empty -> empty
```

Runtime navigate 时，再由 runtime adapter 转换为 `?searchString` 形态。

统一 search 格式可以避免 `page=1` 与 `?page=1` 被误判为不同状态。

## Hook Unmount

Hook unmount 不应自动取消已经提交的 pending entry。

`setValues` 被视为一次已经提交给 store 的 mutation。

如果 unmount 自动取消 entry，可能出现由 optimistic render 触发的组件卸载反向撤销状态，造成难以理解的回滚。

P0 中，hook unmount 只取消订阅，不取消已经提交的 entry。

## 状态组合

Store 不必强行维护单一 enum 状态。

更稳定的方式是由状态组合表达：

```ts
const isDirty = pendingEntries.length > 0
const isFlushing = inflightFlushes.length > 0
```

常见组合：

| confirmed | inflightFlushes | pendingEntries | 含义 |
| --- | --- | --- | --- |
| yes | no | empty | clean |
| yes | no | non-empty | dirty, waiting flush |
| yes | yes | empty | flush sent, waiting confirmation |
| yes | yes | non-empty | flush sent, new optimistic entries exist |

## Navigate Options

P0 public setter 支持 navigate options。

默认策略：

- 默认采用 `replace: true`。
- 支持 `preventScrollReset`。
- flush 使用本次 flush 所消费的 entries 中最后一个 entry 的 options。

resolved options 由默认 options 与最后一个 entry 的显式 options 合并得到。

显式值覆盖默认值。

例如最后一项传入：

```ts
{ preventScrollReset: true }
```

resolved options 应是：

```ts
{ replace: true, preventScrollReset: true }
```

如果最后一项没有显式 options，则使用默认 options。

注意这里不是寻找最后一个带显式 options 的 entry。

如果本次 flush 的最后一个 entry 没有 options，则不使用更早 entry 的 options。

后续可以考虑：

- `replace` 一旦变化就强制 flush。
- 为不同 search slice 建立更明确的 options 合并策略。

真实业务中，search params 更新通常使用 `replace`，以避免 history 中出现大量无效记录。

## Flush Schedule

Store 支持两种 flush schedule 模式：

- `throttle`
- `debounce`

P0 默认采用 `throttle`。

Throttle 模式下，第一次 `setValues` 会启动固定 flush 窗口。窗口内后续 `setValues` 会继续更新 optimistic state 和 pending entries，但不会推迟本次 flush。

Debounce 模式下，每次 `setValues` 都会重新计时。持续更新会持续推迟 flush。

默认使用 throttle 的原因是：如果 debounce delay 设置较长，entry 可能长时间等待持久化，直到 pathname 变化后被丢弃。Throttle 能让 URL 在持续更新中保持相对平滑的同步。

## Navigate Failure

如果 runtime navigate 失败、被 blocker 阻止，或没有收到对应 location confirmation，P0 不暴露错误处理 API。

在未确认前，store 仍以 optimistic state 为准。

后续如果收到无法匹配 `inflightFlushes` 的 external location change，则按外部变化处理：

```txt
confirmedLocation = nextLocation
inflightFlushes = []
latestInflightFlushLocation = undefined
pendingEntries = []
optimisticLocation = nextLocation
```

## Out-of-order Confirmation

P0 不通过 revision 精确区分重复 search 的每一次 flush。

当 `inflightFlushes` 中存在重复 search 时，incoming search 无法单凭字符串判断它对应第一次还是最后一次 flush。

当前规则偏向 React Router 可能合并或延迟 location 通知的行为：

- 使用 `lastIndexOf(search)` 匹配 inflight。
- 命中后移除该 search 及其之前的所有 inflight search。
- 同 pathname 下 inflight 匹配优先于 confirmed noop。

如果未来 runtime 能提供更强的通知 identity，可以引入 version 或 revision 机制，避免重复 search 的归因歧义。
