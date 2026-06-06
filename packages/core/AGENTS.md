# @decurl/core 维护说明

这个包是 Decurl 的第一阶段实现目标。

修改公开类型、codec 行为、encode/decode 语义或 URLSearchParams 工具前，先阅读这些文档：

- [docs/scope.md](docs/scope.md)：包职责和非目标。
- [docs/invariants.md](docs/invariants.md)：值语义和核心不变式。
- [docs/decode-primitives.md](docs/decode-primitives.md)：decode 函数协议和候选基础函数。
- [docs/field-codec.md](docs/field-codec.md)：field 级 codec 模型。
- [docs/url-search-params-codec.md](docs/url-search-params-codec.md):
  schema 级 codec 模型。

这些文档的目标读者是维护人或维护 agent，不是面向最终用户的使用文档。
