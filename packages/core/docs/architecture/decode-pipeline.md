# Decode Pipeline 架构

Decode pipeline 是 `@decurl/core` 的核心组合模型。

基础协议：

```ts
type Decode<I, O> = (input: I) => O | null | undefined
```

`null | undefined` 表示 decode 失败、值缺失或值无效。

## 分层

Decode pipeline 分为三层：

- primitive 层：`pipe`、`mapItems`、`where`、`shape`、`trim`、`toNumber` 等。
- field 层：`FieldCodec`、`decodeField`、`encodeFieldValue`、`encodeField`、`isFieldValueEqual`。
- record 层：`decodeFields`、`encodeFields`、`isFieldValuesEqual`。

primitive 层不理解 URLSearchParams。

field 层理解 single / multi mode，但要求调用方传入已经解析好的 key。

record 层负责把 schema key 和 `codec.name` 映射到最终 URLSearchParams key，并组合多个 field 的读写。

## Key 解析边界

`decodeField(codec, searchParams, key)` 要求 key 已经明确。

`encodeField(codec, value, searchParams, key, options)` 同样要求 key 已经明确。它负责字段级 URLSearchParams 写入，返回新的 URLSearchParams，不修改传入对象。

`encodeFieldValue(codec, value)` 只负责把业务值转换为可写入 URLSearchParams 的字符串值，不负责删除 key、处理 alias、处理 default value 或写入 URLSearchParams。

`decodeFields(definition, searchParams)` 和 `encodeFields(definition, values, options)` 默认使用：

```ts
codec.name ?? recordKey
```

这个策略属于 record 层，不属于 field 层。未来其他上层可以采用不同 key 解析策略，然后直接调用 field 层 API。

## 引用稳定边界

Core 提供 equality helper：

- `isFieldValueEqual`
- `isFieldValuesEqual`

它们只判断是否相等，不负责返回 previous 引用。

内置 equality 默认以 `Object.is` 为基准。Multi mode 默认使用顺序敏感 shallow array equality，数组元素也使用 `Object.is` 比较。

React 等上层运行时可以基于这些 helper 决定是否复用旧引用。

相关决策见 [ADR 0002: 使用 Object.is 作为默认相等性基准](../adr/0002-object-is-as-default-equality.md)。
