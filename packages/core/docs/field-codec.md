# Field Codec

Field codec 描述一个逻辑 schema field 如何映射到一个 URLSearchParams key。

这是初始概念形状：

```ts
type FieldCodec = {
  mode?: "single" | "multi"
  decode: Decode<Raw, Value>
  encode?: (value: Value) => string | string[] | null | undefined
  defaultValue?: NonNullable<Value>
  eq?: (left: NonNullable<Value>, right: NonNullable<Value>) => boolean
  name?: string
}
```

真实实现已经拆分为更小的子类型，以辅助 TypeScript 推导：

- field 是 `single` 还是 `multi`。
- field 是否有 `defaultValue`。
- decode 输出是否可能为 `undefined`。
- `decode` 接受哪种 raw input 形状。
- `encode` 接受哪种 value 形状。

当前类型层分为四种：

- `SingleOptionalFieldCodec<TValue>`
- `SingleRequiredFieldCodec<TValue>`
- `MultiOptionalFieldCodec<TValue>`
- `MultiRequiredFieldCodec<TValue>`

对外统一为 `FieldCodec<TValue>` union。

`InferFieldValue<TCodec>` 根据是否存在 `defaultValue` 推导最终 field value：

- optional field：`NonNullable<TValue> | undefined`
- required field：`NonNullable<TValue>`

## Mode

`single` mode 是默认 mode。未显式提供 `mode` 时，按 `single` 处理。

`single` mode 从 URLSearchParams 读取一个 raw value。field codec 的 `decode` 接收 `string | null`，对应 `URLSearchParams.get(name)`。

`multi` mode 读取某个 key 的所有 raw value，并保留原生顺序。field codec 的 `decode` 接收 `string[]`，对应 `URLSearchParams.getAll(name)`。

## Decode

`decode` 将 raw search-param data 转换为业务值。

如果 decode 无法产生有效值，返回 `null` 或 `undefined`。实现代码可以在内部按需归一化为 `undefined`。

Decode helper 应保持小而显式。除非 helper 名称清楚表达，否则避免隐式 trim 或宽松数字解析这类隐藏行为。

## Encode

`encode` 是可选的。

大多数值可以使用默认 stringify 行为。只有当业务值需要特殊序列化时，field codec 才需要自定义 `encode`。

如果 `encode` 返回 `null` 或 `undefined`，对应 key 会从最终 URLSearchParams 中移除。

## Default Value

`defaultValue` 表示 decoded field 一定存在。

如果 URL key 缺失，或 decode 得到空值，field 级结果会回退到 `defaultValue`。

`defaultValue` 不能是 `null | undefined`。这条约束保证“有 defaultValue 就一定有值”的类型承诺成立。

## Name

`name` 可选地覆盖 field 使用的 URLSearchParams key。

如果没有提供 `name`，使用 schema record key。

这允许一个 schema 定义某个页面或系统区域的稳定映射。一旦 schema 固定，代码在任何位置都可以 decode 出相同的预期形状，而不需要重复声明 URL key 名称。

## Equality

`eq` 是可选的。未提供时，使用 field mode 对应的默认相等性：

- `single`：`Object.is`。
- `multi`：顺序敏感的 shallow array equality，每个元素用 `Object.is` 比较。

引用稳定相关能力应建立在这个 equality 行为之上，而不是在其他地方特殊处理引用类型值。

## 后续设计

`clearOnDefault` 名称与 nuqs 保持一致，但暂不加入 FieldCodec。

它在使用时可能涉及 field、schema、encode options 等多层优先级覆盖问题。当前阶段只保留默认 clear-on-default 语义，不提前固定配置位置。
