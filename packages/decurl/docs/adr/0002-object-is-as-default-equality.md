# ADR 0002: 使用 Object.is 作为默认相等性基准

## 决策

Decurl 内置 equality 判断默认以 `Object.is` 作为基准。

如果开发者在 `FieldCodec.eq` 中自定义 equality，则使用开发者提供的 `eq` 覆盖默认行为。

## 背景

Decurl 需要在 field 层和 record 层判断值是否相等，以便上层运行时决定是否复用 previous 引用。

引用稳定对 React 等 UI runtime 很重要，但 codec 层不应该持有缓存或直接返回 previous 引用。Codec 层只提供 equality helper，由上层决定是否复用引用。

## 理由

`Object.is` 是 JavaScript 中明确、稳定、可预期的相等性基准。

相比 `===`，`Object.is` 对 `NaN` 和 `-0` 的行为更明确。

相比 deep equal，`Object.is` 不会引入昂贵或不可预期的深比较，也不会替开发者猜测业务语义。

对于数组，multi mode 的默认 equality 是顺序敏感 shallow array equality，数组元素仍然使用 `Object.is` 比较。

对于对象、Date、Map、Set 等引用类型，默认只比较引用。如果业务需要结构相等，应通过 `FieldCodec.eq` 显式提供。

## 后果

系统默认 equality 简单、稳定、可解释。

引用类型 decode 后，如果希望保持引用稳定，开发者需要提供 `eq`。

React 等上层运行时可以基于 `isFieldValueEqual` 和 `isFieldValuesEqual` 决定是否复用 previous 引用。
