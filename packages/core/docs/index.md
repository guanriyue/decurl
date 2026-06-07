# @decurl/core 维护文档

这里是 `@decurl/core` 的维护者文档。

维护文档回答：

- 为什么采用当前设计。
- 架构边界在哪里。
- 哪些能力不应该实现。
- 修改实现时必须遵守哪些约束。

使用者 API 文档见 [`../api/index.md`](../api/index.md)。

## 哲学

- [Agent 友好的 API](philosophy/agent-friendly-apis.md)
- [显式 Pipeline](philosophy/explicit-pipelines.md)

## 架构

- [文档结构](architecture/documentation-structure.md)
- [Decode Pipeline 架构](architecture/decode-pipeline.md)
- [Core 职责范围](scope.md)
- [Decode Primitives](decode-primitives.md)
- [Field Codec](field-codec.md)
- [URLSearchParams Codec](url-search-params-codec.md)
- [核心不变式](invariants.md)

## ADR

- [ADR 0001: 避免 parser-style API](adr/0001-avoid-parser-style-api.md)
- [ADR 0002: 使用 Object.is 作为默认相等性基准](adr/0002-object-is-as-default-equality.md)
