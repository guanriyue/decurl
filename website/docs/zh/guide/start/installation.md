---
description: 安装 @guanriyue/decurl，并了解 Decurl 的基础使用方式。
---

# 安装使用

Decurl 目前以 `@guanriyue/decurl` 单包提供能力。使用默认 hooks 时，它支持 React 18、React 19，并要求使用 React Router 7。

## 安装

使用你项目中的包管理器安装：

```bash
pnpm add @guanriyue/decurl
```

也可以使用 npm 或 yarn：

```bash
npm install @guanriyue/decurl
```

```bash
yarn add @guanriyue/decurl
```

`@guanriyue/decurl` 会通过 conditional exports 暴露 codec、decode、pagination、routeSpec 等子入口。一般不需要单独安装其他 Decurl 包。

## 基础用法

Decurl 的基本流程是：

1. 定义 Search Fields。
2. 在 React Router hooks 中读取和更新 URL search state。

```tsx
import { useSearchValue } from '@guanriyue/decurl';
import { defineFields, field } from '@guanriyue/decurl/codec';
import { pipe, shape, trim } from '@guanriyue/decurl/decode';

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

默认入口的 `useSearchValue` 和 `useSearchValues` 可以直接在 React Router 环境中使用。对于大多数应用，不需要手动创建 Provider 或 store。

如果需要隔离多套 search state、绑定自定义 store，或减少组件对 React Router `useLocation` 的直接依赖，可以再阅读 [绑定 Store](../react-router/configured-store)。

## 下一步

- [快速开始](./getting-started)
- [React Router 集成](../react-router/overview)
- [Search Fields](../codec/search-fields)
