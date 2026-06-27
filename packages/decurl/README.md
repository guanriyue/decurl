# decurl

Typed URL Search Params state for React Router applications.

`decurl` helps define URL search params as typed fields, decode raw URL values
into application values, encode updates back to the URL, and use that state
from React Router applications.

## Installation

```bash
pnpm add decurl
```

React and React Router are peer dependencies:

```bash
pnpm add react react-router
```

## Documentation

https://guanriyue.github.io/decurl/

## Entry Points

```ts
import { useSearchValue, useSearchValues } from 'decurl';
import { createReactRouterSearch } from 'decurl/configured';
import { defineFields, field } from 'decurl/codec';
import { pipe, shape, toNumber } from 'decurl/decode';
import { useSearchPagination } from 'decurl/pagination';
import { routeSpec } from 'decurl/routeSpec';
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
