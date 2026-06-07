# @decurl/core

`@decurl/core` 是 Decurl 的核心包，负责 URLSearchParams 场景下的 codec、decode pipeline、schema 类型推导和基础工具。

当前阶段只实现 core 能力，不包含 React hooks、router adapter 或运行时集成。

## 核心问题

URLSearchParams 的难点不是写入，而是 decode：

```ts
string | string[] | null -> typed value
```

`@decurl/core` 提供可组合的小组件，让解析过程保持显式、可读、可审查。

例如：

```ts
pipe(trim, shape.integer, toNumber, min(1))
```

这比成品 parser 更适合维护已有项目，因为每一步策略都可见。

## 文档

- API 文档：[api/index.md](api/index.md)
- 维护文档：[docs/index.md](docs/index.md)
- Agent 维护说明：[AGENTS.md](AGENTS.md)

## 当前范围

包括：

- Field codec 类型。
- Decode primitives。
- Field / record 级 decode。
- Field / record 级 equality helper。
- Schema 类型推导。

暂不包括：

- React hooks。
- Router adapter。
- Pending flush。
- Optimistic runtime。
- 通用 validation 能力。

