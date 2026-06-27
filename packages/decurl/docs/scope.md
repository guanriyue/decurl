# React Router 职责范围

`decurl` 负责将 Decurl 的 URLSearchParams codec 能力接入 React 和 React Router。

这个包的核心目标是提供 schema-first 的 search params state，以及基于 React Router path pattern 的类型安全 URL contract。业务开发者优先面对 decoded data 和业务值，而不是手写 `URLSearchParams` 或 URL 字符串。

## 职责

- 基于 React Router 读取当前 location。
- 基于 React Router 执行 search params 导航。
- 提供 decoded data 形态的 search state hook。
- 支持 partial update。
- 支持连续 patch 合并。
- 支持 optimistic state，使 `setValues` 后 React render 立即反映新状态。
- 支持 pending flush，将 URL 同步延迟到一个短窗口后执行。
- 提供常用分页 search state hook，复用同一套 optimistic URL state 语义。
- 定义 path pattern、path params 和 search definition 组成的 route spec。
- 使用 React Router `generatePath` 和当前包内 codec 生成类型安全 href。
- 为后续 Provider、多 runtime 和高级能力保留内部边界。

## Codec 边界

Codec/schema 约束现在由当前包内的 `codec` 与 `decode` 模块提供。

当前应优先使用：

- `decurl/codec`
- `decurl/decode`

React Router runtime 不应重新定义 codec 语义。如果实现过程中发现 codec 缺少必要能力，应先在 codec/decode 层补齐设计和测试，再让 React Router runtime 消费。

## 当前非目标

- 在 React Router runtime 中绕过或改写 codec 语义。
- 暴露 `URLSearchParams` 作为主 API。
- 暴露 pending patch handle。
- 暴露手动撤销 API。
- 实现完整 undo/history 机制。
- 实现 route search memory。
- 实现 `window.navigation` runtime。
- 实现 Provider 高级配置。
- 实现数据请求、表格状态、排序筛选联动等业务分页能力。
- 接管分页请求的 loading、error、retry、竞态取消或生命周期管理。

这些能力可以在后续阶段讨论，但不应进入 P0 实现。
