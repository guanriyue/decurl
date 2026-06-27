# decurl

React Router integration for Decurl URL Search Params state.

This package provides hooks and runtime helpers for reading and updating typed URL Search Params in React Router applications.

## Documentation

https://guanriyue.github.io/decurl/

## Entry Points

```ts
import { useSearchValue, useSearchValues } from 'decurl';
import { createReactRouterSearch } from 'decurl/configured';
import { field } from 'decurl/codec';
import { pipe, shape, toNumber } from 'decurl/decode';
import { useSearchPagination } from 'decurl/pagination';
import { routeSpec } from 'decurl/routeSpec';
```

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
