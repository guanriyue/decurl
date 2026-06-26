# @decurl/react-router

React Router integration for Decurl URL Search Params state.

This package provides hooks and runtime helpers for reading and updating typed URL Search Params in React Router applications. It builds on `@decurl/core` and re-exports the codec and decode primitives needed to define URL state.

## Documentation

https://guanriyue.github.io/decurl/

## Entry Points

```ts
import { useSearchValue, useSearchValues } from '@decurl/react-router';
import { createReactRouterSearch } from '@decurl/react-router/configured';
import { field } from '@decurl/react-router/codec';
import { pipe, shape, toNumber } from '@decurl/react-router/decode';
import { useSearchPagination } from '@decurl/react-router/pagination';
import { routeSpec } from '@decurl/react-router/routeSpec';
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
