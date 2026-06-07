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

## 基础定位

Decurl 不追求最短写法，而追求可审查的解析过程。

这点对 vibe coding 或 agent 辅助开发尤其重要。在这类开发场景里，工程师和 agent 花在阅读、审查、迁移既有逻辑上的时间，往往比写新代码更多。API 应该让解析步骤像执行轨迹一样可见，而不是把策略藏在一个便利函数名背后。

因此 Decurl 倾向于：

- 可读性 > 简洁性。
- 显式 > 隐式。
- 组合 > 封装。
- 步骤可见 > 一步到位。

例如：

```ts
pipe(trim, shape.integer, toNumber, min(1))
```

比：

```ts
parseAsInteger()
```

更符合 Decurl 的目标。后者虽然方便，但它隐藏了是否 trim、是否严格检查数字形状、是否允许非十进制、是否容错、失败时如何处理等策略。

这也是 Decurl 相对 nuqs 这类 parser-first API 的优势之一：Decurl 更适合已经存在、search params 解析逻辑分散、需要逐步收敛和审查的项目。维护者或 agent 可以沿着 pipeline 局部调整行为，例如只插入 `trim`，而不需要猜测某个 all-in-one parser 内部有哪些选项和默认策略。

业务项目如果需要成品函数，可以在项目内基于小组件封装：

```ts
const positiveInteger = pipe(trim, shape.integer, toNumber, min(1))
```

这种封装带有项目上下文，风险小于 core 提供通用成品 parser。
