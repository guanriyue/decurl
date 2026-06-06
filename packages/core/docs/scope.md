# Core 职责范围

`@decurl/core` 负责围绕 URLSearchParams 的 codec 层。

它应该提供小型、类型化、可组合的基础函数，用于 decode、encode、过滤和转换 URL search 值。它不应该变成通用校验库、router adapter 或 React runtime 包。

## 职责

- Field codec 类型。
- URLSearchParams codec 类型。
- Decode pipeline 基础函数。候选函数见 [decode-primitives.md](decode-primitives.md)。
- Schema 定义和类型推导。
- URLSearchParams decode / encode 工具。
- URLSearchParams 相关 helper 函数。

这个包未来可以通过多个 conditional export 暴露这些能力。例如：

- `@decurl/core`
- `@decurl/core/codec`
- `@decurl/core/schema`
- `@decurl/core/search-params`

具体 export 布局暂未固定。实现模块应保持足够小，确保后续拆分仍然容易。

## 当前非目标

- React hooks。
- Router adapters。
- Pending flush 行为。
- Optimistic runtime 行为。
- Route search memory。
- 与 URLSearchParams 无关的通用校验能力。

## 设计偏好

优先提供多个小函数，而不是少数几个“成品”高阶函数。

例如，decode 流程应当可以表达为：

```ts
pipe(trim, shape.integer, toNumber, elementOf(enumDefinition))
```

这会让每一步决策都显式表达：

- 是否 `trim` 由开发者选择，而不是被隐藏处理。
- `shape.integer` 在转换前约束预期字符串形状。
- `toNumber` 在形状已确定后再执行转换。
- `elementOf` 将业务值约束到一组静态值中。

这对 TypeScript 数字 enum 尤其重要。数字 enum 对象也包含反向映射，因此要求开发者先转换，再约束值，可以避免 `enumOf(enumDef)` 这类表达产生意外行为。
