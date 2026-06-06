# Decode Primitives

Decode 函数是 core 的基础可组合单元。

当前统一协议：

```ts
type Decode<I, O> = (input: I) => O | null | undefined
```

`null` 和 `undefined` 都表示 decode 失败、无效或空值。实现内部可以按需归一化为 `undefined`。

这些函数是候选清单，后续可以扩展、重命名或删减。不要为了完整性膨胀工具函数；如果某个 helper 语义重复或不够清楚，应优先移除或延后。

## 组合函数

### `pipe`

连接多个 decode 函数，按顺序依次执行。

任意一步返回 `null` 或 `undefined` 时，整个 pipeline 返回空值，并停止后续执行。

示例：

```ts
pipe(trim, shape.integer, toNumber, elementOf(pageSizeOptions))
```

### `array`，名称待定

预期输入是数组。

它连接多个函数，对数组中的每个值执行类似 `pipe` 的流程，并在输出中移除 `null | undefined` 值。

语义重点：

- 输入不是数组时返回 `undefined`。
- 输出顺序保持输入顺序。
- 过滤空值不应重排剩余值。
- 命名待定，后续可以考虑更明确的名称。

## 条件过滤

### `where(predicate)`

如果 `predicate(input)` 为真，返回原值；否则返回 `undefined`。

### `shape(regexp)`

如果字符串满足 `regexp` 约束，返回原值；否则返回 `undefined`。

`shape` 系列只约束字符串形状，不做业务类型转换。

### `startsWith(s)`

如果字符串以 `s` 开头，返回原值；否则返回 `undefined`。

## 内置 Shape

### `shape.integer`

要求值的结构是有效整数，并保证面向人的可读性。

暂定约束：

- 只接受十进制整数字符串。
- 允许负号。
- 不允许前导 `+`。
- 不允许前导 0，除非值本身就是 `"0"`。
- 不允许科学计数法。
- 不允许千分位分隔符。
- 不允许小数点。
- 不允许空白字符，是否 trim 由开发者显式决定。

候选正则：

```ts
/^-?(0|[1-9]\d*)$/
```

这个结构约束参考 JSON number 的十进制可读性原则，但进一步限制为整数，并保持 URL 中的人类可读表达。

### `shape.number`

要求值的结构是数字。

暂定约束：

- 接受十进制数字。
- 允许负号。
- 不允许前导 `+`。
- 不允许千分位分隔符。
- 不允许科学计数法，除非后续明确需要。
- 不允许 `NaN`、`Infinity`、`-Infinity`。
- 不允许空白字符，是否 trim 由开发者显式决定。
- 小数形式待实现时精确定义，例如是否允许 `1.` 或 `.1`。

实现前需要补充测试用例来固定边界。

### `shape.boolish`

严格匹配字符串 `"true"` 或 `"false"`。

不接受大小写变体，也不接受 `"1"`、`"0"`、`"yes"`、`"no"`。

### `shape.month`

匹配 `'YYYY-MM'` 结构。

实现时应至少约束月份范围为 `01` 到 `12`。

是否进一步校验年份范围暂不固定。

### `shape.date`

匹配 `'YYYY-MM-DD'` 结构。

实现时应校验实际日历日期，而不是只校验正则形状。例如 `2024-02-29` 有效，`2023-02-29` 无效。

时区不参与 date 语义。

### `shape.datetime`

待定。

UTC 和 ISO datetime 的格式边界不同，先不要急于实现。后续可以参考 RFC 3339 / ISO 8601 的具体子集，明确是否接受：

- 必须带时区还是允许本地时间。
- 是否只接受 `Z`。
- 是否允许 offset，例如 `+08:00`。
- 是否允许毫秒或任意小数秒。

## 字符串处理

### `trim`

清理字符串前后空白。

### `trim.left`

只清理字符串左侧空白。

### `trim.right`

只清理字符串右侧空白。

## 数值和长度约束

### `min(n)`

满足最小值约束时返回原值，否则返回 `undefined`。

主要用于 number 值。是否支持 string 比较不作为默认语义。

### `max(n)`

满足最大值约束时返回原值，否则返回 `undefined`。

主要用于 number 值。是否支持 string 比较不作为默认语义。

### `length(n | [min, max])`

要求输入具有 `length` 属性。

传入 number 时，`length` 必须等于该值。

传入 `[min, max]` 时，`length` 必须落在闭区间内。

### `length.min(n)`，名称待定

要求 `length >= n`。

也可以考虑命名为 `minLength`。

### `length.max(n)`，名称待定

要求 `length <= n`。

也可以考虑命名为 `maxLength`。

## 类型转换

### `toNumber`

将字符串转换为 number。

推荐在 `shape.integer` 或 `shape.number` 之后使用。`toNumber` 不应承担宽松解析责任。

### `toBoolean`

将 `"true"` 转换为 `true`，将 `"false"` 转换为 `false`。

推荐在 `shape.boolish` 之后使用。

### `toEnum` / `elementOf`

名称待定。

约束输入必须属于一组静态值。候选输入可以是数组、readonly tuple、Set 或原生 TypeScript enum definition。

当前更偏向 `elementOf`，因为它表达的是“值属于集合”，不会暗示直接处理 enum 的所有边界。

对于数字 enum，推荐开发者先通过 `shape.integer` 和 `toNumber` 得到业务数字，再用 `elementOf(enumDefinition)` 约束值。这可以避开 TypeScript 数字 enum 反向映射带来的意外匹配。
