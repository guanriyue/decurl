---
description: Decurl 是面向 URLSearchParams 的类型安全状态管理库，强调显式 decode、Search Fields 类型推导和 React Router 集成。
---

# Decurl 是什么

Decurl 是一个专注 `URLSearchParams` 场景的类型安全状态管理库。

它解决的问题很窄：把 URL query string 里的原始值解析成可用的业务状态，并把业务状态按确定的规则写回 URL。

```txt
string | string[] | null -> typed value
```

这听起来像 validation，但 Decurl 不想成为通用校验库。它更关心 URL 场景里的几个长期问题：

- URL 中所有值一开始都是字符串、字符串数组或缺失值。
- query 参数经常需要默认值、别名、数组、多值字段和兼容旧链接。
- 前端状态更新通常是 patch，而不是完整替换整个 search object。
- React Router 集成需要在用户交互时先给出乐观状态，再把结果刷新到 URL。

## 入口结构

当前文档围绕 `@guanriyue/decurl` 及其 conditional exports 展开：

| 入口 | 职责 |
| --- | --- |
| `@guanriyue/decurl` | 开箱即用的 React Router hooks |
| `@guanriyue/decurl/codec` | FieldCodec、Search Fields、类型推导、URLSearchParams decode/encode |
| `@guanriyue/decurl/decode` | decode pipeline 与基础解析工具 |
| `@guanriyue/decurl/routeSpec` | 定义 path 与 search contract，并生成类型安全的 href |
| `@guanriyue/decurl/pagination` | page、pageSize 与分页联动行为 |
| `@guanriyue/decurl/configured` | 创建绑定 store 的 hooks、Provider 和 React Router runtime 接线 |

使用者只需要安装 `@guanriyue/decurl`。这些入口由同一个包提供，并共享同一套 Search Fields 规则。

## 设计取向

Decurl 倾向显式组合，而不是提供一组很宽的成品 parser。

```ts
pipe(trim, shape.integer, toNumber, min(1))
```

上面的 pipeline 能直接读出解析策略：清理空白、要求整数形状、转换为 number、限制最小值。每一步都可以单独测试，也方便 review。

## 什么时候适合用

Decurl 适合这些场景：

- 搜索、筛选、排序、分页等状态需要进入 URL。
- URL 参数需要类型推导，而不是到处手写 `Number(searchParams.get('page'))`。
- 项目需要兼容旧 URL key，例如从 `p` 迁移到 `page`。
- React Router 应用希望把 URL search 当成一个可订阅、可更新的状态源。

Decurl 不适合这些场景：

- 你需要完整的表单校验、错误树、schema introspection。
- 你只想解析一个孤立字符串，和 URLSearchParams 没有关系。
- 你希望所有规则都由一个大型 validation schema 接管。

下一步可以从 [快速开始](./getting-started) 进入一个完整的小例子。
