---
description: Decurl is a type-safe state management library for URLSearchParams, built around explicit decode, Search Fields inference, and router integration.
---

# What is Decurl?

Decurl is a type-safe state management library focused on `URLSearchParams`.

It solves a narrow problem: decode raw values from a URL query string into usable business state, then write business state back to the URL with deterministic rules.

```txt
string | string[] | null -> typed value
```

That may sound like validation, but Decurl is not trying to become a general-purpose validation library. It cares about a few long-term problems in URL scenarios:

- Every value in the URL starts as a string, a string array, or a missing value.
- Query params often need default values, aliases, arrays, multi-value fields, and compatibility with old links.
- Frontend state updates are usually patches, not full replacements of the entire search object.
- Router integration often needs optimistic state during user interaction before the URL refresh catches up.

## Package Structure

The current documentation focuses on `@decurl/react-router` and its conditional exports:

| Entry | Responsibility |
| --- | --- |
| `@decurl/react-router` | Ready-to-use React Router hooks |
| `@decurl/react-router/codec` | FieldCodec, Search Fields, type inference, and URLSearchParams decode/encode |
| `@decurl/react-router/decode` | Decode pipelines and primitive parsing helpers |
| `@decurl/react-router/routeSpec` | Define path and search contracts, then generate type-safe hrefs |
| `@decurl/react-router/pagination` | Page, pageSize, and pagination behavior |
| `@decurl/react-router/configured` | Create store-bound hooks, Provider, and React Router runtime wiring |

Users only need to install `@decurl/react-router`. These entries are provided by the same package and share the same Search Fields rules.

## Design Direction

Decurl prefers explicit composition over a wide set of ready-made parsers.

```ts
pipe(trim, shape.integer, toNumber, min(1))
```

The pipeline above reads directly as a parsing strategy: trim whitespace, require an integer shape, convert to number, and constrain the minimum value. Each step can be tested independently and is easy to review.

## When It Fits

Decurl fits these scenarios:

- Search, filter, sort, and pagination state need to live in the URL.
- URL params need type inference instead of repeated `Number(searchParams.get('page'))` calls.
- A project needs to support old URL keys, such as migrating from `p` to `page`.
- A React Router application wants to treat URL search as a subscribable, updatable state source.

Decurl does not fit these scenarios:

- You need full form validation, error trees, or schema introspection.
- You only want to parse an isolated string unrelated to URLSearchParams.
- You want a large validation schema to own every rule.

Next, continue with [Getting Started](./getting-started) for a complete small example.
