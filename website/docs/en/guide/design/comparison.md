---
description: Decurl focuses on different problems from validation libraries, JSON Schema, Standard Schema, and URL search state libraries.
---

# Comparisons

Decurl is not a general-purpose validation library, and it is not a full recreation of any URL search state library. It focuses on `URLSearchParams` parsing, serialization, and field mapping.

This document compares the responsibilities of different approaches. For Decurl's own trade-offs and constraints, see [Design Boundaries](./boundaries).

## Boundary with Validation Libraries

Libraries such as zod and valibot are good at describing general data structures:

- Object validation.
- Error messages.
- Schema introspection.
- Shared data constraints between server and client.

Decurl focuses on another layer:

- How URL keys map to business fields.
- How single fields and multi fields are read.
- How legacy aliases are supported.
- How patch encode preserves untouched params.
- When default values are written or deleted.

You can call a validation library inside a Decurl decode step, but Decurl itself does not try to replace them.

## Boundary with JSON Schema

[JSON Schema](https://json-schema.org/) is a declarative, machine-readable data description. It can express types and constraints, and it can carry context such as `enum`, `title`, `description`, and `examples`. For example, tools can read allowed view options directly from this definition:

```json
{
  "type": "string",
  "enum": ["list", "grid"]
}
```

This kind of static definition fits documentation generation, configuration UIs, and cross-language contracts. Consumers can inspect public information without executing the schema.

JSON Schema describes the constraints an already-formed JSON value should satisfy. It does not define how a raw string becomes that value. For example:

```json
{
  "type": "integer",
  "minimum": 1
}
```

This schema can constrain the number `2`, but it does not define how the URL string `"2"` should be parsed into a number, nor how the number should be serialized back to the URL. Similarly, `default` in JSON Schema is an annotation; it is not the same as Decurl actually applying `defaultValue` when a key is missing or decode fails.

JSON Schema can describe complex data structures through composition, references, and conditions. What it is not a direct fit for is arbitrary transformation, business algorithms, and bidirectional serialization. If these behaviors depend on custom keywords or vocabularies, consumers must understand the same extension semantics. The definition can still work, but portability decreases.

FieldCodec chooses to place executable behavior on functions:

```ts
const page = field({
  decode: pipe(trim, shape.integer, toNumber, min(1)),
  defaultValue: 1,
});
```

`decode` and `encode` can handle any synchronous transformation suitable for the current field without being limited by declarative keywords. `name`, `mode`, aliases, `defaultValue`, and `eq` only add the semantics needed by URL fields. FieldCodec is therefore also a specific protocol, but it intentionally keeps its boundary small around URL field encode/decode.

The cost of a function-centered design is missing introspection. For example, `elementOf(['list', 'grid'])` stores options inside the decode function closure. After the definition is complete, the option list cannot be read back from FieldCodec. In the future, FieldCodec may explicitly carry metadata to provide context for documentation, forms, or other tools. Until then, Decurl does not add these descriptive fields to the core protocol. Even if metadata exists later, `decode` should remain the source of truth for actual parsing behavior.

## Boundary with Standard Schema

[Standard Schema](https://standardschema.dev/) is not another declarative schema language. It is an interface for the TypeScript ecosystem that lets tools consume different validation libraries in one unified way, without writing a separate adapter for every library.

The core of Standard Schema V1 is `~standard.validate`. It receives unknown input and returns either a success result or structured issues. Validation can be synchronous or return a Promise:

```ts
validate(value)
  // -> { value }
  //  | { issues }
  //  | Promise<{ value } | { issues }>
```

Input and output can have different types, so a concrete validation library can transform values during validation. But Standard Schema only unifies the call and result protocol. It does not unify how schemas are defined, and it does not guarantee that static information such as enums can be read. It also does not define reverse encode, URL keys, single/multi, aliases, or default value omission. The Standard Schema project provides a separate Standard JSON Schema interface for JSON Schema conversion capability; that is not introspection capability of the Standard Schema validation interface itself.

Standard Schema can be used as validation inside FieldCodec decode, but their failure semantics and execution boundaries are different:

- Standard Schema expresses failure with `issues`, which fits callers that need structured errors.
- FieldCodec usually normalizes invalid URL values to `null` / `undefined`, then tries aliases, `defaultValue`, or page guards.
- Standard Schema allows asynchronous validation; FieldCodec decode intentionally stays synchronous.
- Standard Schema does not provide reverse serialization; FieldCodec can describe URL write-back rules with `encode`.

The three approaches focus on different layers:

| Approach | Core shape | Main capabilities | Not responsible for |
| --- | --- | --- | --- |
| JSON Schema | Declarative document | Static constraints, annotations, introspection | Arbitrary transformation and bidirectional serialization |
| Standard Schema | Validation interface | Type inference, unified calls, value or issues | Schema definition, introspection, and encode |
| FieldCodec | Encode/decode function protocol | URL field parsing, serialization, and field semantics | Full validation DSL and structured error trees |

## Boundary with URL Search State Libraries

URL search state libraries usually provide higher-level hooks, parsers, and router adapters.

Decurl puts more emphasis on the boundary between URL codecs and router hooks:

- `@decurl/react-router/codec` is responsible for Search Fields semantics.
- `@decurl/react-router/decode` is responsible for explicit raw string parsing.
- `@decurl/react-router/configured` is responsible for React Router runtime and hooks.
- Decode pipelines stay explicitly composed for review and testing.
- Alias, default, and patch encode are first-class URLSearchParams semantics.

Search Fields, decode pipelines, and URLSearchParams codecs can be used independently of hooks. Router integration is only an upper-level capability that consumes the same rules.
