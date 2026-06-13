---
description: Decurl 与 nuqs、zod、valibot 等方案关注的问题不同，它专注 URLSearchParams 的显式 codec 和 router state。
---

# 边界与对比

Decurl 不是通用 validation 库，也不是完整复刻某个 URL state 库。

它的定位更窄：面向 `URLSearchParams` 的 decode-first codec，以及基于这套 codec 的 router search state。

## 和 validation 库的边界

zod、valibot 这类库擅长描述通用数据结构：

- 对象校验。
- 错误信息。
- schema introspection。
- 服务端和客户端共享数据约束。

Decurl 关注的是另一层问题：

- URL key 如何映射到业务字段。
- single field 和 multi field 如何读取。
- legacy alias 如何兼容。
- patch encode 如何保留未触碰参数。
- default value 什么时候写入或删除。

你可以在 Decurl 的 decode step 中调用 validation 库，但 Decurl 本身不试图替代它们。

## 和 URL state 库的边界

URL state 库通常会提供更高层的 hook、parser 和 router adapter。

Decurl 更强调 URL codec 与 router hook 的边界：

- `@decurl/react-router/codec` 负责 Search Fields 语义。
- `@decurl/react-router/decode` 负责原始字符串的显式解析。
- `@decurl/react-router/configured` 负责 React Router runtime 和 hooks。
- decode pipeline 保持显式组合，方便 review 和测试。
- alias、default、patch encode 是 URLSearchParams 层的一等语义。

## 为什么 decode first

写入 URL 往往不难：

```ts
searchParams.set('page', String(page));
```

真正困难的是读取：

```ts
const page = Number(searchParams.get('page'));
```

这段代码没有说明：

- 空字符串是否有效。
- `1e3` 是否有效。
- `0` 是否有效。
- 参数缺失时默认值是什么。
- 旧 key 是否还需要兼容。

Decurl 把这些规则前置到 Search Fields 中，让 URL 进入业务层之前就被显式处理。

## 第一版文档优先级

当前文档第一版优先讲清楚：

1. codec 子入口如何表达 URLSearchParams 语义。
2. decode pipeline 如何组合。
3. React Router hooks 如何复用同一份 Search Fields。
4. Decurl 和通用 validation/router state 工具的边界。

后续再补：

- 可交互 demo。
- 自动生成 API reference。
- 英文文档。
- 更完整的 router 行为示例。
