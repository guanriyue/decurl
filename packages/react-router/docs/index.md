# @decurl/react-router 维护文档

这里是 `@decurl/react-router` 的维护者文档。

维护文档回答：

- 这个包要解决什么问题。
- 架构边界在哪里。
- 实现时必须遵守哪些行为语义。
- 哪些能力暂时不应该实现。

当前阶段先沉淀实现目标和关键使用边界，避免开发过程中偏离主线。

## API

- [Decode Primitives](api/decode-primitives.md)

## Guide

- [useSearchPagination Guide](guide/use-search-pagination.md)

## 设计原则

- [Agent 友好的 API](philosophy/agent-friendly-apis.md)
- [显式 Pipeline](philosophy/explicit-pipelines.md)

## 架构

- [React Router 职责范围](scope.md)
- [Decode Pipeline 架构](architecture/decode-pipeline.md)
- [Decode Primitives](architecture/decode-primitives.md)
- [Field Codec](architecture/field-codec.md)
- [Schema Definition](architecture/schema-definition.md)
- [URLSearchParams Codec](architecture/url-search-params-codec.md)
- [Codec 不变式](architecture/codec-invariants.md)
- [Search State Hook 目标](architecture/search-state-hook.md)
- [Search State Store 状态机](architecture/search-state-store.md)
- [Runtime 边界](architecture/runtime-boundary.md)
- [React Bridge](architecture/react-bridge.md)
- [Provider 边界](architecture/provider.md)
- [配置化 Runtime 优化入口](architecture/configured-runtime.md)
- [Pagination Overflow Coordination](architecture/pagination-overflow-coordination.md)
- [RouteSpec URL Contract](architecture/route-spec.md)

## ADR

- [ADR 0001: 避免 parser-style API](adr/0001-avoid-parser-style-api.md)
- [ADR 0002: 使用 Object.is 作为默认相等性基准](adr/0002-object-is-as-default-equality.md)
