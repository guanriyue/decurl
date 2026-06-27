---
description: Decurl 与 validation、JSON Schema、Standard Schema 和 URL search state 库关注不同的问题。
---

# 方案对比

Decurl 不是通用 validation 库，也不是完整复刻某个 URL search state 库。它专注于 `URLSearchParams` 的解析、序列化和字段映射。

这篇文档比较不同方案的职责范围。Decurl 自身的取舍与约束见 [设计边界](./boundaries)。

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

## 和 JSON Schema 的边界

[JSON Schema](https://json-schema.org/) 是一种声明式、可被机器读取的数据描述。它不仅能表达类型和约束，也能携带 `enum`、`title`、`description`、`examples` 等上下文。例如，工具可以直接从下面的定义中读取允许使用的视图选项：

```json
{
  "type": "string",
  "enum": ["list", "grid"]
}
```

这类静态定义很适合生成文档、配置界面和跨语言契约。消费者不需要执行 schema，就能检查其中公开的信息。

JSON Schema 描述的是一个已经形成的 JSON value 应满足什么约束，不负责定义原始字符串如何转换成这个 value。例如：

```json
{
  "type": "integer",
  "minimum": 1
}
```

这个 schema 可以约束数字 `2`，但没有定义 URL 中的字符串 `"2"` 应该如何解析成数字，也没有定义数字应如何序列化回 URL。类似地，JSON Schema 中的 `default` 是 annotation，不等同于 Decurl 会在 key 缺失或 decode 失败时实际应用的 `defaultValue`。

JSON Schema 可以通过组合、引用和条件等能力描述复杂的数据结构。它真正不适合直接表达的是任意转换、业务算法和双向序列化。如果这些行为依赖自定义 keyword 或 vocabulary，使用方也必须理解相同的扩展语义；定义仍然可以工作，但可移植性会随之降低。

FieldCodec 选择把执行行为放在函数上：

```ts
const page = field({
  decode: pipe(trim, shape.integer, toNumber, min(1)),
  defaultValue: 1,
});
```

`decode` 和 `encode` 可以处理任何适合当前字段的同步转换，不受声明式关键词范围限制。`name`、`mode`、alias、`defaultValue` 和 `eq` 则只补充 URL 字段需要的语义。FieldCodec 因此也是一套特定协议，但它有意围绕 URL 字段的编解码保持较小的边界。

函数中心设计的代价是缺少 introspection。例如 `elementOf(['list', 'grid'])` 会把选项保存在 decode 函数的闭包中，定义完成后不能再从 FieldCodec 读取这份列表。未来可以考虑让 FieldCodec 显式携带 metadata，为文档、表单或其他工具提供上下文；在此之前，Decurl 不把这些描述性字段加入核心协议。即使未来存在 metadata，`decode` 仍应是实际解析行为的事实来源。

## 和 Standard Schema 的边界

[Standard Schema](https://standardschema.dev/) 不是另一种声明式 schema 语言。它是一组面向 TypeScript 生态的接口，用于让工具以统一方式消费不同 validation 库，而不需要为每个库编写单独的 adapter。

Standard Schema V1 的核心是 `~standard.validate`。它接收 unknown input，并返回成功结果或结构化 issues；验证既可以同步完成，也可以返回 Promise：

```ts
validate(value)
  // -> { value }
  //  | { issues }
  //  | Promise<{ value } | { issues }>
```

Input 和 output 可以是不同类型，因此具体 validation 库可以在验证过程中完成转换。但 Standard Schema 只统一调用和结果协议，不统一 schema 如何定义，也不保证可以读取 enum 等静态信息。它同样没有定义反向 encode、URL key、single/multi、alias 或默认值省略等行为。Standard Schema 项目提供了独立的 Standard JSON Schema 接口来约定 JSON Schema 转换能力，这并不是 Standard Schema validation 接口本身的 introspection 能力。

Standard Schema 可以作为 FieldCodec decode 内部使用的 validation 能力，但两者的失败语义和执行边界不同：

- Standard Schema 用 `issues` 表达失败，适合需要结构化错误的调用方。
- FieldCodec 通常把无效 URL value 归一化为 `null` / `undefined`，再尝试 alias、`defaultValue` 或页面 guard。
- Standard Schema 允许异步 validation；FieldCodec decode 有意保持同步。
- Standard Schema 不提供反向序列化；FieldCodec 可以用 `encode` 描述写回 URL 的规则。

三者关注的是不同层级：

| 方案 | 核心形态 | 主要能力 | 不负责的部分 |
| --- | --- | --- | --- |
| JSON Schema | 声明式文档 | 静态约束、annotation、introspection | 任意转换和双向序列化 |
| Standard Schema | validation 接口 | 类型推导、统一调用、value 或 issues | schema 定义、introspection 和 encode |
| FieldCodec | 编解码函数协议 | URL 字段解析、序列化和字段语义 | 完整 validation DSL 和结构化错误树 |

## 和 URL search state 库的边界

URL search state 库通常会提供更高层的 hook、parser 和 router adapter。

Decurl 更强调 URL codec 与 router hook 的边界：

- `@guanriyue/decurl/codec` 负责 Search Fields 语义。
- `@guanriyue/decurl/decode` 负责原始字符串的显式解析。
- `@guanriyue/decurl` 默认入口和 `@guanriyue/decurl/configured` 负责 React Router runtime 和 hooks。
- decode pipeline 保持显式组合，方便 review 和测试。
- alias、default、patch encode 是 URLSearchParams 层的一等语义。

Search Fields、decode pipeline 和 URLSearchParams codec 可以独立于 hooks 使用。Router 集成只是消费同一套规则的上层能力。
