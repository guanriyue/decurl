# 配置化 Runtime 优化入口

本文档记录 `decurl/configured` 的设计边界。

## 背景

默认入口要求开发者可以直接使用：

```ts
import { useSearchValue, useSearchValues } from 'decurl'
```

为了完成零配置接线，默认 hooks 内部会调用 React Router 的 `useLocation` 和 `useNavigate`，再把 runtime capability 配置给 singleton store。

这意味着消费 search state 的页面组件也会订阅 React Router location。

在 flush 完成后，React Router location 同步可能导致一次额外 render。

## 优化入口

`decurl/configured` 提供 factory：

```ts
import { createReactRouterSearch } from 'decurl/configured'

const search = createReactRouterSearch()
```

factory 会创建独立 store，并返回绑定该 store 的：

- `RuntimeConfigurer`
- `RouterRuntimeConfigurer`
- `Provider`
- `useSearchValues`
- `useSearchValue`

绑定 hooks 不会自动调用 `useConfigureRuntime`。

pagination 是建立在基础 search hooks 之上的领域模块，不由 configured factory 自动创建。需要绑定 pagination 时，通过 pagination 子路径显式组合：

```ts
import { createReactRouterSearch } from 'decurl/configured'
import { createUseSearchPagination } from 'decurl/pagination'

const search = createReactRouterSearch()
const useSearchPagination = createUseSearchPagination({
  useSearchValues: search.useSearchValues,
})
```

绑定后的 pagination hook 与默认 `useSearchPagination` 具有相同能力，并携带相同语义的静态属性：

```ts
useSearchPagination.fields
useSearchPagination.pageSizeOptions
```

调用 Hook 时可以通过 `UseSearchPaginationOptions` 配置 `pageSizeChangeStrategy`。调用 `setPage`、`setPageSize` 或 `setPagination` 时，可以单独传入 `SearchNavigateOptions`。完整使用边界见 [useSearchPagination Guide](../guide/use-search-pagination.md)。

如果使用 `Provider`，Provider 会自动完成 runtime 接线。

`RuntimeConfigurer` 只用于不使用 Provider、但仍希望显式完成接线的场景。

如果 Provider 收到 `router` prop，则使用 router instance runtime 接线。

## BrowserRouter 使用约束

使用 `BrowserRouter` 等组件式 Router 时，`Provider` 必须位于 Router 内部，并包裹所有消费绑定 hooks 的组件。

推荐结构：

```tsx
<BrowserRouter>
  <search.Provider>
    <App />
  </search.Provider>
</BrowserRouter>
```

如果不使用 Provider，也可以只放置配置器：

```tsx
<BrowserRouter>
  <search.RuntimeConfigurer />
  <App />
</BrowserRouter>
```

此时 `RuntimeConfigurer` 必须先于任何消费绑定 hooks 的组件渲染。

如果 Route 页面先于 Provider 或 `RuntimeConfigurer` 完成接线，并且页面调用了绑定的 `useSearchValues` 或 `useSearchValue`，store 会因为 runtime 尚未配置而抛出初始化错误。

## RouterProvider 使用约束

`RouterProvider` / Data Router 场景可以把 router instance 直接传给 Provider：

```tsx
const router = createBrowserRouter(routes)
const search = createReactRouterSearch()

<search.Provider router={router}>
  <RouterProvider router={router} />
</search.Provider>
```

`router` 类型使用 React Router 的 `DataRouter` 能力边界：

```ts
type ReactRouterInstance = Pick<
  DataRouter,
  'navigate' | 'state' | 'subscribe'
>
```

Provider 会使用：

- `router.state.location` 读取当前 location。
- `router.navigate('?search', options)` 持久化 search。
- `router.subscribe` 接收 location change。

如果不需要 Provider，也可以只使用 router instance 配置器：

```tsx
<search.RouterRuntimeConfigurer router={router} />
```

此配置器只负责接线，不提供 context。

## 与默认入口的关系

默认入口保留零配置能力：

```ts
import { useSearchValue, useSearchValues } from 'decurl'
```

配置化入口用于开发者愿意显式选择多实例 store 或显式 runtime 接线，以减少页面组件对 React Router location 的额外订阅。

两种入口不应混用同一个 store。

## Provider 边界

`Provider` 提供 factory 绑定的 store，并自动完成 runtime 接线。

未传入 `router` 时，Provider 通过内部 `RuntimeConfigurer` 使用 React Router hooks runtime 接线。

传入 `router` 时，Provider 使用 router instance runtime 接线。

Provider 不负责自动寻找 Router。

开发者必须显式传入 router instance。
