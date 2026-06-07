# 文档结构

本仓库区分使用者、维护者和 agent。不同文档面向不同读者，不应互相替代。

## README.md

面向：

- 库使用者。
- 第一次了解项目的贡献者。
- 第一次进入仓库的 agent。

回答：

- 这个项目是什么。
- 它解决什么问题。
- 当前阶段做什么。
- 更多文档在哪里。

README 应保持简洁。

README 不是设计文档、架构文档、贡献指南或完整 API reference。

在 core 包内，`packages/core/README.md` 是 `@decurl/core` 的入口。根目录 README 面向整个仓库，scope 更大，不应承担 core 包的完整说明。

## api/

面向：

- 库使用者。
- 使用本库的 agent。

回答：

- 有哪些 API。
- 每个 API 做什么。
- 输入和输出是什么。
- 什么时候应该使用。

API 文档应直接、实用，不解释设计哲学、历史原因、内部架构或未来路线。

## docs/

面向：

- 库维护者。
- 修改本库实现的 agent。

回答：

- 为什么采用当前设计。
- 架构边界在哪里。
- 项目要解决什么问题。
- 哪些能力不应该实现。

`docs/` 是架构和设计原则的事实来源。

## docs/philosophy/

描述高层设计原则。

例如：

- Agent 友好的 API。
- Decode first。
- 显式 pipeline。
- 组合优先于便利封装。

这些文档描述项目价值，而不是具体 API 使用方式。

## docs/architecture/

描述系统主要部分如何工作。

例如：

- Core package。
- Decode pipeline。
- Schema system。
- Runtime boundaries。

这些文档解释系统结构。

## docs/adr/

ADR 是 Architecture Decision Record。

ADR 记录重要设计决策，并说明：

- 决策是什么。
- 背景是什么。
- 为什么这样选择。
- 后果是什么。

设计讨论结束后，如果结论会影响长期实现，应沉淀为 ADR。

## AGENTS.md

面向：

- 在仓库中修改代码或文档的维护 agent。

回答：

- agent 修改本库时必须遵守哪些规则。

AGENTS.md 应短、直接、可执行。

AGENTS.md 不应复制 `docs/` 的完整内容，而应指向相关文档并列出不可违反的约束。

## 责任矩阵

| 文件或目录 | 回答的问题 |
| --- | --- |
| README.md | 这个项目是什么？ |
| api/ | 这个 API 做什么？ |
| docs/ | 项目为什么这样设计？ |
| docs/adr/ | 为什么做出这个决策，而不是另一个？ |
| AGENTS.md | agent 修改仓库时必须遵守什么规则？ |
