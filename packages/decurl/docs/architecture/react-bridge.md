# React Bridge

本文档用于记录 store 接入 React 的设计。

## 目标

React Bridge 是 Store 与 React render 之间的边界。

它负责：

- 订阅 store snapshot。
- 将 React Router hook 能力绑定到 singleton store。
- 将 React Router location 变化同步给 store。
- 通过 selector 从 optimistic search 派生 decoded values。
- 在 schema 引用稳定时提供稳定的 `setValues`。

它不负责 store 状态机。

## useSyncExternalStore

Hook 应通过 `useSyncExternalStore` 订阅 store。

概念形态：

```ts
const selectValues = useSearchStateSelector(schema, decodeValues)
const getValuesSnapshot = () => selectValues(store.getSnapshot())

const values = useSyncExternalStore(
  store.subscribe,
  getValuesSnapshot,
  getValuesSnapshot,
)
```

`store.subscribe` 只在 search state 发生变化时通知。

`useSyncExternalStore` 的 snapshot 必须是 selector 结果，而不是全量 store snapshot。

这样当 store 发生变化但当前 hook 关心的 decoded values 未变化时，selector 会返回 previous 引用，React 不会因为无关 search field 变化而更新该 hook。

Runtime 配置变化不应触发 subscribe listener。

## Snapshot

Snapshot 应至少包含当前 optimistic location：

```ts
type SearchStoreSnapshot = {
  location: SearchLocation
}
```

Hook decode 的数据来自：

```ts
snapshot.location.search
```

而不是直接来自 React Router `useLocation().search`。

这是为了保证 `setValues` 后，在 URL flush 完成之前，业务已经能读取到 optimistic decoded data。

## CSR

React Bridge 面向客户端渲染。

SSR 阶段不写入 URL，也不承诺完整路由同步语义。

如果需要传入 `useSyncExternalStore` 的第三个参数，应复用 selected snapshot getter。

## Runtime Binding

默认 singleton store 不能直接调用 React hooks。

因此 hook 需要在 render 阶段把当前 React Router 能力配置给 store：

```ts
const location = useLocation()
const navigate = useNavigate()

store.configureRuntime({
  getLocation: () => ({
    pathname: location.pathname,
    search: location.search,
  }),
  navigate: (nextLocation, options) => {
    navigate(toNavigateSearch(nextLocation), options)
  },
})
```

`configureRuntime` 是配置更新。

它不应：

- 修改 optimistic state。
- 触发 subscribers。
- 调度 flush。
- 执行 navigate。

## Location Sync

Hook 负责把 React Router location 变化同步给 store。

概念形态：

```ts
useLayoutEffect(() => {
  store.locationChanged({
    pathname: location.pathname,
    search: location.search,
  })
}, [location.pathname, location.search])
```

Hook 不判断 location change 来源。

来源判断属于 [Search State Store 状态机](search-state-store.md)。

## Selector

`useSearchValues(schema)` 返回 decoded data 对象。

`useSearchValue(namedFieldCodec)` 返回单个 decoded field value。

`useSearchPagination()` 是组合 hook，内部仍通过 `useSearchValues` 订阅和写入 search state。它不新增 Store 或 Runtime 语义。

Hook 不应只依赖 `useMemo` 来保证 `values` 引用稳定。

`values` 应通过 selector 从 store snapshot 取得。

```ts
const selectValues = useSearchStateSelector(schema, decodeValues)
const values = useSyncExternalStore(
  store.subscribe,
  () => selectValues(store.getSnapshot()),
  () => selectValues(store.getSnapshot()),
)
```

Selector 每次基于当前 optimistic search decode：

```ts
const nextValues = decodeFields(
  schema,
  new URLSearchParams(snapshot.location.search),
)
```

然后与上一次 selector 结果比较。

如果相等，应返回上一次 values 引用。

如果不相等，才返回新的 decoded values。

## Values Equality

`values` 的相等性分两层：

1. 整个 values 对象采用 shallow equal。
2. 每个 key 对应的 field value 采用 field codec equality。

Bridge 应优先使用 codec 层提供的 schema 级 helper：

```ts
isFieldValuesEqual(schema, nextValues, previousValues)
```

完整 field equality 规则以 codec 架构文档为准。

Selector 的目标是确保：

```ts
same decoded data => same values reference
changed decoded data => new values reference
```

这对依赖 `values` 引用的 React memo、effect 和组件 props 都很重要。

## Schema Stability

`schema` 应被视为定义对象。

如果业务在每次 render 都创建新的 schema，对应的 selector cache 也会失效。Hook 不额外处理 schema 稳定性问题。

如果 `schema` 引用变化，selector 可以视为新的 selector 输入。

实现时，如果 schema 变化带来的闭包或 entry 上下文难以处理，可以在 add entry 时把 patch、updater、schema 等上下文信息一并记录到 entry。

这是最保守的策略。

默认情况下，Hook 不尝试复用 previous pending entry 的 schema。

## Setter

Public setter 语义由 [Search State Hook 目标](search-state-hook.md) 定义。

Hook 不应提前执行 updater。

Updater 必须交给 store，在 pending replay 时基于当时的 intermediate decoded data 执行。

概念形态：

```ts
const setValues = useCallback((patch, options) => {
  store.addEntry({
    apply: (searchParams) => {
      const previousValues = decodeFields(schema, searchParams)
      const nextPatch =
        typeof patch === 'function' ? patch(previousValues) : patch

      return encodeFields(schema, nextPatch, { base: searchParams })
    },
    options,
  })
}, [schema])
```

`setValues` 的引用稳定性与 `schema` 有关。

如果 `schema` 引用稳定，则 `setValues` 引用应保持稳定。

## Hook 不负责的事情

Hook 不负责：

- 合并 patch。
- replay pending journal。
- 判断 location change 来源。
- 决定 entry 是否失效。
- 调度 flush。
- 直接执行 navigate。
- 管理 Provider store。

这些能力分别属于 Store、Runtime 或 Provider。
