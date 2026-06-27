# Pagination Overflow Coordination

本文记录分页溢出修正的数据一致性目标、请求状态判断难点，以及 pagination API 的实现边界。

## 问题背景

分页请求通常在响应返回后才能获得 `total`，因此请求前无法完整判断当前 `page` 是否超过最大页码。本文把 `page > pageCount` 统一称为页码溢出。

页码溢出通常不是当前用户通过正常分页交互产生的，也不一定表示 search state 或分页组件存在实现错误。它更多来自当前客户端无法提前观测的外部变化，或者来自缺少 `total` 信息的独立状态更新。

## 普通交互中的边界控制

真实业务中的 pagination 组件一般会在派发页码变化前执行严格的 clamp：

```ts
onChange(clamp(nextPage, 1, pageCount))
```

UI 通常还会：

- 在第一页禁用 previous 按钮
- 在最后一页禁用 next 按钮
- 把页码输入限制在 `1` 到 `pageCount` 之间
- 在 `pageSize` 变化时重置页码或保持当前 item offset

因此，当前用户通过标准 pagination 组件操作时，一般不会主动产生无效页码。`preventOverflow` 不应替代这些交互约束。

## 页码溢出的来源

当前客户端无法提前观测的变化包括：

- 用户手动修改 URL
- 浏览器历史记录或他人分享的链接对应的数据已经被清理
- 多人操作同一份数据，其他用户删除数据后总页数减少
- 其他组件修改服务端数据，但没有同步当前组件使用的缓存

同一个系统内部也可能产生溢出。例如 X 组件是拥有 `total` 和 `pageCount` 的 pagination 组件，会对目标页码执行 clamp；Y 组件只负责 `page + 1` 或 `page - 1`，既没有 `total`，也不关心最大页码。Y 组件就可能写入无效 `page`。

这种 Y 组件并不常见，因为它可能把用户带到没有数据可看的页面。更优先的方案是让产生分页交互的组件获得边界信息。请求后的页码修正用于处理无法提前获得边界的剩余场景。

## 显式恢复

`useSearchPagination` 提供 `preventOverflow(totalSource)`。调用方在确认请求结果可信后显式执行：

```ts
onSuccess(data) {
  pagination.preventOverflow(data.total)
}
```

这种方式把数据可信性的判断交给拥有请求上下文的调用方。`preventOverflow` 只计算最大页码，并在当前页码溢出时修正 URL 状态。

它不能保证每次分页状态变化都会执行。SWR dedupe 等请求复用机制可能让相同结果不再触发成功回调。`preventOverflow` 因此是一次性的恢复操作，不是持续维护分页不变量的机制。具体场景见下文的 Dedupe 与 Stale Cache。

## 响应式协调

pagination 模块不导出响应式 guard。以下内容只记录一种数据一致性更严格的约束模型，不属于公开 API。

其概念接口如下：

```ts
usePaginationGuard(pagination, {
  total,
  ready,
})
```

Guard 可以监听 `page`、`pageSize`、`total` 和 `ready`。只要当前数据边界可以参与计算，即使请求库没有再次执行 fetcher 或成功回调，它也可以重新检查分页状态。

在 `ready` 判断正确的前提下，这种方式比单次调用 `preventOverflow` 更完整。它还可以派生：

```ts
type PaginationGuardResult = {
  pageCount: number | undefined
  isOverflow: boolean
}
```

其中 `pageCount` 与 `total` 是否存在保持同步。`isOverflow` 只在 `ready` 为 `true`、`total` 是数字且当前 `page` 超过 `pageCount` 时为 `true`。

## Ready 的语义

`ready` 表示当前请求状态已经允许执行页码修正。它不仅表示存在 `data`，还要求当前 `total` 可以作为当前查询条件和分页状态的可信边界。

如果 guard 错误接受了 previous data 或 stale cache，它可能使用不属于当前查询或已经不符合服务端现状的 `total` 修改 URL。请求库随后即使丢弃 stale 响应或返回更新的数据，也无法撤回已经发生的导航副作用。

cache 与当前 query key 对应，只能说明这份数据与该查询匹配过，不能说明它仍然符合服务端当前状态。cache 可以用于暂时渲染 stale 内容，但不一定适合直接触发 URL 修正。

因此，ready 判断需要避免两类错误：

- False negative：可信 total 已经存在，但没有执行修正，页面暂时停留在无效页码
- False positive：不可信 total 被用于修正，页面被导航到不应该进入的页码

False positive 会主动改变 URL 和后续请求，通常比暂时保留无效页码更难恢复。

## SWR

SWR 提供 `data`、`error`、`isLoading` 和 `isValidating`，但这些状态不能完整说明当前数据的来源。

一种保守判断看起来可以写成：

```ts
const ready =
  data !== undefined &&
  !error &&
  !isLoading &&
  !isValidating
```

实际配置仍会影响语义：

- `fallback` 和 `fallbackData` 可以在请求完成前提供数据
- `keepPreviousData` 可以在 key 改变后继续返回上一个 key 的结果
- cache 命中时可能先渲染已有数据，再开始重新验证
- dedupe 可能复用已有请求结果，不产生新的成功回调
- 禁止 mount revalidation 或暂停请求时，fallback、previous data 和 cache 可能在没有验证过程的情况下保持稳定

SWR result 没有与 React Query `isFetchedAfterMount` 完全等价的数据来源标记。仅根据公开 result 编写通用 helper，无法同时保证接受可信缓存并拒绝所有 stale 数据。

## Dedupe 与 Stale Cache

dedupe 和 stale cache 会产生方向不同的问题。

dedupe 可能让可信的已有请求结果不再触发成功回调：

```text
page=999
→ 请求成功并修正到最大页码
→ 短时间内再次设置 page=999
→ SWR dedupe 复用已有请求结果
→ onSuccess 没有再次触发
→ 无效页码没有得到修正
```

这是一次漏修正，属于 false negative。

stale cache 则可能产生错误修正。假设 query key 已经包含 `page=20` 和 `pageSize=10`，并且此前访问过这个当时无效的页码：

```text
SWR cache 保存 page=20 对应的 { total: 100 }
→ 另一个组件新增 100 条数据，服务端 total 变成 200
→ page=20 现在已经是合法页码
→ 用户再次进入 page=20
→ SWR 先返回 stale cache 中的 total=100
→ guard 计算 stale pageCount=10
→ guard 错误地把 page 从 20 修正为 10
```

这里必须命中与当前分页参数对应的 cache key。如果 query key 包含 `page`，其他页码的 cache 不会自动成为 `page=20` 的结果。

stale `total` 偏大时，guard 可能漏掉本应发生的修正；stale `total` 偏小时，guard 可能把合法页码错误地修小。后者会主动改变 URL 和后续请求，因此风险更高。

## React Query

React Query 提供更丰富的查询状态，例如：

```ts
const ready =
  query.isSuccess &&
  query.isFetchedAfterMount &&
  !query.isFetching &&
  !query.isPlaceholderData
```

这些条件可以拒绝 placeholder data 和挂载前缓存，但不同配置仍然会改变结果：

- `placeholderData` 会让 query 进入 success 状态，因此必须额外检查 `isPlaceholderData`
- `keepPreviousData` 通过 placeholder data 语义保留上一份分页数据
- fresh cache 可能不重新请求，因此 `isFetchedAfterMount` 会持续为 `false`
- SSR hydration 和 `initialData` 也可能在 mount 前进入 cache
- `staleTime`、`refetchOnMount` 和 `enabled` 决定是否存在 mount 后请求

如果移除 `isFetchedAfterMount`，guard 会接受更多缓存，但也可能使用已经过期的 `total`。如果保留它，fresh cache 和部分预加载场景可能永远不会进入 ready 状态。

## 多人删除

多人删除是 `preventOverflow` 能够自然处理的场景，也说明严格的 UI clamp 不能覆盖外部变化：

```text
pageSize=10，total=101，pageCount=11
→ A 用户位于第 10 页，next 按钮根据当前已知 pageCount 仍然可用
→ B 用户删除 1 条数据，服务端 total 变成 100，pageCount 变成 10
→ A 用户点击 next，进入第 11 页
→ 第 11 页请求返回 data=[]，total=100
→ preventOverflow(100)
→ page 修正为 10
```

A 的 pagination 组件没有违反 clamp 规则，它使用的是删除发生前最后一次可观测到的 `pageCount`。如果客户端没有重新请求，就没有新的服务端边界可供任何前端机制判断。重新聚焦、轮询、mutation 后重新验证或业务事件刷新仍然是发现外部变化的前提。

## 实现边界

pagination 模块采用以下边界：

- 提供 `preventOverflow(totalSource)` 作为显式恢复操作
- 由开发者判断请求结果是否可信以及何时调用
- 分页 UI 负责普通用户交互中的页码限制
- 不提供通用 `ready` 推导
- 不提供 SWR 或 React Query 专用 guard
- 不保证 cache 或 dedupe 场景下一定执行页码修正

这个边界优先避免库根据不可信数据主动修改 URL，同时保留开发者在确定数据来源后修正页码的能力。

## 非公开 API 边界

响应式 guard 不进入公开 API，原因包括：

- 请求库缺少统一、稳定的数据来源或结果版本标记
- 不同 cache 策略下的默认信任规则难以统一
- SWR、React Query 等生态 adapter 会引入额外 optional peer dependency
- False positive 的导航风险需要由应用根据数据策略控制

调用方应在拥有请求上下文的位置显式调用 `preventOverflow`。
