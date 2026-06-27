---
description: Decurl is a type-safe state management library for URL search params, built around explicit decode pipelines, Search Fields inference, and router integration.
pageType: home

hero:
  name: Decurl
  text: Type-safe state management for URL search params
  tagline: Turn string, string[], and null into typed, maintainable, and reviewable business state with explicit decode pipelines.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/start/introduction
    - theme: alt
      text: View API
      link: /api/
features:
  - title: FieldCodec
    details: Describe a URL key, decode logic, default value, write-back behavior, and equality semantics with a single field.
    link: /guide/codec/field-codec
  - title: Decode first
    details: The hard part of URL search params is not writing values, but safely decoding raw URL strings into business values.
    link: /guide/codec/decode-pipeline
  - title: TypeScript-first
    details: Search Fields describe URL fields and infer value types, so hooks, codecs, and business code share the same constraints.
    link: /guide/codec/search-fields
  - title: Patch encode
    details: When updating the URL, only encode the fields in the patch and preserve untouched params from the base search.
    link: /guide/codec/url-search-params
  - title: React Router integration
    details: Expose search state as hooks in React Router applications, with support for optimistic URL updates.
    link: /guide/react-router/overview
  - title: Alias migration
    details: Read legacy keys from old links and write back canonical keys, making URL field migrations smoother.
    link: /guide/codec/search-fields
---
