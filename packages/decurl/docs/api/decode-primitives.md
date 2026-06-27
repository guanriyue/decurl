# Decode Primitives

Decode primitive 是用于解析 URLSearchParams 原始值的小型函数。

## Overview

### `Decode<I, O>`

#### Signature

```ts
type Decode<I, O> = (input: I) => O | null | undefined
```

#### Behavior

`Decode` 接收一个输入值，返回解析后的输出值。

返回 `null` 或 `undefined` 表示解析失败、值缺失或值无效。`pipe` 和 `mapItems` 会把这类结果视为失败结果。

#### Example

```ts
const decodePage = pipe(shape.integer, toNumber, min(1))
```

#### Notes

Decode primitive 只做单一步骤。需要多个步骤时，使用 `pipe` 组合。

## Composition

### `pipe`

#### Signature

```ts
pipe(ab)
pipe(ab, bc)
pipe(ab, bc, cd)
```

最多支持 10 个 decode 函数。

#### Behavior

按顺序执行多个 decode 函数。

任一步返回 `null` 或 `undefined` 时，后续步骤不会执行，整个 pipeline 返回 `undefined`。

#### Example

```ts
const decodePage = pipe(trim, shape.integer, toNumber, min(1))
```

#### Notes

`pipe` 也可以连接项目内普通函数。普通函数只要返回非 `null | undefined` 的值，就会被视为成功步骤。

### `mapItems`

#### Signature

```ts
mapItems(ab)
mapItems(ab, bc)
mapItems(ab, bc, cd)
```

最多支持 10 个 decode 函数。

#### Behavior

对数组中的每一项执行 pipe-like decode。

每一项返回 `null` 或 `undefined` 时，该项会从输出数组中移除。

#### Example

```ts
const decodeIds = mapItems(shape.integer, toNumber)
```

#### Notes

`mapItems` 的输入必须是数组。它不负责把非数组转换为数组。

## Array Utilities

### `unique`

#### Signature

```ts
unique(input)
unique.by(identity)
```

#### Behavior

`unique(input)` 对数组去重，返回去重后的数组。

默认使用 `Object.is` 判断数组项是否相等，并保留首次出现的值。

`unique.by(identity)` 返回一个函数。该函数接收数组，并按 `identity(item)` 的结果去重。

#### Example

```ts
unique(['a', 'a', 'b'])

pipe(
  mapItems(shape.integer, toNumber),
  unique,
)

pipe(
  mapItems(shape.integer, toNumber),
  unique.by((value) => value),
)
```

#### Notes

`unique` 不会改变数组项顺序。输出顺序始终按首次出现顺序保留。

## Predicates

### `where`

#### Signature

```ts
where(predicate)
```

#### Behavior

如果 `predicate(input)` 返回 `true`，返回原值。

否则返回 `undefined`。

#### Example

```ts
const positive = where((value: number) => value > 0)
```

#### Notes

`where` 支持 type guard predicate。

```ts
const order = where(
  (value: string): value is 'asc' | 'desc' =>
    value === 'asc' || value === 'desc',
)
```

### `startsWith`

#### Signature

```ts
startsWith(prefix)
```

#### Behavior

输入字符串以 `prefix` 开头时，返回原字符串。

否则返回 `undefined`。

#### Example

```ts
const userId = startsWith('user_')
```

### `elementOf`

#### Signature

```ts
elementOf(values)
elementOf(enumDefinition)
```

#### Behavior

输入值属于给定集合时，返回原值。

否则返回 `undefined`。

`values` 可以是数组。成员比较默认使用 `Object.is`。

`enumDefinition` 可以是 TypeScript enum 的运行时对象。

#### Example

```ts
const order = elementOf(['asc', 'desc'] as const)

enum PageSize {
  Small = 20,
  Large = 50,
}

const pageSize = pipe(shape.integer, toNumber, elementOf(PageSize))
```

#### Notes

`elementOf` 只做成员约束，不做类型转换。

使用 number enum 时，推荐先把输入转换为 number，再执行 `elementOf(enumDefinition)`。

## String Shapes

### `shape`

#### Signature

```ts
shape(regexp)
```

#### Behavior

输入字符串满足 `regexp` 时，返回原字符串。

否则返回 `undefined`。

#### Example

```ts
const digits = shape(/^\d+$/)
```

#### Notes

`shape` 只检查字符串形状，不做类型转换。

### `shape.integer`

#### Signature

```ts
shape.integer
```

#### Behavior

要求输入字符串是十进制整数形状。

不接受小数、科学计数法、千分位分隔符或非法前导零。

#### Example

```ts
pipe(shape.integer, toNumber)
```

### `shape.number`

#### Signature

```ts
shape.number
```

#### Behavior

要求输入字符串是十进制数字形状。

不接受 `NaN`、`Infinity`、科学计数法或千分位分隔符。

#### Example

```ts
pipe(shape.number, toNumber)
```

### `shape.boolish`

#### Signature

```ts
shape.boolish
```

#### Behavior

只接受字符串 `'true'` 或 `'false'`。

#### Example

```ts
pipe(shape.boolish, toBoolean)
```

### `shape.month`

#### Signature

```ts
shape.month
```

#### Behavior

接受 `YYYY-MM` 结构的月份字符串。

月份必须是 `01` 到 `12`。

#### Example

```ts
shape.month
```

### `shape.date`

#### Signature

```ts
shape.date
```

#### Behavior

接受 `YYYY-MM-DD` 结构的日期字符串。

日期必须是真实日历日期。

#### Example

```ts
shape.date
```

### `shape.datetime`

#### Signature

```ts
shape.datetime
```

#### Behavior

接受常见日期时间字符串结构。

支持以下格式：

```txt
YYYY-MM-DDTHH:mm
YYYY-MM-DDTHH:mm:ss
YYYY-MM-DD HH:mm
YYYY-MM-DD HH:mm:ss
YYYY-MM-DDTHH:mm:ssZ
YYYY-MM-DDTHH:mm:ss+08:00
```

日期和时间部分必须是真实日历日期与有效时间。

#### Example

```ts
shape.datetime
```

#### Notes

`shape.datetime` 只检查字符串形状，不负责解析为 `Date`、`Temporal`、dayjs 或其他日期对象。

需要业务日期对象时，应在后续步骤中显式转换。

## String Utilities

### `trim`

#### Signature

```ts
trim
trim.start
trim.end
```

#### Behavior

`trim` 清理字符串前后空白。

`trim.start` 只清理开头空白。

`trim.end` 只清理结尾空白。

#### Example

```ts
pipe(trim, shape.integer, toNumber)
```

#### Notes

`trim` 不会隐式发生。需要清理空白时，应显式写在 pipeline 中。

## Numeric Constraints

### `min`

#### Signature

```ts
min(value)
```

#### Behavior

输入 number 大于或等于 `value` 时，返回原 number。

否则返回 `undefined`。

#### Example

```ts
pipe(shape.integer, toNumber, min(1))
```

### `max`

#### Signature

```ts
max(value)
```

#### Behavior

输入 number 小于或等于 `value` 时，返回原 number。

否则返回 `undefined`。

#### Example

```ts
pipe(shape.integer, toNumber, max(100))
```

## Length Constraints

### `length`

#### Signature

```ts
length(size)
length([min, max])
```

#### Behavior

约束输入值的 `length`。

传入 number 时，要求 `input.length === size`。

传入 `[min, max]` 时，要求 `input.length` 落在闭区间内。

#### Example

```ts
length(2)
length([1, 3])
```

### `length.min`

#### Signature

```ts
length.min(value)
```

#### Behavior

要求 `input.length >= value`。

#### Example

```ts
length.min(1)
```

### `length.max`

#### Signature

```ts
length.max(value)
```

#### Behavior

要求 `input.length <= value`。

#### Example

```ts
length.max(10)
```

## Conversions

### `toNumber`

#### Signature

```ts
toNumber
```

#### Behavior

把输入转换为 number。

转换失败时返回 `undefined`。

#### Example

```ts
pipe(shape.integer, toNumber)
```

#### Notes

推荐先使用 `shape.integer` 或 `shape.number` 限定字符串形状，再使用 `toNumber`。

### `toBoolean`

#### Signature

```ts
toBoolean
```

#### Behavior

把 `'true'` 转换为 `true`。

把 `'false'` 转换为 `false`。

其他输入返回 `undefined`。

#### Example

```ts
pipe(shape.boolish, toBoolean)
```
