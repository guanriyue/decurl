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
import { SearchProvider, useSearchValue, useSearchValues } from '@guanriyue/decurl';
import { SearchRuntimeConnector, useProvidedSearchValue } from '@guanriyue/decurl/provided';
import { defineFields, field } from '@guanriyue/decurl/codec';
import { pipe, shape, toNumber } from '@guanriyue/decurl/decode';
import { useSearchPagination } from '@guanriyue/decurl/pagination';
import { routeSpec } from '@guanriyue/decurl/routeSpec';
```

The default entry provides React Router hooks. The `codec` and `decode` entry
points are framework-independent utilities for describing and decoding URL
Search Params.

`SearchProvider` is optional for the default hooks. Use the `provided` entry only
when you want explicit runtime wiring through `SearchRuntimeConnector`; it is an
optimization-oriented API and requires `SearchProvider`.

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
