---
description: Decurl 专注 URLSearchParams 的解析与序列化规则，和 validation、router state 等方案关注的问题不同。
---

# 边界与对比

Decurl 不是通用 validation 库，也不是完整复刻某个 URL state 库。

它的定位更窄：为 `URLSearchParams` 提供一套显式的解析与序列化规则，以及执行这些规则的工具。

## 解析与序列化

URL Search Params 本质上是一段字符串数据。我们对它做的一切，都是在做解析和序列化。

类似的事情在很多场景都会发生：

- TypeScript 源码本质是文本，会被 TypeScript Compiler 解析成 AST；AST 也可以再被打印成文本。
- JavaScript value 可以序列化为 JSON 字符串，也可以从 JSON 字符串解析回 JavaScript value。
- `YYYY-MM-DD` 字符串可以解析成 `Date` 对象，`Date` 对象也可以序列化成适合传输的字符串。
- `location.search` 是 string，可以被解析成 `URLSearchParams` 实例；`URLSearchParams` 也可以重新序列化成 search string。

Decurl 针对 URL Search Params 做的是同一类事情：

- `decode`：把 `string`、`string[]` 或缺失值解析成业务值。
- `encode`：把业务值序列化回 URLSearchParams。

Search Fields 是这套规则的静态定义；URLSearchParams codec 是这套规则的执行器。

## 和 validation 库的边界

zod、valibot 这类库擅长描述通用数据结构：

- 对象校验。
- 错误信息。
- schema introspection。
- 服务端和客户端共享数据约束。

Decurl 关注的是另一层问题：

- URL key 如何映射到业务字段。
- single field 和 multi field 如何读取。
- legacy alias 如何兼容。
- patch encode 如何保留未触碰参数。
- default value 什么时候写入或删除。

你可以在 Decurl 的 decode step 中调用 validation 库，但 Decurl 本身不试图替代它们。

## Decode 不应该默认抛异常

URL Search Params 是用户可编辑、可分享、可遗留的字符串输入。Decode 遇到预期外字符串时，默认不应该把抛异常作为控制流，而应该返回 `null` 或 `undefined`，再交给 `defaultValue` 或页面 guard 处理。

分页参数是典型例子：

```tsx
const [pagination, setPagination] = useSearchValues(
  pick(searchFields, ['page', 'pageSize']),
);
```

如果 URL 中出现 `page=abc.123`，页面通常不应该进入 ErrorBoundary。分页参数大多只是辅助状态，decode 失败后回退到默认页码，会比抛异常更符合用户预期。

核心参数则需要另一种处理方式：

```tsx
const [id, setId] = useSearchValue(searchFields.id);
```

如果 `id` 是页面展示的核心参数，而 URL 中出现 `id=abc.12343`，页面确实可能无法正常展示。但这也不一定要通过 decode 抛异常来交给 ErrorBoundary。

更推荐在页面中显式 guard：

```tsx
const PageView = () => {
  const [id] = useSearchValue(searchFields.id);

  if (!id) {
    return <ErrorPage description="缺少有效的资源 id" />;
  }

  return <Detail id={id} />;
};
```

这种方式更容易为不同页面定制错误说明、返回按钮、刷新按钮或其他辅助操作。

这也是 Decurl 和 validation 库在 URL Search Params 场景中的重要差异：validation 库很适合“校验失败 -> 结构化错误”的表单、API payload 或服务端契约；而 URL Search Params 更常见的是“无效值当作缺失值”、“缺失值走默认值”、“核心参数缺失由页面 guard 展示专门 UI”。

当然，预期之外的异常仍然可能发生，例如开发者自己的 decode 函数有 bug，或调用了会 throw 的第三方 parser。Decurl 的理念不是“永远不可能 throw”，而是“URL 值不符合预期时，不应该默认用 throw 表达”。

## Decode 保持同步

Decurl 的 URLSearchParams codec 目前不支持异步 decode。这也是有意的边界。

URL Search Params 中更适合存放核心基础参数，而不是异步派生结果。例如页面可能只把 `id` 放在 URL 中：

```tsx
const [id, setId] = useSearchValue(searchFields.id);
```

而真正的业务实体可能包含更多字段：

```ts
type Instance = {
  id: number;
  startTime: number;
  endTime: number;
};
```

如果页面只需要实体中的时间范围，看起来可以把异步请求放进 decode pipeline：

```ts
const decode = pipe(
  trim,
  shape.integer,
  toNumber,
  async (id) => fetchTimeRange(id),
);
```

Decurl 不支持这种写法。异步解析通常会引入状态管理问题：loading 如何展示，error 如何处理，同一个 key 在页面多处使用时如何复用请求结果，以及它是否会和系统里已有的 swr、react-query 等数据请求模块重复。

更推荐把 URL 参数 decode 成基础值，再把异步数据交给专门的请求或缓存模块：

```tsx
const PageView = () => {
  const [id] = useSearchValue(searchFields.id);

  const {
    data: instance,
    isLoading: instanceLoading,
    error: instanceError,
    refetch: refetchInstance,
  } = useQuery({
    queryKey: ['instance', id],
    queryFn: () => fetchInstance(id),
    enabled: Boolean(id),
  });

  if (instanceLoading) {
    return <LoadingPage />;
  }

  if (instanceError) {
    return (
      <ErrorPage error={instanceError} refetch={refetchInstance} />
    );
  }

  return (
    <TimeRangeView
      startTime={instance.startTime}
      endTime={instance.endTime}
    />
  );
};
```

字符串的解析和序列化天然是同步流程。把异步请求放进 decode 会让模块边界变得模糊，也会让 loading、error、缓存和重试等 UI 状态难以统一管理。异步状态更适合交给专门的模块处理。

## 和 URL state 库的边界

URL state 库通常会提供更高层的 hook、parser 和 router adapter。

Decurl 更强调 URL codec 与 router hook 的边界：

- `@decurl/react-router/codec` 负责 Search Fields 语义。
- `@decurl/react-router/decode` 负责原始字符串的显式解析。
- `@decurl/react-router/configured` 负责 React Router runtime 和 hooks。
- decode pipeline 保持显式组合，方便 review 和测试。
- alias、default、patch encode 是 URLSearchParams 层的一等语义。

Search Fields、decode pipeline 和 URLSearchParams codec 可以独立于 hooks 使用。Router 集成只是消费同一套规则的上层能力。

## 为什么 decode first

写入 URL 往往不难：

```ts
searchParams.set('page', String(page));
```

真正困难的是读取：

```ts
const page = Number(searchParams.get('page'));
```

这段代码没有说明：

- 空字符串是否有效。
- `1e3` 是否有效。
- `0` 是否有效。
- 参数缺失时默认值是什么。
- 旧 key 是否还需要兼容。

Decurl 把这些规则前置到 Search Fields 中，让 URL 进入业务层之前就被显式处理。

## Decurl 不接管什么

Decurl 不尝试接管所有数据规则。它不负责：

- 完整 validation DSL。
- 表单错误树和字段级错误展示。
- 路由匹配和页面生命周期。
- 把所有业务状态都放进 URL。
- 把 URL 当成数据库或全局 store。
- 鼓励把复杂对象都塞进 search params。

如果状态不需要分享、刷新保留或浏览器历史记录，它未必适合进入 URL。Decurl 只希望让那些确实属于 URL Search Params 的状态，有明确、可推导、可复用的解析与序列化规则。
