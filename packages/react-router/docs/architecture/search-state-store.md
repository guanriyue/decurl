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
  inflightFlush?: InflightFlush
}

type SearchLocation = {
  pathname: string
  search: string
}

type InflightFlush = {
  pathname: string
  search: string
}
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

### inflightFlush

`inflightFlush` 表示 decurl 已经调用 runtime navigate，但 React Router 还没有确认的持久化目标。

它用于区分：

- decurl 自己 flush 导致的 location change。
- 外部系统导致的 location change。

匹配 `inflightFlush` 时，`pathname` 和 `search` 都是重要基准。

`hash` 和 `state` 不纳入 search state 状态机考量。

## Visible Search

正常 dirty 阶段：

```ts
optimisticLocation = replay(confirmedLocation, pendingEntries)
```

flush 已发出但尚未确认时：

```ts
optimisticLocation = replay(inflightFlush, pendingEntries)
```

换句话说，visible base 是：

```ts
const visibleBase = inflightFlush ?? confirmedLocation
const optimisticLocation = replay(visibleBase, pendingEntries)
```

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
base = inflightFlush ?? confirmedLocation
entry = createEntry(base, apply, options)
pendingEntries.push(entry)
optimisticLocation = replay(base, pendingEntries)
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
inflightFlush = flushTarget
pendingEntries = []
runtime.navigate(flushTarget, resolvedOptions)
```

如果 flush target 与当前已确认 location 相同，则作为 no-op。

此时不应调用 runtime navigate，也不应创建新的 `inflightFlush`。

flush 后再发生的 `setValues` 会进入新的 `pendingEntries`。

此时业务看到的状态是：

```txt
replay(inflightFlush, pendingEntries)
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

### Decurl Flush Confirmation

如果 next location 与 `inflightFlush` 匹配：

```txt
confirmedLocation = nextLocation
inflightFlush = undefined
optimisticLocation = replay(confirmedLocation, pendingEntries)
notify subscribers if optimistic changed
```

匹配必须至少包含：

- `pathname`
- `search`

只匹配 `search` 不够，因为外部 navigation 可能带着相同 search 切换到另一个 pathname。

`hash` 和 `state` 被忽略。

即使 next location 与当前 `optimisticLocation` 不同，也不代表外部覆盖。

它可能只是 React Router 正在确认 decurl 之前发出的 flush，而 decurl 在确认到达前又收到了新的 `setValues`。

### External Location Change

如果 next location 不匹配 `inflightFlush`，则视为外部 location change。

```txt
confirmedLocation = nextLocation
inflightFlush = undefined
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

且该 navigation 不是 decurl 当前 `inflightFlush` 的确认，则它属于 external location change。

P0 行为：

```txt
confirmedLocation = nextLocation
inflightFlush = undefined
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
const isFlushing = inflightFlush !== undefined
```

常见组合：

| confirmed | inflightFlush | pendingEntries | 含义 |
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

后续如果收到无法匹配 `inflightFlush` 的 external location change，则按外部变化处理：

```txt
confirmedLocation = nextLocation
inflightFlush = undefined
pendingEntries = []
optimisticLocation = nextLocation
```

## Out-of-order Confirmation

P0 暂不处理复杂乱序 confirmation。

正常 React Router 同线程导航中，乱序 confirmation 很少出现。

后续如果需要更强的时序一致性，可以引入 version 或 revision 机制。

当前规则：

- 只有匹配当前 `inflightFlush` 的 location change 才是 decurl flush confirmation。
- 不能匹配当前 `inflightFlush` 的 location change 视为 external location change。
