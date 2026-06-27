# Decurl

Typed URL Search Params state for React Router applications.

Decurl lets you describe URL search params as typed fields, decode raw URL
values into application values, and update the URL through React hooks. The
published package is `decurl`.

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

## Package

The source for the published package lives in [`packages/decurl`](packages/decurl).

```ts
import { useSearchValue, useSearchValues } from 'decurl';
import { defineFields, field } from 'decurl/codec';
import { pipe, shape, toNumber } from 'decurl/decode';
import { createReactRouterSearch } from 'decurl/configured';
import { useSearchPagination } from 'decurl/pagination';
import { routeSpec } from 'decurl/routeSpec';
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
pnpm version
pnpm release
```

## License

MIT
