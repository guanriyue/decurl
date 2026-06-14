---
description: 使用 @decurl/react-router 定义 Search Fields，并在 hooks 与 URLSearchParams codec 中复用。
---

# 快速开始

Decurl 的核心使用方式是：先定义一组 Search Fields，再在 hooks 或 URLSearchParams codec 中复用同一份规则。

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

这里用到了几个 API：

- [`field`](/zh/api/codec#field) 固化单个 FieldCodec 的类型。
- [`defineFields`](/zh/api/codec#definefields) 定义一组 Search Fields，并为没有显式 `name` 的字段使用对象 key。
- [`pipe`](/zh/api/decode#composition)、[`shape`](/zh/api/decode#shape--guard)、[`elementOf`](/zh/api/decode#shape--guard) 等 decode primitive 用于组合常见解析逻辑。

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

## 序列化 URLSearchParams

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

更多选项见 [`createURLSearchParamsCodec`](/zh/api/codec#createurlsearchparamscodec)。

## 在 React Router 中使用

React Router hooks 可以直接使用同一套 Search Fields。主入口 hooks 不需要额外 Provider。

```tsx
import { useSearchValues } from '@decurl/react-router';

const SearchPanel = () => {
  const [values, setValues] = useSearchValues(searchFields);

  return (
    <button onClick={() => setValues({ page: values.page + 1 })}>
      Next page
    </button>
  );
};
```

只读取单个字段时可以使用 [`useSearchValue`](/zh/api/react-router#usesearchvalue)。如果需要绑定 store、隔离多个 React Router runtime，或者减少组件对 React Router `useLocation` 的直接依赖，可以继续看 [`@decurl/react-router/configured`](/zh/api/configured)。

继续阅读：

- [API 概览](/zh/api/)
- [FieldCodec 定义](../codec/field-codec)
- [Decode pipeline](../codec/decode-pipeline)
- [Search Fields](../codec/search-fields)
- [React Router 集成](../react-router/overview)
