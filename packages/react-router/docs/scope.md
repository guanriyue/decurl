# React Router 职责范围

`@decurl/react-router` 负责将 `@decurl/core` 的 URLSearchParams codec 能力接入 React 和 React Router。

这个包的核心目标是提供一个 schema-first 的 search params state hook。业务开发者优先面对 decoded data，而不是 `URLSearchParams` 实例。

## 职责

- 基于 React Router 读取当前 location。
- 基于 React Router 执行 search params 导航。
- 提供 decoded data 形态的 search state hook。
- 支持 partial update。
- 支持连续 patch 合并。
- 支持 optimistic state，使 `setValues` 后 React render 立即反映新状态。
- 支持 pending flush，将 URL 同步延迟到一个短窗口后执行。
- 为后续 Provider、多 runtime 和高级能力保留内部边界。

## 依赖边界

`@decurl/react-router` 依赖 `@decurl/core` 的 codec/schema 约束。

当前应优先使用：

- `@decurl/core/codec`

如果实现过程中发现 core 缺少必要能力，应先记录需要什么能力，不应为了 react-router 直接修改 core。

## 当前非目标

- 修改 `@decurl/core`。
- 暴露 `URLSearchParams` 作为主 API。
- 暴露 pending patch handle。
- 暴露手动撤销 API。
- 实现完整 undo/history 机制。
- 实现 route search memory。
- 实现 `window.navigation` runtime。
- 实现 Provider 高级配置。

这些能力可以在后续阶段讨论，但不应进入 P0 实现。

