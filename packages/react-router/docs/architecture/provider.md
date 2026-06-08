# Provider

本文档用于记录 Provider 的边界。

Provider 不进入 P0。

P0 默认使用 singleton store 和 React Router hooks runtime。

## 非目标

P0 不实现：

- Provider 组件。
- Provider 注入默认配置。
- Provider 注入 runtime。
- 多实例 store。
- 微前端隔离。
- 基于 router instance 的直接订阅。

这些能力属于后续高级形态。

## 后续边界

后续 Provider 可以用于：

- 创建独立 store。
- 注入 runtime。
- 注入默认 navigate options。
- 注入默认 flush 配置。
- 支持微前端或嵌套 router 场景。

Provider store 与默认 singleton store 应互相隔离。

如果业务同时存在多个 React Router context 或微前端容器，应优先使用未来 Provider 形态，而不是共享 singleton store。
