# @guanriyue/decurl

Typed URL Search Params state for React Router applications.

`@guanriyue/decurl` helps define URL search params as typed fields, decode raw URL values
into application values, encode updates back to the URL, and use that state
from React Router applications.

## Installation

```bash
pnpm add @guanriyue/decurl
```

React and React Router are peer dependencies:

```bash
pnpm add react react-router
```

## Documentation

https://guanriyue.github.io/decurl/

## Entry Points

```ts
import { useSearchValue, useSearchValues } from '@guanriyue/decurl';
import { createReactRouterSearch } from '@guanriyue/decurl/configured';
import { defineFields, field } from '@guanriyue/decurl/codec';
import { pipe, shape, toNumber } from '@guanriyue/decurl/decode';
import { useSearchPagination } from '@guanriyue/decurl/pagination';
import { routeSpec } from '@guanriyue/decurl/routeSpec';
```

The default entry provides React Router hooks. The `codec` and `decode` entry
points are framework-independent utilities for describing and decoding URL
Search Params.

## Peer Dependencies

```json
{
  "react": "^18.0.0 || ^19.0.0",
  "react-router": "^7.0.0"
}
```

## Repository

https://github.com/guanriyue/decurl

## License

MIT
