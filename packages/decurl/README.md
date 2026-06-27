# decurl

Typed URL Search Params state, codecs, and React Router helpers.

`decurl` helps define URL search params as typed fields, decode them into application values, encode updates back to the URL, and use that state from React Router applications.

## Installation

```bash
pnpm add decurl
```

## Documentation

https://guanriyue.github.io/decurl/

## Entry Points

```ts
import { useSearchValue, useSearchValues } from 'decurl';
import { defineFields, field } from 'decurl/codec';
import { pipe, shape, toNumber } from 'decurl/decode';
import { useSearchPagination } from 'decurl/pagination';
import { routeSpec } from 'decurl/routeSpec';
import { createReactRouterSearch } from 'decurl/configured';
```

## Peer Dependencies

React and React Router are peer dependencies for the runtime hooks and React Router helpers. The codec and decode entry points are framework-independent.

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
