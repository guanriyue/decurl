---
description: Decurl 是面向 URL search params 的类型安全状态管理库，强调显式 decode、Search Fields 类型推导和 router 集成。
pageType: home

hero:
  name: Decurl
  text: 面向 URL search params 的类型安全状态管理库
  tagline: 用显式 decode pipeline 把 string、string[]、null 变成可推导、可维护、可审查的业务状态。
  actions:
    - theme: brand
      text: 开始使用
      link: /zh/guide/start/introduction
    - theme: alt
      text: 查看 API
      link: /zh/api/
features:
  - title: FieldCodec
    details: 用单个 field 描述 URL key、decode、默认值、写回和相等性语义。
    link: /zh/guide/codec/field-codec
  - title: Decode first
    details: URL search params 的难点不是写入，而是把 URL 中的原始字符串安全地解析为业务值。
    link: /zh/guide/codec/decode-pipeline
  - title: TypeScript-first
    details: Search Fields 既描述 URL 字段，也推导出 values 类型，让 hook、codec 和业务代码共享同一份约束。
    link: /zh/guide/codec/search-fields
  - title: Patch encode
    details: 更新 URL 时只处理传入字段，保留 base 中未触碰的参数，适合筛选器和分页状态。
    link: /zh/guide/codec/url-search-params
  - title: React Router integration
    details: 在 React Router 应用中把 search state 暴露为 hooks，并支持 optimistic URL update。
    link: /zh/guide/react-router/overview
  - title: Alias migration
    details: 读取旧链接中的 legacy key，写回时统一使用 canonical key，帮助 URL 字段平滑演进。
    link: /zh/guide/codec/search-fields
---
