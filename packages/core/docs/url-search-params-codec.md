# URLSearchParams Codec

URLSearchParams codec 将 schema definition 编译为整个 search object 的 decode 和 encode 操作。

概念形状：

```ts
type URLSearchParamsCodec<TValue> = {
  decode: (urlSearchParams: URLSearchParams) => TValue
  encode: (
    value: Partial<TValue>,
    options?: URLSearchParamsEncodeOptions,
  ) => URLSearchParams
}

type URLSearchParamsEncodeOptions = {
  base?: URLSearchParams
}

type URLSearchParamsCodecDefinition = Record<string, FieldCodec>
```

## Decode

Decode 从 URLSearchParams 读取每个 schema field。

URL key 优先使用 `field.name`，否则使用 schema property key。

缺失 key 默认 decode 为 `undefined`，除非 field 有 `defaultValue`。

Schema 级 decode 返回新对象，不应修改输入的 URLSearchParams。

## Encode

Encode 默认采用 patch 机制。

`encode(value)` 从空 URLSearchParams 开始。

`encode(value, { base })` 从 `base` 的拷贝开始，然后在其上叠加传入的 schema field。

规则：

- 只处理 schema 中存在的 field。
- 未出现在 `value` 中的 field 不会被修改。
- 出现在 `value` 中但不存在于 schema 的 field 会被忽略。
- 如果 field value 是 `null` 或 `undefined`，移除对应 URL key。
- 如果 clear-on-default 行为生效，且 field value 等于 `defaultValue`，移除对应 URL key。
- Multi field 会为同一个 key 写入多个有序 value。

这意味着当 schema 是 `{ foo, page, pageSize }` 时，调用 `encode({ foo, bar }, { base })` 会序列化 `foo`，忽略 `bar`，并保留 `base` 中原有的 `page` 和 `pageSize`。

未来新增 options 时，应扩展 `URLSearchParamsEncodeOptions`，不要改变 `base` 的含义。

`clearOnDefault` 是后续设计项。名称与 nuqs 保持一致，但当前阶段不固定在 FieldCodec 或 schema options 上。

## Full Update

Core 包未来也可以暴露 full-update 机制。

在 full-update mode 中，缺失值会被视为移除，调用方负责传入完整数据。这不是默认机制，因为 patch encode 对 URL 更新有更好的开发者体验。
