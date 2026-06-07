# 不变式

这些规则属于 core 契约的一部分。实现具体 helper 时，不要顺手改变这些规则。

## 空值

`null` 和 `undefined` 被视为相同的语义值。

它们都表示无效、缺失或不可序列化的值。默认情况下，两者都不会被序列化。

实现代码应优先使用 `undefined`。例如，当某个 key 不存在于 URLSearchParams 中时，默认 decode 结果是 `undefined`。

## 序列化

写入 field 时，如果值是 `null` 或 `undefined`，对应的 URL key 会从最终 URLSearchParams 中移除。

Schema 级 encoder 会忽略未知 field。

## 默认值

Field codec 可以定义 `defaultValue`。

如果 field 有 `defaultValue`，从类型推导角度看，它的 decode 结果应被视为一定存在。推导出的 decoded field 类型不应包含 `null` 或 `undefined`。

默认情况下，如果序列化值和 field 默认值相等，则从 URLSearchParams 中移除该 key。

如果调用方在 schema/write 层传入 `preserveDefault: true`，则与默认值相等的值也会被写入 URLSearchParams。

`preserveDefault` 不属于 FieldCodec。它是 schema/write 层选项，因为它决定的是最终 URLSearchParams 是否保留 default value，而不是单个 field 如何编码业务值。

可观察到的默认行为是：与默认值等价的值会从 URL 中省略。

## 相等性

Field codec 应支持 `eq` 函数。

它用于：

- 判断某个值是否等于 `defaultValue`。
- 当前后 decode 出来的引用类型值相等时，保留原有引用，从而维持引用稳定。

默认相等性取决于 field mode：

- `single`：使用 `Object.is` 比较。
- `multi`：按顺序 shallow compare 数组，每个元素使用 `Object.is` 比较。

## Multi Mode 顺序

`multi` mode 是顺序敏感的，和原生 URLSearchParams 行为保持一致。

默认情况下，`[1, 2]` 和 `[2, 1]` 是不同的值。

## 纯函数

无论是 field 级还是 schema 级，codec 都必须是纯函数且不带副作用。

Decode 和 encode 操作应返回新值，而不是修改调用方持有的数据。
