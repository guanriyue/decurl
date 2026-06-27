# Decurl

Typed URL Search Params state for React Router applications.

Decurl lets you describe URL search params as typed fields, decode raw URL
values into application values, and update the URL through React hooks. The
published package is `@guanriyue/decurl`.

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

## Package

The source for the published package lives in [`packages/decurl`](packages/decurl).

```ts
import { useSearchValue, useSearchValues } from '@guanriyue/decurl';
import { defineFields, field } from '@guanriyue/decurl/codec';
import { pipe, shape, toNumber } from '@guanriyue/decurl/decode';
import { createReactRouterSearch } from '@guanriyue/decurl/configured';
import { useSearchPagination } from '@guanriyue/decurl/pagination';
import { routeSpec } from '@guanriyue/decurl/routeSpec';
```

## Development

```bash
pnpm install
pnpm precheck
pnpm --filter decurl-website build
```

## Release

This repository uses Changesets.

```bash
pnpm changeset
pnpm run version
pnpm release
```

## License

MIT
