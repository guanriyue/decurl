---
description: Define Search Fields with decurl and reuse them in hooks and URLSearchParams codecs.
---

# Getting Started

The core Decurl workflow is: define a set of Search Fields first, then reuse the same rules in hooks or URLSearchParams codecs.

## Install

```bash
pnpm add decurl
```

`decurl` supports React 18 and React 19, and requires React Router 7.

## Define Fields

```ts
import { createURLSearchParamsCodec, defineFields, field } from 'decurl/codec';
import { elementOf, min, pipe, shape, toNumber, trim } from 'decurl/decode';

const searchFields = defineFields({
  q: field({
    decode: pipe(trim, shape(/.+/)),
  }),
  page: field({
    name: ['page', 'p'],
    decode: pipe(trim, shape.integer, toNumber, min(1)),
    defaultValue: 1,
  }),
  sort: field({
    decode: elementOf(['relevance', 'latest']),
    defaultValue: 'relevance',
  }),
});
```

This uses several APIs:

- [`field`](/api/codec#field) freezes the type of a single FieldCodec.
- [`defineFields`](/api/codec#definefields) defines a set of Search Fields and uses the object key for fields without an explicit `name`.
- Decode primitives such as [`pipe`](/api/decode#composition), [`shape`](/api/decode#shape--guard), and [`elementOf`](/api/decode#shape--guard) compose common parsing logic.

## Decode URLSearchParams

```ts
const codec = createURLSearchParamsCodec(searchFields);

const values = codec.decode(new URLSearchParams('?q=router&p=2&sort=latest'));

// values:
// {
//   q: 'router',
//   page: 2,
//   sort: 'latest',
// }
```

If the canonical key is missing, Decurl tries legacy aliases. The URL above uses `p=2`, but the decoded business field is `page`.

## Encode URLSearchParams

```ts
const nextSearch = codec.encode(
  { page: 3 },
  { base: '?q=router&p=2&sort=latest' },
);

nextSearch.toString();
// q=router&sort=latest&page=3
```

`encode` uses patch semantics by default:

- Only fields present in the patch are handled.
- Untouched fields from the base search are preserved.
- Alias fields are written with the canonical key.
- Writing a default value deletes the corresponding key by default.

See [`createURLSearchParamsCodec`](/api/codec#createurlsearchparamscodec) for more options.

## Use It with React Router

React Router hooks can use the same Search Fields directly. Default hooks do not require an extra Provider.

```tsx
import { useSearchValues } from 'decurl';

const SearchPanel = () => {
  const [values, setValues] = useSearchValues(searchFields);

  return (
    <button onClick={() => setValues({ page: values.page + 1 })}>
      Next page
    </button>
  );
};
```

Use [`useSearchValue`](/api/react-router#usesearchvalue) when reading a single field. If you need to bind a store, isolate multiple React Router runtimes, or reduce direct dependency on React Router `useLocation`, continue with [`decurl/configured`](/api/configured).

Continue reading:

- [API Overview](/api/)
- [FieldCodec](../codec/field-codec)
- [Decode pipeline](../codec/decode-pipeline)
- [Search Fields](../codec/search-fields)
- [React Router Integration](../react-router/overview)
