# Runtime 边界

本文档用于记录 React Router runtime 与可替换 runtime 的边界。

## 目标

Runtime 是 Store 与外部路由系统之间的边界。

Store 只负责 search state 的同步语义、pending journal、optimistic state 和 flush 时序。

Runtime 负责：

- 提供当前 location。
- 将 decurl 的 flush 结果持久化到路由系统。
- 在可订阅 runtime 中通知 store location change。

## 最小接口

概念接口：

```ts
type SearchRuntime = {
  getLocation: () => SearchLocation
  navigate: (
    location: SearchLocation,
    options?: SearchNavigateOptions,
  ) => void | Promise<void>
  subscribe?: (listener: (location: SearchLocation) => void) => () => void
}

type SearchLocation = {
  pathname: string
  search: string
}

type NavigateSearch = `?${string}`

type SearchNavigateOptions = {
  replace?: boolean
  preventScrollReset?: boolean
}
```

`SearchNavigateOptions` 是 runtime navigate 的能力边界。

public setter 支持传入 navigate options。

Store flush 时会把 resolved navigate options 交给 runtime。

默认采用 `replace: true`。

支持透传 `preventScrollReset`。

`SearchLocation.search` 在 decurl 内部统一不带 `?` 前缀。

Runtime 可以返回 React Router 原始 search。

Store 接收 runtime location 或 location change 时，会统一去除 `?`。

Runtime 调用底层 navigate 时，应转换为 `NavigateSearch`，即 `?searchString` 形态。

React Router navigate 和 `window.navigation.navigate` 都支持这种调用形式。

`SearchLocation.search` 和 `NavigateSearch` 是不同概念，不应混用。

`subscribe` 是可选能力。

默认 hook 可以通过 React Router hooks 感知 location 变化，不要求 runtime 自身必须可订阅。

configured Provider 可以使用可订阅 runtime，例如基于 React Router router instance 的 runtime。

## Navigate 约束

flush 到 URL 时，必须通过 runtime 的 `navigate`。

默认 React Router runtime 中，`navigate` 必须最终调用 React Router 提供的 navigate 能力。

Store 不应直接调用：

- `window.history.pushState`
- `window.history.replaceState`
- `window.navigation.navigate`
- 手写 popstate 派发

原因是 React Router 需要感知导航行为。绕过 React Router 可能导致 location、loader、navigation state 和 route matching 不一致。

## 默认 React Router Runtime

无 configured factory 时，默认 `useSearchValues` / `useSearchValue` 使用默认 React Router runtime。

默认 runtime 由 hook 内部通过 React Router hooks 组装：

```ts
const location = useLocation()
const navigate = useNavigate()
```

默认 runtime 的职责：

- 提供从 `useLocation()` 派生的当前 `pathname` 和 normalized search。
- flush 时调用 `useNavigate()` 返回的 navigate。

默认 runtime 可以不提供 `subscribe`。

此形态适合绝大多数业务页面，开发者不需要显式 Provider。

## Singleton Runtime Binding

默认形态下，store 是 singleton，但 React Router 的 `navigate` 只能通过 hook 调用 `useNavigate()` 获得。

因此 singleton store 不能自己创建 runtime，也不能在模块初始化时读取 `navigate`。

Hook 需要把当前 render 中获得的 runtime capability 告知 store：

```ts
const location = useLocation()
const navigate = useNavigate()

store.configureRuntime({
  getLocation: () => ({
    pathname: location.pathname,
    search: location.search,
  }),
  navigate: (nextLocation, options) => {
    navigate(toNavigateSearch(nextLocation), options)
  },
})
```

`configureRuntime` 属于 store 配置更新。

它不改变 search state，不应触发 subscribers，也不应导致 search hooks 重新 render。

这类配置可以在 render 阶段更新。实现时应保证它只替换 runtime 引用，不执行 navigate、不 flush、不 notify。

`configureRuntime` 默认幂等。

调用一次和调用多次应产生相同效果。

配置更新本身可以被视为静态数据配置：

- 可以重复调用。
- 重复调用不改变 search state。
- 不参与 React state 调度。

原因是 runtime capability 本身不属于 React state，也不由 React 调度。

例如 `navigate` 只有在真实导航事件发生时才有意义。导航事件通常来自 redirect、link click、button click 或其他浏览器/用户行为。

配置 `navigate` 引用本身不应被视为一次状态变化。

默认 React Router capability 仍必须在合法 React hook 环境中取得。

也就是说，可以重复配置已经取得的 capability，但不能在 React hook 规则之外调用 `useLocation()` 或 `useNavigate()`。

## Hash And State

Search runtime 只服务 search state。

`hash` 和 route `state` 不纳入 search state。

Store 的匹配和比较规则由 [Search State Store 状态机](search-state-store.md) 定义。

是否保留、透传或忽略 hash/state，是 runtime adapter 构造 React Router `to` 时的实现细节；它不应影响 search state 状态机。

## Store 与 Hook 的协作

默认形态下，React hook 负责把 React Router location 变化同步给 store：

```txt
React Router location changed
  -> hook effect/sync path
  -> store.locationChanged(nextLocation)
```

Store 再根据状态机判断：

- decurl flush confirmation。
- external location change。

Hook 不应自行合并 pending entry，也不应自行判断 location change 来源。

这些规则属于 store 状态机。

## Router Instance Runtime

基于 router instance 的 runtime 不进入默认入口，但 configured 入口支持显式传入 router instance。

Provider 边界和使用场景见 [Provider 边界](provider.md)。

基于 React Router router instance 的 runtime 可以概念化为：

```ts
const runtime = {
  getLocation: () => router.state.location,
  navigate: (location, options) =>
    router.navigate(toNavigateSearch(location), options),
  subscribe: (listener) =>
    router.subscribe((state) => {
      listener(state.location)
    }),
}
```

`router.subscribe` 在 React Router 类型中可能被标记为 private。router instance runtime 可以作为 configured 高级能力支持，但不应成为默认入口的使用方式。

## Runtime 不负责的事情

Runtime 不负责：

- decode schema。
- encode schema patch。
- pending journal replay。
- optimistic state。
- location change 归因。
- flush debounce。
- hook render 订阅。

这些都属于 Store 或 React Bridge。

## 非目标

Runtime 不提供基于 `window.navigation` 的默认版本。

自定义 runtime 不能改变默认 React Router runtime 行为。
