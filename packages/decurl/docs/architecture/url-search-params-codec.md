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
  base?: URLSearchParams | string
  preserveDefault?: boolean
}

type URLSearchParamsCodecDefinition = Record<string, FieldCodec>
```

## Decode

Decode 从 URLSearchParams 读取每个 schema field。

URL key 优先使用 `field.name`，否则使用 schema property key。

如果 `field.name` 是数组，decode 按数组顺序尝试每个 key。数组第一项是 canonical key，后续项是 legacy alias。

如果 `field.name` 是空数组，视为没有提供 name，回退到 schema property key。

缺失 key 默认 decode 为 `undefined`，除非 field 有 `defaultValue`。

Schema 级 decode 返回新对象，不应修改输入的 URLSearchParams。

### Alias Decode

Alias decode 的目标是兼容旧链接。

Single field 规则：

- 按候选 key 顺序调用 `URLSearchParams.get(key)`。
- 如果 key 不存在，尝试下一个候选 key。
- 如果 key 存在，调用 field `decode(raw)`。
- 如果 decode 返回非 `null | undefined` 的值，视为成功。
- 如果 decode 返回 `null | undefined`，继续尝试下一个候选 key。
- 所有候选 key 都失败后，才回退到 `defaultValue` 或 `undefined`。

Multi field 规则：

- 按候选 key 顺序检查 `URLSearchParams.has(key)`。
- 如果 key 不存在，尝试下一个候选 key。
- 如果 key 存在，调用 `URLSearchParams.getAll(key)` 并执行 field `decode(rawValues)`。
- 如果 decode 返回非 `null | undefined` 的值，视为成功。
- 如果 decode 返回 `null | undefined`，继续尝试下一个候选 key。
- 所有候选 key 都失败后，才回退到 `defaultValue` 或 `undefined`。

## Encode

Encode 默认采用 patch 机制。

`encode(value)` 从空 URLSearchParams 开始。

`encode(value, { base })` 从 `base` 的拷贝开始，然后在其上叠加传入的 schema field。

Schema 级 encode 负责遍历 definition、判断 patch 中是否显式传入某个 field，并解析 `field.name ?? schema property key`。单个 field 的写入由 `encodeField` 完成；业务值到字符串值的转换由 `encodeFieldValue` 完成。

规则：

- 只处理 schema 中存在的 field。
- 未出现在 `value` 中的 field 不会被修改。
- 出现在 `value` 中但不存在于 schema 的 field 会被忽略。
- 如果 field value 是 `null` 或 `undefined`，移除对应 URL key。
- 默认情况下，如果 field value 等于 `defaultValue`，移除对应 URL key。
- 如果传入 `preserveDefault: true`，与 `defaultValue` 相等的 field value 也会被写入 URLSearchParams。
- Multi field 会为同一个 key 写入多个有序 value。
- 如果 field 有多个 name，写入时使用第一个 name。

这意味着当 schema 是 `{ foo, page, pageSize }` 时，调用 `encode({ foo, bar }, { base })` 会序列化 `foo`，忽略 `bar`，并保留 `base` 中原有的 `page` 和 `pageSize`。

### Alias Encode

当 field 有多个 name 时，encode 应将第一个 name 作为 canonical key。

只要 patch 中显式出现该 field，encode 就应确保最终只保留 canonical key，不保留 legacy alias。

这可以避免新旧 key 同时留在 URL 中：

```txt
page_num=2&p=1
```

规则：

- patch 未传入该 field：不修改 base 中任何 alias key。
- patch 传入 `null | undefined`：删除所有 alias key。
- patch 传入 default value，且 `preserveDefault` 不是 `true`：删除所有 alias key。
- patch 传入 single 有效值：使用 `set` 写入 canonical key，并删除 legacy alias。若 canonical key 已经存在，应保留 canonical key 的原始顺序位置。
- patch 传入 multi 有效值：删除所有 alias key，然后按顺序写入 canonical key。

新增 options 时，应扩展 `URLSearchParamsEncodeOptions`，不要改变 `base` 的含义。

`preserveDefault` 是 schema/write 层选项，不属于 FieldCodec。FieldCodec 只描述单个 field 如何 decode、encode 和比较值。

## Full Update

Decurl 未来也可以暴露 full-update 机制。

在 full-update mode 中，缺失值会被视为移除，调用方负责传入完整数据。这不是默认机制，因为 patch encode 对 URL 更新有更好的开发者体验。
