---
description: 安装 @decurl/react-router，并了解 Decurl 的基础使用方式。
---

# 安装使用

Decurl 当前面向 React Router 应用提供 `@decurl/react-router` 包。它支持 React 18、React 19，并要求使用 React Router 7。

## 安装

使用你项目中的包管理器安装：

```bash
pnpm add @decurl/react-router
```

也可以使用 npm 或 yarn：

```bash
npm install @decurl/react-router
```

```bash
yarn add @decurl/react-router
```

`@decurl/react-router` 会通过 conditional exports 暴露 codec、decode、pagination、routeSpec 等子入口。一般不需要单独安装其他 Decurl 包。

## 基础用法

Decurl 的基本流程是：

1. 定义 Search Fields。
2. 在 React Router hooks 中读取和更新 URL search state。

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

上面的例子会把输入框内容写入 URL 的 `q` 参数。URL 变化后，hook 也会重新 decode 出对应的业务值。

## 不需要额外 Provider

主入口的 `useSearchValue` 和 `useSearchValues` 可以直接在 React Router 环境中使用。对于大多数应用，不需要手动创建 Provider 或 store。

如果需要隔离多套 search state、绑定自定义 store，或减少组件对 React Router `useLocation` 的直接依赖，可以再阅读 [绑定 Store](../react-router/configured-store)。

## 下一步

- [快速开始](./getting-started)
- [React Router 集成](../react-router/overview)
- [Search Fields](../codec/search-fields)
