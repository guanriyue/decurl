# RouteSpec URL Contract

`routeSpec` 用于集中定义 React Router 应用中的 URL contract，并从业务值生成类型安全的 href。

它组合三类信息：

- React Router path pattern。
- 从 path pattern 推导的 path params。
- 由 `@guanriyue/decurl/codec` `RecordCodec` 描述的 search params。

`routeSpec` 是 URL 元数据和生成工具，不是 UI router 定义。它不接收 component、loader、action 或 layout。

推荐依赖方向：

```txt
routeSpec -> page/component -> router config -> app
```

## 基本用法

应用可以集中维护一组 route specs：

```ts
export const to = {
  users: routeSpec({
    path: '/users',
    search: usersSearch,
  }),

  userDetail: routeSpec({
    path: '/users/:id',
  }),
}
```

在组件和导航逻辑中直接调用：

```tsx
<Link to={to.userDetail({ id: userId })}>
  Detail
</Link>
```

```ts
navigate(to.users({ keyword: 'decurl', page: 2 }))
```

router config 复用同一份 path pattern：

```tsx
const routes = [
  {
    path: to.users.path,
    element: <UsersPage />,
  },
  {
    path: to.userDetail.path,
    element: <UserDetailPage />,
  },
]
```

## 能力一览

| 能力 | 状态 |
| --- | --- |
| 必需 path params | 已支持 |
| 可选 path params | 已支持 |
| splat | 已支持 |
| search encode | 已支持 |
| 通过 `useSearchValues` 读取 search | 已支持 |
| flat input | 已支持 |
| `hrefByParts` | 已支持 |
| path param 类型覆盖 | 不提供 |
| state contract | 不提供 |
| hash contract | 不提供 |
| pathname 匹配和 path params 解析 | 不属于 routeSpec |
| parent/child route composition | 不属于 routeSpec |
| 完整 URL 和 React Router `To` 输出 | 不提供 |

## 能力

### Path

`path` 必须是以 `/` 开头的绝对 React Router path pattern：

```ts
routeSpec({ path: '/users' })
routeSpec({ path: '/users/:id' })
routeSpec({ path: '/:lang?/categories' })
routeSpec({ path: '/files/*' })
```

类型约束 `` `/${string}` `` 只负责保证 path 以 `/` 开头。`path` 在语义上只能包含 pathname pattern，不应包含 search 或 hash：

```ts
// 不应使用
routeSpec({ path: '/users?keyword=decurl' })
routeSpec({ path: '/users#profile' })
```

search 应通过 `search` definition 表达；hash 不由 routeSpec 表达。

path params 的生成规则与 React Router `generatePath` 保持一致，包括：

- 必需动态参数，例如 `:id`。
- 可选动态参数，例如 `:lang?`。
- splat 参数，例如 `*`。

普通 path param 接受 `string | number | boolean`，非 nullish 值会在交给 `generatePath` 前转换为字符串。

`basename` 不属于 routeSpec。无论 React Router 是否配置 basename，routeSpec 中仍定义应用内部 path：

```ts
routeSpec({ path: '/users' })
```

routeSpec 生成的 href 适合交给 React Router `Link` 或 `navigate`。直接将结果用于原生 `<a href>` 时，不会由 routeSpec 补充 basename；调用方应继续通过 React Router 的 href 能力处理 basename。

### Search

search definition 复用 `@guanriyue/decurl/codec` 的 `RecordCodec`：

```ts
const users = routeSpec({
  path: '/users',
  search: usersSearch,
})
```

生成 href 时，search 编码、字段别名和默认值省略规则均由 codec 层决定：

```ts
users({ keyword: 'decurl', page: 2 })
// /users?keyword=decurl&page=2
```

读取 search params 仍然使用 React 集成：

```ts
const [search] = useSearchValues(users.search)
```

`routeSpec` 不重复实现 search decode runtime。

### Flat Input

直接调用 routeSpec 时，path params 和 search input 合并为一个对象：

```ts
userDetail({
  id: userId,
  tab: 'profile',
})
```

如果 path params 与 search properties 同名，flat input 会被禁用，调用方必须使用 `hrefByParts`：

```ts
userDetail.hrefByParts({
  params: {
    id: userId,
  },
  search: {
    id: filterId,
  },
})
```

`hrefByParts` 是明确、无歧义的基准生成 API。

## 类型提取

公开的类型提取器对应三个常见业务边界：

```ts
type Params = InferRouteSpecParams<typeof to.userDetail>
type SearchInput = InferRouteSpecSearchInput<typeof to.users>
type SearchValues = InferRouteSpecSearchValues<typeof to.users>
```

- `Params`：生成 pathname 时接受的 path params。
- `SearchInput`：生成 href 时接受的 partial search 输入，可以包含 nullish 值。
- `SearchValues`：从 URL 解码后的完整业务状态，反映 optional 和 defaultValue 语义。

## 边界

### Path Params 读取

`routeSpec` 不负责 pathname 匹配或 path params 解析。页面继续通过 React Router `useParams` 读取原始 path params：

```ts
const params = useParams()
```

这也避免 routeSpec 提前定义 path decode 失败模型。对于重要 path param，`missing` 与 `invalid` 必须是不同结果，不能同时折叠成 `undefined`。

### Router 配置

`routeSpec` 不保存 parent/child 关系，也不组合父子 path。应用可以使用嵌套对象整理 specs，但对象层级没有路由语义：

```ts
const to = {
  user: {
    list: routeSpec({ path: '/users' }),
    detail: routeSpec({ path: '/users/:id' }),
  },
}
```

### 输出形态

`routeSpec` 只生成应用内部 href 字符串，不生成完整 URL 或 React Router `To` 对象。

`preserveDefault` 不开放 routeSpec 级配置，继续使用 codec 层的默认 canonical 序列化行为。
