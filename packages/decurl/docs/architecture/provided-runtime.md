# Provided Runtime 优化入口

本文档记录 `@guanriyue/decurl/provided` 的设计边界。

## 背景

默认入口要求开发者可以直接使用：

```ts
import { useSearchValue, useSearchValues } from '@guanriyue/decurl'
```

`SearchProvider` 始终是可选的。没有 `SearchProvider` 时，默认入口 hooks 使用
global store；有 `SearchProvider` 时，默认入口 hooks 使用最近的 Provider store。
这两种情况下，默认入口的 `useSearchValue` 和 `useSearchValues` 都可以直接使用。

为了完成零配置接线，默认 hooks 内部会调用 React Router 的 `useLocation` 和 `useNavigate`，再把 runtime capability 配置给 singleton store。

这意味着消费 search state 的页面组件也会订阅 React Router location。

在 flush 完成后，React Router location 同步可能导致一次额外 render。

## 优化入口

`@guanriyue/decurl/provided` 提供 context-only hooks 和 runtime connector：

```ts
import {
  SearchRuntimeConnector,
  useProvidedSearchValue,
  useProvidedSearchValues,
} from '@guanriyue/decurl/provided'
```

store 由主入口的 `SearchProvider` 提供：

```ts
import { SearchProvider } from '@guanriyue/decurl'
```

provided hooks 不会自动调用 `useConfigureRuntime`，并且不会闭包绑定 store。
hooks 始终从当前 React context 读取 store。如果没有主入口 `SearchProvider`，
provided hooks 会直接抛错。

这意味着 provided 入口的核心差异不是“绑定某个 store 的 hook”，而是“hook 是否
自带 runtime 配置”。默认入口的 hooks 自带 React Router hooks runtime，适合渲染
次数不敏感、普通 SPA、希望零配置使用的场景。provided 入口的 hooks 不自带
runtime，适合把 runtime 接线集中放在 `SearchRuntimeConnector` 中，从而减少页面
消费组件对 React Router location 的额外订阅。

provided 能力强依赖 `SearchProvider` 和 `SearchRuntimeConnector`：

- `SearchProvider` 必须提供 store。
- `SearchRuntimeConnector` 必须先于任何调用 provided hooks 的组件渲染。
- `useProvidedSearchValue` / `useProvidedSearchValues` 不会替开发者补齐 runtime。

主入口也可以显式提供 store 配置：

```tsx
<SearchProvider flushDelay={200} flushMode="debounce">
  <App />
</SearchProvider>
```

pagination 是建立在基础 search hooks 之上的领域模块。需要绑定 pagination 时，
通过 pagination 子路径显式组合：

```ts
import { useProvidedSearchValues } from '@guanriyue/decurl/provided'
import { createUseSearchPagination } from '@guanriyue/decurl/pagination'

const useSearchPagination = createUseSearchPagination({
  useSearchValues: useProvidedSearchValues,
})
```

绑定后的 pagination hook 与默认 `useSearchPagination` 具有相同能力，并携带相同语义的静态属性：

```ts
useSearchPagination.fields
useSearchPagination.pageSizeOptions
```

调用 Hook 时可以通过 `UseSearchPaginationOptions` 配置 `pageSizeChangeStrategy`。调用 `setPage`、`setPageSize` 或 `setPagination` 时，可以单独传入 `SearchNavigateOptions`。完整使用边界见 [useSearchPagination Guide](../guide/use-search-pagination.md)。

`SearchRuntimeConnector` 只负责 runtime 接线，不提供 store。

## 优化代价

provided 入口是主入口 hooks 的优化写法。它通过把 React Router runtime 接线集中到
`SearchRuntimeConnector`，让业务组件调用 `useProvidedSearchValue` 或
`useProvidedSearchValues` 时不再直接订阅 React Router location。

这个优化是有代价的：

- 需要额外渲染 `SearchProvider`。
- 需要额外渲染 `SearchRuntimeConnector`。
- 组件层级必须保证 connector 先于 provided hooks 渲染。
- 组合 hook 需要显式绑定 provided hooks，例如 pagination 需要通过
  `createUseSearchPagination` 组合。

并且，这个优化不保证业务页面的 render 次数一定减少。

flush 完成后，URL search 变化本质上仍是一次 React Router location 变化。React
Router 会把 location change 视为路由状态更新，并可能重新渲染它控制下的 route
tree。即使 provided hooks 本身不直接连接 React Router，route 页面仍然由 React
Router 控制渲染，因此页面组件可能仍会因为 React Router 的更新机制重新 render。

如果业务页面仍受到 route tree 重渲染影响，需要在业务侧继续使用 React 的常规优化
手段，例如：

- 将昂贵子树拆到更小组件。
- 对不直接依赖 route state、hook 的子组件使用 `React.memo`。
- 保持传给 memo 组件的 props 引用稳定。

这也是 provided 优化入口没有放到主入口的原因之一。主入口优先提供零配置、低心智
成本、普遍适用的 hooks；provided 入口只面向确实需要控制渲染订阅边界的场景。

## BrowserRouter 使用约束

使用 `BrowserRouter` 等组件式 Router 时，`SearchProvider` 必须位于 Router 内部，
并包裹 `SearchRuntimeConnector` 和所有消费 provided hooks 的组件。

推荐结构：

```tsx
<BrowserRouter>
  <SearchProvider>
    <SearchRuntimeConnector />
    <App />
  </SearchProvider>
</BrowserRouter>
```

`SearchRuntimeConnector` 必须先于任何消费 provided hooks 的组件渲染。如果页面
先于 configurer 完成接线，并且页面调用了 `useProvidedSearchValues` 或
`useProvidedSearchValue`，store 会因为 runtime 尚未配置而抛出初始化错误。

## RouterProvider 使用约束

`RouterProvider` / Data Router 场景可以把 router instance 传给
`SearchRuntimeConnector`：

```tsx
const router = createBrowserRouter(routes)

<SearchProvider>
  <SearchRuntimeConnector router={router} />
  <RouterProvider router={router} />
</SearchProvider>
```

`router` 类型使用 React Router 的 `DataRouter` 能力边界：

```ts
type ReactRouterInstance = Pick<
  DataRouter,
  'navigate' | 'state' | 'subscribe'
>
```

Router instance runtime 会使用：

- `router.state.location` 读取当前 location。
- `router.navigate('?search', options)` 持久化 search。
- `router.subscribe` 接收 location change。

## 与默认入口的关系

默认入口保留零配置能力：

```ts
import { useSearchValue, useSearchValues } from '@guanriyue/decurl'
```

主入口的 hooks 会从当前 `SearchProvider` 读取 store；如果没有 Provider，则读取
默认 global store。它们会在 hook consumer 内部自动配置 React Router hooks
runtime。

provided 入口用于开发者愿意显式 runtime 接线，以减少页面组件对 React Router
location 的额外订阅。使用 provided 入口时，应搭配主入口 `SearchProvider` 和
provided `SearchRuntimeConnector`。

因此推荐决策顺序是：

1. 默认使用主入口 `useSearchValue` / `useSearchValues`。
2. 需要配置 store 行为时，在主入口加可选的 `SearchProvider`。
3. 只有当页面对 render 次数敏感，并且确认默认 hooks 对 React Router location 的
   订阅带来额外成本时，再切换到 provided 入口。

## Provider 边界

`SearchProvider` 只负责提供 store 和 store options，如 `flushDelay`、`flushMode`。

`SearchRuntimeConnector` 只负责 runtime 接线。

provided hooks 只负责读取最近的 `SearchProvider` store，并订阅 decurl store。

三者边界不应混合。
