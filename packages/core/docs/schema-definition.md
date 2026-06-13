# Schema Definition

Schema definition 将一组 field codec 固化为一个稳定的 URLSearchParams schema。

它的职责不是执行 decode 或 encode，而是在 schema 创建阶段建立确定性：

- 为没有 name 的 field 固化 schema property key。
- 为 `name: []` 的 field 固化 schema property key。
- 保留显式 name 和 legacy alias。
- 检查同一个 schema 内的 name 冲突。

## 概念形状

```ts
type FieldName = string | readonly string[]

type URLSearchParamsCodecDefinition = Record<string, FieldCodec>

type NamedFieldCodec = FieldCodec & {
  name: string | readonly [string, ...string[]]
}

type WithDefinedFieldName<TCodec extends FieldCodec> =
  Omit<TCodec, 'name'> & {
    name: string | readonly [string, ...string[]]
  }
```

Core 可以提供一个 schema define 方法，例如：

```ts
const schema = defineFields({
  text: textCodec,
  page: {
    ...pageCodec,
    name: ['page_num', 'p'],
  },
})
```

`defineFields` 返回的 schema 应尽量让每个 field 都成为 named field，并通过 `WithDefinedFieldName<TCodec>` 保留每个 field 的具体子类型。这样上层集成包可以在单独使用 field codec 时避免魔法字符串：

```ts
useSearchValue(schema.text)
```

而不是：

```ts
useSearchValue('text', schema.text)
```

## Name Normalization

每个 schema field 都应被归一化为非空 name 列表。

规则：

- `name` 是字符串：候选 key 是 `[name]`。
- `name` 是非空数组：候选 key 是该数组本身。
- `name` 是空数组：候选 key 是 `[schemaPropertyKey]`。
- 未提供 `name`：候选 key 是 `[schemaPropertyKey]`。

归一化后的第一项是 canonical key。

后续项是 legacy alias，只用于兼容旧 URL。

## Duplicate Names

同一个 schema 中，所有归一化后的候选 key 应尽量保持唯一。

重复 name 会导致 decode 和 encode 都产生歧义：

```ts
defineFields({
  page: { name: ['page_num', 'p'], ...pageCodec },
  currentPage: { name: 'p', ...pageCodec },
})
```

上面的 schema 存在歧义，因为 `page` 和 `currentPage` 共享了 `p`。

重复检查应在 schema define 阶段完成，并优先在开发期间给出 warning。

Warning 信息应包含重复 name 以及冲突的 schema property key，方便维护者定位问题。

不建议默认直接抛出异常，因为这会让 schema 在运行时不可用，也可能让开发者难以判断是哪个 field 的 name 造成问题。

严格失败可以作为可选能力存在，例如：

- `defineFields(definition, { strictNameConflict: true })`
- 独立的 `validateFieldNames(definition)` 校验函数

严格模式下，重复 name 可以被视为 definition 无效。

## Immutability

Schema define 不应修改调用方传入的 field codec 对象。

如果需要固化 name，应返回新的 field codec 对象或新的 schema 对象。

这样可以保持 core codec 的纯函数边界，也避免同一个 field codec 在多个 schema 中复用时被意外污染。

## Relationship With URLSearchParams Codec

`createURLSearchParamsCodec` 可以接收已经 define 过的 schema，也可以在内部执行同样的 define 逻辑。

无论哪种实现方式，最终进入 decode/encode 的 schema 都应满足：

- 每个 field 都有明确的 canonical key。
- 每个 field 都有完整的候选 key 列表。
- 同一个 schema 内的重复候选 key 已被开发期 warning 或可选严格校验处理。
