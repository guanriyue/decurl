import type {
  EncodeFieldsValues,
  InferFieldValues,
  RecordCodec,
} from '@decurl/core/codec';
import type { generatePath, PathParam } from 'react-router';

declare const routeSpecTypes: unique symbol;

type Simplify<T> = { [TKey in keyof T]: T[TKey] } & {};

type RequiredKeys<T> = {
  [TKey in keyof T]-?: Record<never, never> extends Pick<T, TKey>
    ? never
    : TKey;
}[keyof T];

type RouteSpecSearch = RecordCodec | undefined;

type ReactRouterPathParams<TPath extends RouteSpecPath> = NonNullable<
  Parameters<typeof generatePath<TPath>>[1]
>;

type OptionalRouteSpecPathParamNames<TPath extends RouteSpecPath> = {
  [TName in PathParam<TPath>]: undefined extends ReactRouterPathParams<TPath>[TName]
    ? TName
    : never;
}[PathParam<TPath>];

type RequiredRouteSpecPathParamNames<TPath extends RouteSpecPath> = Exclude<
  PathParam<TPath>,
  OptionalRouteSpecPathParamNames<TPath>
>;

type RouteSpecCallArguments<TInput> = [TInput] extends [never]
  ? [input: never]
  : [keyof TInput] extends [never]
    ? []
    : [RequiredKeys<TInput>] extends [never]
      ? [input?: TInput]
      : [input: TInput];

type RouteSpecParamsPart<TParams> = [RequiredKeys<TParams>] extends [never]
  ? { params?: TParams }
  : { params: TParams };

type RouteSpecSearchPart<TSearch extends RouteSpecSearch> = [
  keyof RouteSpecSearchInput<TSearch>,
] extends [never]
  ? { search?: never }
  : { search?: RouteSpecSearchInput<TSearch> };

type RouteSpecAssociatedTypes<
  TPath extends RouteSpecPath,
  TParams extends Record<string, unknown>,
  TSearch extends RouteSpecSearch,
  TState,
> = {
  path: TPath;
  params: TParams;
  search: TSearch;
  searchInput: RouteSpecSearchInput<TSearch>;
  searchValues: RouteSpecSearchValues<TSearch>;
  state: TState;
};

type RouteSpecAssociatedTypesOf<TSpec> = TSpec extends {
  readonly [routeSpecTypes]?: infer TTypes;
}
  ? NonNullable<TTypes>
  : never;

/** routeSpec 接受的绝对 React Router path pattern。 */
export type RouteSpecPath = `/${string}`;

/**
 * 从 React Router path pattern 推导生成 pathname 所需的参数。
 *
 * @example
 * ```ts
 * type Params = RouteSpecPathParams<'/users/:id'>
 * // { id: string | number | boolean }
 *
 * type OptionalParams = RouteSpecPathParams<'/:lang?/categories'>
 * // { lang?: string | number | boolean | null | undefined }
 * ```
 */
export type RouteSpecPathParams<TPath extends RouteSpecPath> = Simplify<
  {
    [TName in RequiredRouteSpecPathParamNames<TPath>]:
      | string
      | number
      | boolean;
  } & {
    [TName in OptionalRouteSpecPathParamNames<TPath>]?:
      | string
      | number
      | boolean
      | null
      | undefined;
  }
>;

/**
 * search definition 接受的编码输入。所有字段均可按需传入。
 *
 * @example
 * ```ts
 * type SearchInput = RouteSpecSearchInput<typeof userSearch>
 *
 * const input: SearchInput = {
 *   keyword: 'decurl',
 * }
 * ```
 */
export type RouteSpecSearchInput<TSearch extends RouteSpecSearch> =
  TSearch extends RecordCodec
    ? EncodeFieldsValues<TSearch>
    : Record<never, never>;

/**
 * search definition 解码后得到的业务值。
 *
 * @example
 * ```ts
 * type SearchValues = RouteSpecSearchValues<typeof userSearch>
 *
 * const values: SearchValues = {
 *   keyword: 'decurl',
 *   page: 1,
 * }
 * ```
 */
export type RouteSpecSearchValues<TSearch extends RouteSpecSearch> =
  TSearch extends RecordCodec
    ? InferFieldValues<TSearch>
    : Record<never, never>;

/**
 * routeSpec 可调用函数接受的扁平输入。
 *
 * 当 path params 和 search params 存在同名字段时结果为 `never`，调用方应改用
 * `hrefByParts` 明确区分两部分输入。
 *
 * @example
 * ```ts
 * type Input = RouteSpecFlatInput<
 *   { id: string },
 *   typeof userSearch
 * >
 *
 * const input: Input = {
 *   id: 'u_1',
 *   tab: 'profile',
 * }
 * ```
 */
export type RouteSpecFlatInput<
  TParams extends Record<string, unknown>,
  TSearch extends RouteSpecSearch,
> = [Extract<keyof TParams, keyof RouteSpecSearchInput<TSearch>>] extends [
  never,
]
  ? Simplify<TParams & RouteSpecSearchInput<TSearch>>
  : never;

/**
 * `hrefByParts` 接受的分组输入。
 *
 * @example
 * ```ts
 * type Parts = RouteSpecPartsInput<
 *   { id: string },
 *   typeof userSearch
 * >
 *
 * const parts: Parts = {
 *   params: { id: 'u_1' },
 *   search: { tab: 'profile' },
 * }
 * ```
 */
export type RouteSpecPartsInput<
  TParams extends Record<string, unknown>,
  TSearch extends RouteSpecSearch,
> = Simplify<RouteSpecParamsPart<TParams> & RouteSpecSearchPart<TSearch>>;

/**
 * 一个可调用的路由规格。
 *
 * 直接调用时使用扁平输入生成 href；path/search 同名时使用 `hrefByParts`。
 *
 * @example
 * ```ts
 * declare const userDetail: RouteSpec<
 *   '/users/:id',
 *   { id: string },
 *   typeof userSearch
 * >
 *
 * userDetail({
 *   id: 'u_1',
 *   tab: 'profile',
 * })
 *
 * userDetail.hrefByParts({
 *   params: { id: 'u_1' },
 *   search: { tab: 'profile' },
 * })
 * ```
 */
export interface RouteSpec<
  TPath extends RouteSpecPath,
  TParams extends Record<string, unknown> = RouteSpecPathParams<TPath>,
  TSearch extends RouteSpecSearch = undefined,
  TState = never,
> {
  (
    ...args: RouteSpecCallArguments<RouteSpecFlatInput<TParams, TSearch>>
  ): string;

  /** React Router path pattern。 */
  readonly path: TPath;

  /** 用于处理 search params 的字段定义。 */
  readonly search: TSearch;

  /** 分别传入 path params 和 search params，并生成 href。 */
  hrefByParts(input: RouteSpecPartsInput<TParams, TSearch>): string;

  readonly [routeSpecTypes]?: RouteSpecAssociatedTypes<
    TPath,
    TParams,
    TSearch,
    TState
  >;
}

/**
 * 提取 RouteSpec 的 path pattern 类型。
 *
 * @example
 * ```ts
 * const userDetail = routeSpec({
 *   path: '/users/:id',
 * })
 *
 * type UserDetailPath = InferRouteSpecPath<typeof userDetail>
 * // '/users/:id'
 * ```
 */
export type InferRouteSpecPath<TSpec> =
  RouteSpecAssociatedTypesOf<TSpec> extends {
    path: infer TPath;
  }
    ? TPath
    : never;

/**
 * 提取 RouteSpec 生成 pathname 时接受的 path params 类型。
 *
 * 该类型会保留 RouteSpec 对 path params 的显式类型约束，适合用于封装导航函数、
 * 预加载函数或其他需要单独接收 path params 的模块边界。
 *
 * @example
 * ```ts
 * const userDetail = routeSpec({
 *   path: '/users/:id',
 * })
 *
 * type UserDetailParams = InferRouteSpecParams<typeof userDetail>
 *
 * function preloadUser(params: UserDetailParams) {
 *   return queryClient.prefetchQuery({
 *     queryKey: ['user', params.id],
 *   })
 * }
 * ```
 */
export type InferRouteSpecParams<TSpec> =
  RouteSpecAssociatedTypesOf<TSpec> extends { params: infer TParams }
    ? TParams
    : never;

/**
 * 提取 RouteSpec 持有的 search definition 类型。
 *
 * 该类型表示原始 codec definition，不是 href 输入或 URL 解码结果。
 *
 * @example
 * ```ts
 * const orders = routeSpec({
 *   path: '/orders',
 *   search: ordersSearch,
 * })
 *
 * type OrdersSearchDefinition = InferRouteSpecSearch<typeof orders>
 * // typeof ordersSearch
 * ```
 */
export type InferRouteSpecSearch<TSpec> =
  RouteSpecAssociatedTypesOf<TSpec> extends { search: infer TSearch }
    ? TSearch
    : never;

/**
 * 提取 RouteSpec 生成 href 时接受的 search 输入类型。
 *
 * 这是从业务值写入 URL 的输入类型。字段可以按需传入，并允许使用 `null` 或
 * `undefined` 表示不写入或移除对应的 search param。它适合用于搜索表单、导航
 * 函数和 `hrefByParts` 的 search 参数。
 *
 * 它不同于 {@link InferRouteSpecSearchValues}：后者表示从 URL 解码后得到的完整
 * 页面状态，而不是生成 URL 时接受的 partial 输入。
 *
 * @example
 * ```ts
 * const orders = routeSpec({
 *   path: '/orders',
 *   search: ordersSearch,
 * })
 *
 * type OrdersSearchInput = InferRouteSpecSearchInput<typeof orders>
 *
 * function openOrders(search: OrdersSearchInput) {
 *   navigate(orders(search))
 * }
 *
 * openOrders({
 *   keyword: 'decurl',
 *   page: 2,
 * })
 * ```
 */
export type InferRouteSpecSearchInput<TSpec> =
  RouteSpecAssociatedTypesOf<TSpec> extends { searchInput: infer TInput }
    ? TInput
    : never;

/**
 * 提取 RouteSpec 从 URL 解码 search params 后得到的业务值类型。
 *
 * 这是从 URL 读取数据的结果类型。它会反映 codec 的 optional 和 defaultValue
 * 语义：可选字段可能是 `undefined`，具有默认值的字段则是必需值。它适合用于
 * 页面状态、组件 props，以及消费 `useSearchValues` 解码结果的业务函数。
 *
 * 它不同于 {@link InferRouteSpecSearchInput}：后者是生成 URL 时接受的 partial
 * 输入，因此字段可选并可能接受 nullish 值。
 *
 * @example
 * ```tsx
 * const orders = routeSpec({
 *   path: '/orders',
 *   search: ordersSearch,
 * })
 *
 * type OrdersSearchValues = InferRouteSpecSearchValues<typeof orders>
 *
 * type OrdersTableProps = {
 *   search: OrdersSearchValues
 * }
 *
 * function OrdersPage() {
 *   const [search] = useSearchValues(orders.search)
 *
 *   return <OrdersTable search={search} />
 * }
 * ```
 */
export type InferRouteSpecSearchValues<TSpec> =
  RouteSpecAssociatedTypesOf<TSpec> extends { searchValues: infer TValues }
    ? TValues
    : never;

/**
 * 提取 RouteSpec 的 navigation state 类型。
 *
 * @example
 * ```ts
 * type UserDetailSpec = RouteSpec<
 *   '/users/:id',
 *   { id: string },
 *   undefined,
 *   { from: 'users' | 'orders' }
 * >
 *
 * type UserDetailState = InferRouteSpecState<UserDetailSpec>
 * // { from: 'users' | 'orders' }
 * ```
 */
export type InferRouteSpecState<TSpec> =
  RouteSpecAssociatedTypesOf<TSpec> extends { state: infer TState }
    ? TState
    : never;
