# @decurl/core 维护说明

这个包是 Decurl 的第一阶段实现目标。

修改公开类型、codec 行为、encode/decode 语义或 URLSearchParams 工具前，先阅读这些文档：

- [README.md](README.md)：core 包入口。
- [docs/index.md](docs/index.md)：维护文档入口。
- [docs/philosophy/agent-friendly-apis.md](docs/philosophy/agent-friendly-apis.md)：API 设计价值。
- [docs/adr/0001-avoid-parser-style-api.md](docs/adr/0001-avoid-parser-style-api.md)：避免成品 parser 的决策。
- [api/index.md](api/index.md)：使用者 API 文档入口。

这些文档的目标读者是维护人或维护 agent，不是面向最终用户的使用文档。

维护规则：

- 不要引入 parser-style API。
- 不要把 Decurl 扩展成通用 validation library。
- 不要为了少写 lambda 而包装 lodash 或原生 prototype 方法。
- 新增 helper 前，先确认它是 URLSearchParams decode 场景中的单一语义步骤。
- 优先小型可组合 primitives，保持 pipeline 显式可审查。
