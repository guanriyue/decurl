# useSearchPagination Guide

`useSearchPagination` 是基于 search params fields 的分页行为 hook。它用于封装分页场景中常见的 URL 状态读取、组合更新和页码联动逻辑。

## 职责范围

`useSearchPagination` 负责：

- 从 search params 中读取 `page` 和 `pageSize`
- 提供 `setPage`
- 提供 `resetPage`
- 提供 `setPageSize`
- 提供 `setPagination`
- 在 `pageSize` 改变时根据策略同步更新 `page`
- 提供 `preventOverflow`，用于在获得可信 `total` 后执行一次页码修正

以下能力属于业务层或 UI 层：

- 数据请求
- 请求缓存
- 表格状态管理
- UI 组件渲染
- page size 选择器渲染
- 业务筛选、排序、搜索条件管理
- 从自定义 fields 中反推 page size options
- 判断请求结果何时可信以及何时调用 `preventOverflow`

## 默认用法

`useSearchPagination` 从 pagination 子路径导入：

```ts
import { useSearchPagination } from 'decurl/pagination'
```

Hook 支持以下调用形式：

```ts
type UseSearchPagination = {
  (): UseSearchPaginationResult
  (
    options?: UseSearchPaginationOptions,
  ): UseSearchPaginationResult
  (
    fields: SearchPaginationFields,
    options?: UseSearchPaginationOptions,
  ): UseSearchPaginationResult
  fields: SearchPaginationFields
  pageSizeOptions: readonly number[]
}
```

单对象参数同时包含 `page` 和 `pageSize` field 时视为 `SearchPaginationFields`，否则视为 `UseSearchPaginationOptions`。

不传入 `fields` 时，`useSearchPagination` 使用内置默认 fields：

```ts
const pagination = useSearchPagination()
```

默认 fields 可以通过静态属性访问：

```ts
useSearchPagination.fields
```

默认 page size options 可以通过静态属性访问：

```ts
useSearchPagination.pageSizeOptions
```

默认 page size options 只描述默认分页模型。它们适合在默认分页场景下渲染 page size 选择器：

```tsx
const pagination = useSearchPagination()

<PageSizeSelect
  value={pagination.pageSize}
  options={useSearchPagination.pageSizeOptions}
  onChange={pagination.setPageSize}
/>
```

默认模型中，`page` 最小值为 `1`。默认 page size options 为 `[10, 20, 50, 100]`，默认 `pageSize` 使用第一项。默认 codec 会在 trim 后只接受严格正整数格式，并要求 `pageSize` 属于默认 options；例如 `pageSize=30` 会 decode 失败并回退到 `10`。

`resetPage()` 提交 `page: 1`，而不是提交删除操作。最终 URL 和重新 decoded 的 `page` 由 page codec 决定。它适合在筛选条件、搜索关键词等业务条件变化后回到第一页。

## 返回值

```ts
type UseSearchPaginationResult = {
  page: number
  pageSize: number
  setPage: (page: number, options?: SearchNavigateOptions) => void
  resetPage: () => void
  setPageSize: (
    pageSize: number,
    options?: SearchNavigateOptions,
  ) => void
  setPagination: (
    patch: SearchPaginationPatch,
    options?: SearchNavigateOptions,
  ) => void
  preventOverflow: (
    totalSource: SearchPaginationTotalSource,
  ) => void
}

type SearchPaginationPatch = {
  page?: number | null | undefined
  pageSize?: number | null | undefined
}

type SearchNavigateOptions = {
  replace?: boolean
  preventScrollReset?: boolean
}
```

`page` 和 `pageSize` 都是 decode 后的 `number`。setter 不支持 updater，所有方法都返回 `void`。

`setPage`、`setPageSize` 和 `setPagination` 支持 `SearchNavigateOptions`。`resetPage` 和 `preventOverflow` 使用默认导航行为，不接收 navigate options。

## Codec 职责

Pagination 方法只向底层 fields 提交语义 patch。值是否可编码、URL 表示、默认值省略、非法值处理及重新 decode 后的结果，均由对应 FieldCodec 决定。pagination setter 不建立独立于 fields codec 的输入验证规则：

- `setPage(value)` 请求设置当前页
- `setPageSize(value)` 请求设置每页数量，并应用 page size 联动策略
- `setPagination(patch)` 把分页字段 patch 交给对应 codec
- `resetPage()` 请求把当前页设置为语义值 `1`

Setter 不保证传入的原始数字会原样出现在 URL 或最终 decoded state 中。调用方应向 `setPage` 和 `setPageSize` 传入对应 codec 定义的合法 decoded value。

## 自定义 Fields

如果当前页面需要不同的分页参数规则，可以传入自定义 fields：

```ts
const pagination = useSearchPagination(fields)
```

自定义 fields 后，`useSearchPagination` 只消费传入的 fields。自定义 fields 可以定义 URL key、page size 白名单和固定 page size。Pagination 每次读取到的 decoded values 必须满足以下算法不变量：

- decoded `page` 是从 `1` 开始的正安全整数，page codec 的默认值应为 `1`
- decoded `pageSize` 是大于 `0` 的正安全整数，pageSize codec 提供确定的合法 `defaultValue`
- 固定 page size 必须大于 `0`
- 0-based page 不受支持

如何保证这些 decoded values 满足不变量属于 FieldCodec 的职责。

固定 page size 不改变 Hook 的返回形状，`setPageSize` 和 `setPagination` 仍然存在。调用 `setPageSize` 时，Pagination 仍会提交 pageSize patch，并根据调用参数提交对应的 page 联动 patch；pageSize codec 可以让最终 decoded `pageSize` 保持固定值，但已经提交的 page patch 仍然独立交给 page codec 处理。

```ts
const pageSizeOptions = [10, 20, 50, 100] as const

const fields = {
  page: pageField,
  pageSize: pageSizeField(pageSizeOptions),
} satisfies SearchPaginationFields

const pagination = useSearchPagination(fields)
```

自定义 fields 场景中，如果页面需要渲染 page size 选择器，应消费页面自己定义的静态数据：

```tsx
<PageSizeSelect
  value={pagination.pageSize}
  options={pageSizeOptions}
  onChange={pagination.setPageSize}
/>
```

## Options

`options` 用于配置分页行为：

```ts
type UseSearchPaginationOptions = {
  pageSizeChangeStrategy?: 'reset' | 'preserve-offset'
}
```

```ts
const pagination = useSearchPagination({
  pageSizeChangeStrategy: 'preserve-offset',
})
```

也可以和自定义 fields 一起使用：

```ts
const pagination = useSearchPagination(fields, {
  pageSizeChangeStrategy: 'reset',
})
```

`pageSizeChangeStrategy` 支持：

- `'reset'`
- `'preserve-offset'`

`setPageSize` 默认会把 `page` 重置为 `1`。使用 `'preserve-offset'` 时，会尽量保持当前 item offset 所在的位置。

`'preserve-offset'` 使用以下公式：

```ts
const nextPage =
  Math.floor(((page - 1) * pageSize) / nextPageSize) + 1
```

公式中的 `nextPageSize` 是调用者传给 `setPageSize` 的原始语义值，不是经 pageSize codec 编码并重新 decode 后的结果。Pagination 使用当前 decoded `page`、当前 decoded `pageSize` 和这个调用参数计算 page patch，然后把 page 与 pageSize patch 分别交给对应 codec。

例如当前为第 `3` 页、每页 `10` 条，切换到每页 `20` 条时，原第 `3` 页第一条数据的 offset 为 `20`，新的页码为 `2`。

## setPagination

`setPagination(patch, options?)` 提交 partial 语义 patch，不应用 `pageSizeChangeStrategy`：

```ts
pagination.setPagination({
  page: 3,
  pageSize: 20,
})
```

同时提供 `page` 和 `pageSize` 时，两个值都按原值交给对应 codec。只提供 `pageSize` 时，patch 中不包含 `page`。需要提交 page size 联动 patch 时，应调用 `setPageSize`。

patch 中出现的字段按原值交给对应 codec，未出现的字段不参与本次 patch。字段最终如何影响 URL 和 decoded state 属于 FieldCodec 的职责。

省略属性与显式传入 `undefined` 的语义不同：

```ts
pagination.setPagination({})
// patch 中不包含 page 或 pageSize

pagination.setPagination({ page: undefined })
// patch 中包含 page: undefined，并交给 page codec

pagination.setPagination({ pageSize: null })
// patch 中包含 pageSize: null，并交给 pageSize codec
```

## preventOverflow

`preventOverflow(totalSource)` 根据当前 decoded `pageSize` 计算最大页码。当当前 decoded `page` 超出最大页码时，它会提交最大页码 patch。最终 URL 和重新 decoded 的 `page` 由 page codec 决定。

`totalSource` 支持：

- `number`
- `null` / `undefined`，不提交修正 patch
- `{ total?: number | null | undefined }`

对应类型为：

```ts
type SearchPaginationTotalSource =
  | number
  | null
  | undefined
  | { total?: number | null | undefined }
```

`preventOverflow` 不判断数据来源是否可信。调用方应只在请求结果已经被应用接受，并且确认结果与当前查询条件对应后调用它。

合法 `total` 必须是大于或等于 `0` 的安全整数。负数、小数、`NaN`、`Infinity` 以及对象中的非法 `total` 都不会触发页码修正。

顶层 `null`、`undefined`，以及对象中的 `total: null | undefined`，都表示当前没有可用于修正的 total，`preventOverflow` 不提交 patch。

数字 total 使用以下最大页码规则：

```ts
const pageCount = Math.max(1, Math.ceil(total / pageSize))
```

因此 `total=0` 时最大页码仍为 `1`。当前 decoded `page` 小于或等于最大页码时，`preventOverflow` 不提交 patch；只有当前页码更大时才提交最大页码 patch。方法始终返回 `void`。

### SWR

SWR 可以在请求成功后执行修正：

```tsx
const pagination = useSearchPagination()

const result = useSWR(
  ['users', pagination.page, pagination.pageSize],
  () => {
    return fetchUsers({
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
  },
  {
    onSuccess(data) {
      pagination.preventOverflow(data.total)
    },
  },
)
```

这个调用只处理实际触发的成功回调。SWR dedupe、cache 和外部数据变化下的完整权衡见 [Pagination Overflow Coordination](../architecture/pagination-overflow-coordination.md)。

### React Query

React Query 场景由开发者根据项目采用的 cache、placeholder 和 freshness 配置选择调用时机。例如，可以只在当前 observer 挂载后获得稳定的成功结果时执行修正：

```tsx
const total = query.data?.total
const canCorrectPage =
  query.isSuccess &&
  query.isFetchedAfterMount &&
  !query.isFetching &&
  !query.isPlaceholderData &&
  total !== undefined

React.useEffect(() => {
  if (!canCorrectPage || total === undefined) {
    return
  }

  pagination.preventOverflow(total)
}, [canCorrectPage, total, pagination.preventOverflow])
```

是否信任 mount 前的 cache、`initialData` 或其他数据来源属于应用的数据策略。pagination 模块不提供 React Query 专用 guard，也不替应用决定这些结果是否可信。

### 直接异步请求

对于直接执行的异步请求，在结果通过当前业务状态校验后显式调用。下面通过 request version 排除已经失效的 stale 请求：

```ts
const requestVersion = ++latestRequestVersion.current
const result = await fetchPage({
  page: pagination.page,
  pageSize: pagination.pageSize,
})

if (requestVersion !== latestRequestVersion.current) {
  return
}

pagination.preventOverflow(result.total)
```

### 使用边界

`preventOverflow` 是在获得可信 `total` 后执行的恢复措施，不是完整的分页防护机制。它不能：

- 在没有请求或其他数据更新时发现服务端变化
- 判断 `total` 是否属于当前筛选条件和分页请求
- 保证请求库复用缓存时仍然得到调用
- 自动排除 stale 请求、已取消请求、retry 和 prefetch 的结果
- 替代分页组件对上一页、下一页和页码输入的限制
- 阻止用户手动输入无效 URL

分页 UI 应优先限制普通用户交互产生的无效页码，例如对目标页码执行 clamp，并在第一页和最后一页禁用对应操作。`preventOverflow` 是这些 UI 约束之外的恢复措施，主要处理共享链接、手动修改 URL、缺少 `total` 的独立状态更新和多人操作导致数据总量变化等请求前无法确认的情况。

响应式 guard 的数据正确性优势、请求状态判断难点和实现边界见 [Pagination Overflow Coordination](../architecture/pagination-overflow-coordination.md)。

## API 边界

`fields` 是 decurl 的一等模型。`useSearchPagination` 的核心职责是分页行为封装，而不是分页参数定义系统。

默认分页场景使用内置 fields 和 `useSearchPagination.pageSizeOptions`。自定义分页场景由开发者显式定义 fields，并由页面自己管理对应的 page size 静态选项。
