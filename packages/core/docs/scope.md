# Core 职责范围

`@decurl/core` 负责围绕 URLSearchParams 的 codec 层。

它应该提供小型、类型化、可组合的基础能力，用于 decode、encode、过滤、转换和类型推导。

## 职责

- Field codec 类型。
- URLSearchParams codec 类型。
- Decode pipeline 基础函数。
- Schema 定义和类型推导。
- URLSearchParams decode / encode 工具。
- URLSearchParams 相关 helper 函数。

## 当前非目标

- React hooks。
- Router adapters。
- Pending flush 行为。
- Optimistic runtime 行为。
- Route search memory。
- 与 URLSearchParams 无关的通用校验能力。

## Export 方向

这个包未来可以通过多个 conditional export 暴露能力。例如：

- `@decurl/core`
- `@decurl/core/codec`
- `@decurl/core/decode`
- `@decurl/core/schema`
- `@decurl/core/search-params`

具体 export 布局暂未固定。实现模块应保持足够小，确保后续拆分仍然容易。

## 相关设计文档

- [Agent 友好的 API](philosophy/agent-friendly-apis.md)
- [显式 Pipeline](philosophy/explicit-pipelines.md)
- [ADR 0001: 避免 parser-style API](adr/0001-avoid-parser-style-api.md)

