# Search State Hook 目标

本文记录 `@guanriyue/decurl` search state hooks 的行为边界。

## Public API

多字段 hook 形态：

```ts
const [values, setValues] = useSearchValues(schema)
```

返回值采用 tuple，贴近 React `useState` 的使用心智。

`values` 是根据 schema decode 后的数据对象。

`setValues` 提交 partial patch：

```ts
setValues({ foo: 'next' })
setValues((prev) => ({ page: prev.page + 1 }))
setValues(undefined)
setValues({ page: 2 }, { replace: true, preventScrollReset: true })
```

`setValues` 返回 `void`。

`setValues(undefined)` 表示删除当前 schema 中所有 field 对应的 search 参数，等价于把当前 schema 的每个字段都 patch 为 `undefined`。schema 之外的 search 参数应保持不变。

Navigate options 支持作为 `setValues` 的第二参数。

支持的 navigate options：

- `replace`
- `preventScrollReset`

默认采用 `replace: true`。

单字段 hook 形态：

```ts
const [value, setValue] = useSearchValue(namedFieldCodec)
```

`useSearchValue` 只接收 `NamedFieldCodec`。

单字段场景没有 schema prop key，因此 URL key 必须由 `codec.name` 明确提供。

`setValue(null)` 和 `setValue(undefined)` 表示删除该 field 对应的 search 参数。

常用分页 hook 形态：

```ts
const pagination = useSearchPagination()
```

`useSearchPagination` 是基于 search params fields 的分页行为 hook。它面向 `page` 和 `pageSize` 两个语义字段，负责 URL 状态读取、组合更新和页码联动逻辑，并提供：

- `setPage`
- `resetPage`
- `setPageSize`
- `setPagination`
- `preventOverflow(totalSource)`

完整使用边界见 [useSearchPagination Guide](../guide/use-search-pagination.md)。

## Decoded Data First

业务开发者优先面对 decoded data。

`URLSearchParams` 是 runtime/store 内部细节，不应作为主返回值暴露。

这意味着 hook 的主要职责不是包装 React Router 的 `useSearchParams`，而是提供 URL-backed decoded state。

## Codec Semantics

`useSearchValues` 和 `useSearchValue` 的 encode/decode 行为应遵守 `@guanriyue/decurl/codec` 语义。

React Router runtime 不重新定义 codec 行为。

对 hook 有直接影响的约束：

- 默认值是否写入 URL 由 codec 层的 `preserveDefault` 语义决定。默认情况下，等于 `defaultValue` 的 field 可以不出现在 URL 中，但 decoded data 仍应得到默认值。
- decode 失败时应回退到默认值。该能力由 codec 层负责；如果 codec 当前能力不足，应先补齐 codec 层能力，再由 runtime 消费。
- multi field 默认顺序敏感。如果业务需要无序集合语义，应在 FieldCodec 中自定义 `eq`，并自行处理对应 encode/decode 规则。

完整 codec 规则以 codec 架构文档为准。

## Partial Update

多次 partial update 应合并到同一个 optimistic search state。

例如当前 search data 是：

```ts
{ foo, bar, page, pageSize }
```

连续调用：

```ts
setValues({ foo: newFoo })
setValues({ bar: newBar })
```

预期得到：

```ts
{ foo: newFoo, bar: newBar, page, pageSize }
```

不同组件可以只关心自己拥有的字段，不需要知道完整 search schema。

## Updater 语义

`setValues` 支持 updater：

```ts
setValues((prev) => ({ page: prev.page + 1 }))
```

updater 返回 patch，而不是完整 state。

如果 updater 返回 `undefined`，语义与 `setValues(undefined)` 相同。

updater 与 React `setState(updater)` 是同类机制，开发者有义务保证它是纯函数。

内部可能执行 updater 0 次、1 次或多次。

如果开发者违反纯函数原则，导致的重复执行、时序差异或状态异常，由开发者自行负责。

具体 replay 和时序规则属于 [Search State Store 状态机](search-state-store.md)。

## Flush

`setValues` 后，decoded state 必须立即变化并触发 React render。

URL 同步可以延迟。

flush 到 URL 时，导航必须走 React Router 提供的 navigate 能力，确保 React Router 能正确感知导航行为。

pending flush 使用短延迟窗口；默认延迟为 100ms。

## Runtime 边界

默认 runtime 基于 React Router。

Hook 不直接操作 `window.history` 或 `window.navigation`。

Runtime 规则见 [Runtime 边界](runtime-boundary.md)。
