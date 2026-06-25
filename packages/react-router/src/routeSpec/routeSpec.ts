import { encodeFields, type RecordCodec } from '@decurl/core/codec';
import { generatePath } from 'react-router';
import { isNil } from '../_internal/isNil';
import type { RouteSpec, RouteSpecPath, RouteSpecPathParams } from './types';

/** routeSpec 的定义选项。 */
export type RouteSpecOptions<
  TPath extends RouteSpecPath,
  TSearch extends RecordCodec | undefined = undefined,
> = {
  /** React Router path pattern。 */
  path: TPath;

  /** 用于编码和解码 search params 的字段定义。 */
  search?: TSearch;
};

type RuntimeValues = Record<string, unknown>;

type RuntimeParts = {
  params?: RuntimeValues;
  search?: RuntimeValues;
};

/**
 * 定义一个可调用的路由规格。
 *
 * 调用返回由 path params 和 search params 共同生成的 href，同时保留原始
 * path pattern、search definition 和分组生成 API。
 *
 * @example
 * ```ts
 * const userDetail = routeSpec({
 *   path: '/users/:id',
 *   search: userSearch,
 * })
 *
 * userDetail({ id: 1, tab: 'profile' })
 * userDetail.path
 * ```
 */
export const routeSpec = ((
  options: RouteSpecOptions<RouteSpecPath, RecordCodec | undefined>,
) => {
  const createHref = (params: RuntimeValues, searchValues: RuntimeValues) => {
    const pathname = generatePath(options.path, stringifyPathParams(params));

    if (typeof options.search === 'undefined') {
      return pathname;
    }

    const searchParams = encodeFields(options.search, searchValues);
    const search = searchParams.toString();

    return search.length === 0 ? pathname : `${pathname}?${search}`;
  };

  const href = (input: RuntimeValues = {}) => {
    return createHref(input, input);
  };

  const hrefByParts = ({ params = {}, search = {} }: RuntimeParts) => {
    return createHref(params, search);
  };

  return Object.assign(href, {
    path: options.path,
    search: options.search,
    hrefByParts,
  });
}) as unknown as <
  const TPath extends RouteSpecPath,
  const TSearch extends RecordCodec | undefined = undefined,
>(
  options: RouteSpecOptions<TPath, TSearch>,
) => RouteSpec<TPath, RouteSpecPathParams<TPath>, TSearch>;

const stringifyPathParams = (
  params: RuntimeValues,
): Record<string, string | null | undefined> => {
  return Object.fromEntries(
    Object.entries(params).map(([name, value]) => [
      name,
      isNil(value) ? value : String(value),
    ]),
  );
};
