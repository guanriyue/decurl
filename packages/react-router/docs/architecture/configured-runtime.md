# 配置化 Runtime 优化入口

本文档记录 `@decurl/react-router/configured` 的设计边界。

## 背景

默认入口要求开发者可以直接使用：

```ts
import { useSearchValue, useSearchValues } from '@decurl/react-router'
```

为了完成零配置接线，默认 hooks 内部会调用 React Router 的 `useLocation` 和 `useNavigate`，再把 runtime capability 配置给 singleton store。

这意味着消费 search state 的页面组件也会订阅 React Router location。

在 flush 完成后，React Router location 同步可能导致一次额外 render。

## 优化入口

`@decurl/react-router/configured` 提供 factory：

```ts
import { createReactRouterSearch } from '@decurl/react-router/configured'

const search = createReactRouterSearch()
```

factory 会创建独立 store，并返回绑定该 store 的：

- `RuntimeConfigurer`
- `Provider`
- `useSearchValues`
- `useSearchValue`

绑定 hooks 不会自动调用 `useConfigureRuntime`。

如果使用 `Provider`，Provider 会自动完成 runtime 接线。

`RuntimeConfigurer` 只用于不使用 Provider、但仍希望显式完成接线的场景。

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

## 与默认入口的关系

默认入口保留零配置能力：

```ts
import { useSearchValue, useSearchValues } from '@decurl/react-router'
```

配置化入口用于开发者愿意显式选择多实例 store 或显式 runtime 接线，以减少页面组件对 React Router location 的额外订阅。

两种入口不应混用同一个 store。

## Provider 边界

`Provider` 提供 factory 绑定的 store，并通过内部 `RuntimeConfigurer` 自动完成 React Router hooks runtime 接线。

它不负责自动寻找 Router，也不直接订阅 router instance。

Data Router 的 `router.subscribe` 接入属于后续能力。
