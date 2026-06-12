---
description: 使用 @decurl/react-router 的 codec/decode 子入口定义 URLSearchParams schema，并在 React Router hooks 中复用。
---

# 快速开始

先从 `@decurl/react-router` 的 codec/decode 子入口开始。应用只需要安装 `@decurl/react-router`，schema 定义和 hooks 可以共享同一份字段定义。

## 定义字段

```ts
import { createURLSearchParamsCodec, defineFields, field } from '@decurl/react-router/codec';
import { elementOf, min, pipe, shape, toNumber, trim } from '@decurl/react-router/decode';

const searchFields = defineFields({
  q: field({
    decode: pipe(trim, shape(/.+/)),
  }),
  page: field({
    name: ['page', 'p'],
    decode: pipe(trim, shape.integer, toNumber, min(1)),
    defaultValue: 1,
  }),
  sort: field({
    decode: elementOf(['relevance', 'latest']),
    defaultValue: 'relevance',
  }),
});
```

这里有几件事值得注意：

- `q` 没有写 `name`，会使用 schema property key，也就是 `q`。
- `page` 有两个 name，`page` 是 canonical key，`p` 是 legacy alias。
- `page` 和 `sort` 有 `defaultValue`，所以 decode 后一定有值。
- `decode` 是显式 pipeline，每一步都能独立阅读和测试。

## 解析 URLSearchParams

```ts
const codec = createURLSearchParamsCodec(searchFields);

const values = codec.decode(new URLSearchParams('?q=router&p=2&sort=latest'));

// values:
// {
//   q: 'router',
//   page: 2,
//   sort: 'latest',
// }
```

如果 canonical key 缺失，Decurl 会尝试 legacy alias。上面的 URL 使用的是 `p=2`，但 decode 后得到的是业务字段 `page`。

## 写回 URLSearchParams

```ts
const nextSearch = codec.encode(
  { page: 3 },
  { base: '?q=router&p=2&sort=latest' },
);

nextSearch.toString();
// q=router&sort=latest&page=3
```

`encode` 默认是 patch 语义：

- 只处理 patch 中出现的字段。
- 保留 base 中未触碰的字段。
- 写入 alias 字段时使用 canonical key。
- 写入 default value 时默认删除对应 key。

## 在 React Router 中使用

React Router hooks 会复用同一套 field codec。

```tsx
import { BrowserRouter } from 'react-router';
import { createReactRouterSearch } from '@decurl/react-router/configured';

const search = createReactRouterSearch();

export function App() {
  return (
    <BrowserRouter>
      <search.Provider>
        <SearchPanel />
      </search.Provider>
    </BrowserRouter>
  );
}

function SearchPanel() {
  const [values, setValues] = search.useSearchValues(searchFields);

  return (
    <button onClick={() => setValues({ page: values.page + 1 })}>
      Next page
    </button>
  );
}
```

继续阅读：

- [Decode pipeline](../codec/decode-pipeline)
- [Schema 与 codec](../codec/schema-codec)
- [React Router 集成](../react-router/overview)
