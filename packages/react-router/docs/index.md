# @decurl/react-router 维护文档

这里是 `@decurl/react-router` 的维护者文档。

维护文档回答：

- 这个包要解决什么问题。
- 架构边界在哪里。
- 实现时必须遵守哪些行为语义。
- 哪些能力暂时不应该实现。

当前阶段先沉淀实现目标和关键使用边界，避免开发过程中偏离主线。

## Guide

- [useSearchPagination Guide](guide/use-search-pagination.md)

## 架构

- [React Router 职责范围](scope.md)
- [Search State Hook 目标](architecture/search-state-hook.md)
- [Search State Store 状态机](architecture/search-state-store.md)
- [Runtime 边界](architecture/runtime-boundary.md)
- [React Bridge](architecture/react-bridge.md)
- [Provider 边界](architecture/provider.md)
- [配置化 Runtime 优化入口](architecture/configured-runtime.md)
- [Pagination Overflow Coordination](architecture/pagination-overflow-coordination.md)
- [RouteSpec URL Contract](architecture/route-spec.md)
