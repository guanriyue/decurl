# Decode Primitives 维护准则

Decode primitive 是 decode 层的基础可组合单元。

基础协议：

```ts
type Decode<I, O> = (input: I) => O | null | undefined
```

`null | undefined` 表示 decode 失败、值缺失或值无效。

具体 API 行为见使用者文档：[../api/decode-primitives.md](../api/decode-primitives.md)。

## 添加 primitive 的判断顺序

新增 primitive 前，按以下顺序判断。

1. 是否符合包定位  
   它必须服务 URLSearchParams decode / encode 的核心流程，而不是通用工具库能力。

2. 是否是单一步骤  
   它不能隐藏 trim、shape、transform、fallback、default 等多个策略。

3. 是否提升阅读透明度  
   放进 `pipe(...)` 后，维护者和 agent 应该能一眼理解它的作用。

4. 是否符合大众认知  
   默认行为应符合大多数开发者对该概念的理解。例如 `"123.xyz"` 不应被视为合法 number。

5. 是否是高频 URLSearchParams 场景  
   优先支持过滤、分页、排序、日期范围等 search params 常见场景。

6. 替代成本是否足够高  
   如果开发者只是多写一个清楚的 lambda，就不急着放进 decode 层。

## 应该提供

- 基础组合：`pipe`、`mapItems`。
- 空值过滤和条件约束：`where`、`shape`。
- URL 字符串解析高频步骤：`trim`、`toNumber`、`toBoolean`。
- 常见静态值约束：`elementOf`。
- 少量 URL filter 场景中的规范化步骤，前提是它仍然只是单一步骤。

## 不应该提供

- 成品 parser，例如 `parseAsInteger`、`parseAsDateRange`。
- 通用集合工具，例如 `uniqBy`、`groupBy`、`take`、`slice`。
- 仅仅为了少写一个 lambda 而包装 lodash 或原生 prototype 方法的函数。
- 复刻 lodash/fp 的 curry-like adapter 集合。

## 成品 parser 边界

不要把多个策略打包成 decode primitive。

不推荐：

```ts
parseAsInteger()
```

推荐：

```ts
pipe(trim, shape.integer, toNumber)
```

业务项目如果需要成品函数，可以在项目内封装：

```ts
const positiveInteger = pipe(trim, shape.integer, toNumber, min(1))
```

这种封装带有业务上下文，风险小于 Decurl 提供通用成品 parser。

## 数组工具边界

`mapItems` 的职责是 item decode + 过滤 `null | undefined`。

数组级变换通常应使用普通函数接入 `pipe`：

```ts
pipe(
  mapItems(pipe(shape.integer, toNumber)),
  (values) => uniqBy(values, identity),
  (values) => values.toSorted(compareFn),
)
```

除非某个数组规范化步骤在 URLSearchParams 过滤场景中足够高频，并且仍然保持单一步骤，否则不要加入 decode 层。

`unique` 属于可以考虑进入 decode 层的高频规范化步骤。典型场景是多选过滤，URL 中同一个 key 出现多次时，最终业务值通常期望去重。

`unique` 的设计应保持单一步骤：

- `unique(values)`：直接对数组去重。
- `unique(identity)`：返回一个 decode-compatible 函数，之后由 `pipe` 调用。

`unique` 不应扩展成完整集合工具族。带业务 identity 的去重可以支持，但 `groupBy`、`take`、`slice` 等仍不属于 decode 层。

`toSorted.date` 也可以按个案评估，因为日期范围是常见过滤参数；但 `decodeDateRange` 不应进入 decode 层，因为它隐藏了 shape、转换、长度校验和排序等多个策略。

## Shape Predicate 暴露边界

`isInteger`、`isNumber`、`isBoolish`、`isMonth`、`isDate` 这类函数可以作为内部实现细节存在，但暂不作为对外 API 暴露。

使用者应优先通过 `shape.integer`、`shape.number`、`shape.boolish`、`shape.month`、`shape.date` 组合 pipeline。
