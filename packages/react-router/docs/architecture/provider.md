# Provider

本文档用于记录 Provider 的边界。

默认入口不提供 Provider。

P0 默认使用 singleton store 和 React Router hooks runtime。

配置化优化入口可以通过 `@decurl/react-router/configured` 创建绑定 store 的
`Provider`。该 Provider 负责提供 factory 创建的 store，并自动通过 React Router
hooks runtime 完成接线。

如果 Provider 收到 `router` prop，则改用 router instance runtime 接线。

Provider 解决多实例 store 问题。

RuntimeConfigurer 解决显式接线问题。

使用 Provider 时，不需要再额外渲染 RuntimeConfigurer。

## 非目标

默认入口不实现：

- Provider 注入默认配置。
- 多实例 store。
- 微前端隔离。

这些能力属于后续高级形态，或由 configured subpath 中的 factory 显式创建。

## 后续边界

后续 Provider 可以用于：

- 创建独立 store。
- 注入 runtime。
- 注入默认 navigate options。
- 注入默认 flush 配置。
- 支持更多微前端或嵌套 router 场景。

Provider store 与默认 singleton store 应互相隔离。

如果业务同时存在多个 React Router context 或微前端容器，应优先使用未来 Provider 形态，而不是共享 singleton store。
