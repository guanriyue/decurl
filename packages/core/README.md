# @decurl/core

Core internal primitives for Decurl packages.

This package provides the shared codec and decode utilities used by Decurl packages that work with URL Search Params. It is published for package composition and type sharing, but most application code should use the higher-level Decurl packages instead.

## Entry Points

```ts
import { pipe, shape, toNumber, trim } from '@decurl/core/decode';
import { createURLSearchParamsCodec, field } from '@decurl/core/codec';
```

## Repository

https://github.com/guanriyue/decurl

## License

MIT
