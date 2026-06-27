# Agent 友好的 API

Decurl 不追求最短写法，而追求可审查的解析过程。

在 vibe coding 或 agent 辅助开发场景中，阅读和审查代码经常比编写代码更重要。API 应该让解析步骤像执行轨迹一样可见。

Decurl 倾向于：

- 可读性 > 简洁性。
- 显式 > 隐式。
- 组合 > 封装。
- 步骤可见 > 一步到位。

这让维护者和 agent 可以更安全地局部调整 pipeline，例如插入 `trim`、替换 `shape`、增加 `where` 约束，而不需要猜测成品 parser 的内部策略。

具体 parser-style API 决策见 [ADR 0001](../adr/0001-avoid-parser-style-api.md)。

