---
description: Install @decurl/react-router and learn the basic usage model of Decurl.
---

# Installation

Decurl currently provides the `@decurl/react-router` package for React Router applications. It supports React 18, React 19, and requires React Router 7.

## Install

Install it with the package manager used by your project:

```bash
pnpm add @decurl/react-router
```

You can also use npm or yarn:

```bash
npm install @decurl/react-router
```

```bash
yarn add @decurl/react-router
```

`@decurl/react-router` exposes codec, decode, pagination, routeSpec, and other sub-entries through conditional exports. In most cases, you do not need to install any other Decurl package.

## Basic Usage

The basic Decurl flow is:

1. Define Search Fields.
2. Read and update URL search state through React Router hooks.

```tsx
import { useSearchValue } from '@decurl/react-router';
import { defineFields, field } from '@decurl/react-router/codec';
import { pipe, shape, trim } from '@decurl/react-router/decode';

const searchFields = defineFields({
  keyword: field({
    name: 'q',
    decode: pipe(trim, shape(/.+/)),
  }),
});

const SearchInput = () => {
  const [keyword, setKeyword] = useSearchValue(searchFields.keyword);

  return (
    <input
      value={keyword ?? ''}
      onChange={(event) => {
        const value = event.currentTarget.value;

        setKeyword(value);
      }}
    />
  );
};
```

This example writes the input value to the `q` param in the URL. When the URL changes, the hook decodes the corresponding business value again.

## No Extra Provider Required

The main-entry `useSearchValue` and `useSearchValues` hooks can be used directly in a React Router environment. Most applications do not need to manually create a Provider or store.

If you need to isolate multiple search state instances, bind a custom store, or reduce direct dependency on React Router `useLocation`, continue with [Bound Store](../react-router/configured-store).

## Next Steps

- [Getting Started](./getting-started)
- [React Router Integration](../react-router/overview)
- [Search Fields](../codec/search-fields)
