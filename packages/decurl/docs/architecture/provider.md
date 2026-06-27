# Provider

本文档用于记录 Provider 的边界。

默认入口提供 `SearchProvider`，但它是可选的。

没有 `SearchProvider` 时，默认入口使用 global store 和 React Router hooks
runtime。

有 `SearchProvider` 时，主入口 hooks 会读取 Provider store，并仍然在 hook
consumer 内部自动配置 React Router hooks runtime。

`SearchProvider` 只负责提供 store 和 store options，例如 `flushDelay`、
`flushMode`。它不负责 runtime 接线。

Provider 解决多实例 store 问题。

`SearchRuntimeConnector` 解决显式接线问题。

使用 provided hooks 时，需要同时渲染 `SearchProvider` 和
`SearchRuntimeConnector`，并且 connector 必须先于任何调用 provided hooks 的组件
渲染。

## 非目标

`SearchProvider` 不实现：

- React Router hooks runtime 接线。
- React Router router instance runtime 接线。
- 自动寻找 Router。

这些能力由 provided subpath 中的 `SearchRuntimeConnector` 显式完成。

## 扩展边界

Provider 可以用于：

- 注入默认 navigate options。
- 注入默认 flush 配置。
- 支持更多微前端或嵌套 router 场景。

Provider store 与默认 singleton store 应互相隔离。

如果业务同时存在多个 React Router context 或微前端容器，应优先使用
`SearchProvider`，而不是共享 global store。

所有公开 hook 都应从当前 React context 读取 store。provided subpath 的
provided hooks 只是不自带 runtime 配置，用于避免页面消费组件额外订阅 React
Router location；它们不应闭包绑定某个 store。
