# ADR 0001: 避免 Parser-style API

## 决策

`@decurl/core` 不提供 `parseAsInteger`、`parseAsDateRange` 这类成品 parser 作为核心 API。

Core 应提供小型、可组合、步骤可见的 decode primitives。

## 背景

URLSearchParams decode 的难点不是把字符串写回 URL，而是把 `string | string[] | null` 安全地转换为业务值。

不同项目对解析策略的要求不同。例如整数解析可能涉及：

- 是否 trim。
- 是否允许前导 `+`。
- 是否允许前导 0。
- 是否允许科学计数法。
- 是否允许非十进制。
- 失败时返回什么。

成品 parser 会提前替所有项目做这些决策。

## 理由

显式 pipeline 更适合维护和 agent 辅助开发：

```ts
pipe(trim, shape.integer, toNumber)
```

维护者可以直接看到每一步，也可以局部插入、删除或替换某个步骤。

成品 parser 虽然简洁，但阅读时不透明，迁移既有项目时风险更高。

## 后果

Core API 会比 parser-first API 稍长，但更可审查。

业务项目仍然可以基于 primitives 封装自己的成品函数。

维护者不应仅因为“更短”而向 core 添加成品 parser。

