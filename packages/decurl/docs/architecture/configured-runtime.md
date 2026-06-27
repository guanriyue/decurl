# 配置化 Runtime 优化入口

本文档记录 `@guanriyue/decurl/configured` 的设计边界。

## 背景

默认入口要求开发者可以直接使用：

```ts
import { useSearchValue, useSearchValues } from '@guanriyue/decurl'
```

为了完成零配置接线，默认 hooks 内部会调用 React Router 的 `useLocation` 和 `useNavigate`，再把 runtime capability 配置给 singleton store。

这意味着消费 search state 的页面组件也会订阅 React Router location。

在 flush 完成后，React Router location 同步可能导致一次额外 render。

## 优化入口

`@guanriyue/decurl/configured` 提供 context-only hooks 和 runtime configurer：

```ts
import {
  SearchRuntimeConnector,
  useProvidedSearchValue,
  useProvidedSearchValues,
} from '@guanriyue/decurl/configured'
```

store 由主入口的 `SearchProvider` 提供：

```ts
import { SearchProvider } from '@guanriyue/decurl'
```

configured hooks 不会自动调用 `useConfigureRuntime`，并且不会闭包绑定 store。
hooks 始终从当前 React context 读取 store。如果没有主入口 `SearchProvider`，
provided hooks 会直接抛错。

这意味着 configured 的核心差异不是“绑定某个 store 的 hook”，而是“hook 是否
自带 runtime 配置”。默认入口的 hooks 自带 React Router hooks runtime，适合渲染
次数不敏感、普通 SPA、希望零配置使用的场景。configured 入口的 hooks 不自带
runtime，适合把 runtime 接线集中放在 `SearchRuntimeConnector` 中，从而减少页面
消费组件对 React Router location 的额外订阅。

主入口也可以显式提供 store 配置：

```tsx
<SearchProvider flushDelay={200} flushMode="debounce">
  <App />
</SearchProvider>
```

pagination 是建立在基础 search hooks 之上的领域模块。需要绑定 pagination 时，
通过 pagination 子路径显式组合：

```ts
import { useProvidedSearchValues } from '@guanriyue/decurl/configured'
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

configured 入口用于开发者愿意显式 runtime 接线，以减少页面组件对 React Router
location 的额外订阅。使用 configured 入口时，应搭配主入口 `SearchProvider` 和
configured `SearchRuntimeConnector`。

## Provider 边界

`SearchProvider` 只负责提供 store 和 store options，如 `flushDelay`、`flushMode`。

`SearchRuntimeConnector` 只负责 runtime 接线。

provided hooks 只负责读取最近的 `SearchProvider` store，并订阅 decurl store。

三者边界不应混合。
