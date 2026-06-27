---
description: Decurl centers on URLSearchParams parsing and serialization, with clear boundaries around fields, decode failure, synchronous execution, and responsibility.
---

# Design Boundaries

Decurl has a narrow position: provide explicit parsing and serialization rules for `URLSearchParams`, plus tools that execute those rules.

## Parsing and Serialization

URL search params are fundamentally string data. Everything we do with them is parsing and serialization.

Similar things happen in many contexts:

- TypeScript source code is text. The TypeScript Compiler parses it into AST, and the AST can be printed back into text.
- A JavaScript value can be serialized into a JSON string, and parsed back from a JSON string into a JavaScript value.
- A `YYYY-MM-DD` string can be parsed into a `Date` object, and a `Date` object can be serialized into a string suitable for transmission.
- `location.search` is a string that can be parsed into a `URLSearchParams` instance; `URLSearchParams` can also be serialized back into a search string.

Decurl does the same kind of work for URL search params:

- `decode`: parse `string`, `string[]`, or missing values into business values.
- `encode`: serialize business values back into URLSearchParams.

Search Fields are the static definition of these rules. URLSearchParams codecs are the executors of these rules.

## Cross-field Invariants

FieldCodec is designed around one logical field. Search Fields can compose multiple FieldCodecs, but each field still decodes only from its own raw input.

One logical field does not always mean one raw value. For example:

```txt
?time=start&time=end
```

Both values belong to the same URL key. A `multi` FieldCodec receives the complete `string[]` at once, so it can sort, filter, or check whether two values form a valid range inside its own decode. Legacy aliases are also candidate keys for the same logical field, not cross-field relationships.

This form is different:

```txt
?startTime=...&endTime=...
```

`startTime` and `endTime` are two independent fields. They can each parse strings independently, but "startTime must be less than endTime" is only meaningful after the two fields are combined. This is a cross-field invariant. FieldCodec cannot and should not handle it alone.

If a FieldCodec could read other fields during decode, field behavior would depend on parsing order and external context. Field reuse, local patching, and type inference would also become less clear. Therefore, Decurl only guarantees field-level parsing and does not provide schema-level cross-field validation or automatic correction.

Handle combined semantics in business code after Search Fields have been decoded:

```tsx
const TimeRangeView = () => {
  const [values] = useSearchValues(searchFields);

  if (values.startTime >= values.endTime) {
    return <InvalidTimeRange />;
  }

  return (
    <Timeline
      startTime={values.startTime}
      endTime={values.endTime}
    />
  );
};
```

The page decides the concrete strategy: show an error, prevent a request, clear a field, or correct the range. Normal interactions should also control value legality before writing. If two fields need to change together, submit them with one `setValues({ startTime, endTime })`, but external URLs still need business-layer checks.

## Decode Should Not Throw by Default

URL search params are user-editable, shareable, and can be old string input. When decode sees an unexpected string, the default control flow should not be throwing an exception. It should return `null` or `undefined`, then let `defaultValue` or page guards handle it.

Pagination params are a typical example:

```tsx
const [pagination, setPagination] = useSearchValues(
  pick(searchFields, ['page', 'pageSize']),
);
```

If the URL contains `page=abc.123`, the page usually should not enter an ErrorBoundary. Pagination params are mostly auxiliary state. Falling back to the default page after decode failure usually matches user expectations better than throwing.

Core params need a different handling style:

```tsx
const [id, setId] = useSearchValue(searchFields.id);
```

If `id` is a core param for rendering the page, and the URL contains `id=abc.12343`, the page may indeed be unable to render normally. But that still does not have to be expressed by throwing inside decode and handing control to ErrorBoundary.

Prefer explicit guards in the page:

```tsx
const PageView = () => {
  const [id] = useSearchValue(searchFields.id);

  if (!id) {
    return <ErrorPage description="Missing a valid resource id" />;
  }

  return <Detail id={id} />;
};
```

This makes it easier to customize error descriptions, back buttons, refresh buttons, or other helper actions for each page.

Validation libraries are a good fit for "validation failed -> structured errors" in forms, API payloads, or server contracts. URL search params more commonly follow "invalid value is treated as missing", "missing value uses default", and "missing core param is handled by a page guard with dedicated UI".

Unexpected exceptions can still happen, such as bugs in a custom decode function or a third-party parser that throws. Decurl's philosophy is not "throw can never happen"; it is "unexpected URL values should not be expressed with throw by default".

## Decode Stays Synchronous

Decurl's URLSearchParams codec currently does not support asynchronous decode. This is an intentional boundary.

URL search params are better suited for core base parameters, not async derived results. For example, a page may only put `id` in the URL:

```tsx
const [id, setId] = useSearchValue(searchFields.id);
```

The actual business entity may contain more fields:

```ts
type Instance = {
  id: number;
  startTime: number;
  endTime: number;
};
```

If the page only needs the entity's time range, it may look tempting to put the async request inside the decode pipeline:

```ts
const decode = pipe(
  trim,
  shape.integer,
  toNumber,
  async (id) => fetchTimeRange(id),
);
```

Decurl does not support this. Async parsing usually introduces state management questions: how to show loading, how to handle errors, how to reuse request results when the same key is used in multiple places on one page, and whether it duplicates existing data request modules such as swr or react-query.

Prefer decoding URL params into base values, then handing async data to dedicated request or cache modules:

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

String parsing and serialization are naturally synchronous. Putting async requests into decode blurs module boundaries and makes UI states such as loading, error, cache, and retry harder to manage consistently. Async state belongs in dedicated modules.

## Why Decode First

Writing to the URL is often not difficult:

```ts
searchParams.set('page', String(page));
```

The hard part is reading:

```ts
const page = Number(searchParams.get('page'));
```

This code does not explain:

- Whether an empty string is valid.
- Whether `1e3` is valid.
- Whether `0` is valid.
- What the default value is when the param is missing.
- Whether old keys still need compatibility.

Decurl moves these rules into Search Fields so the URL is explicitly handled before it enters the business layer.

## What Decurl Does Not Own

Decurl does not try to own every data rule. It is not responsible for:

- A full validation DSL.
- Form error trees and field-level error display.
- Route matching and page lifecycle.
- Putting every business state into the URL.
- Treating the URL as a database or global store.
- Encouraging complex objects to be stuffed into search params.

If state does not need to be shared, survive refresh, or participate in browser history, it may not belong in the URL. Decurl only aims to give states that truly belong to URL search params explicit, inferable, and reusable parsing and serialization rules.
