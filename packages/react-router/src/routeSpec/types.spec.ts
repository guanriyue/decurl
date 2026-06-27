import { describe, expectTypeOf, it } from 'vitest';
import type { SingleOptionalFieldCodec, SingleRequiredFieldCodec } from '../codec';
import type {
  InferRouteSpecParams,
  InferRouteSpecPath,
  InferRouteSpecSearchInput,
  InferRouteSpecSearchValues,
  InferRouteSpecState,
  RouteSpec,
  RouteSpecFlatInput,
  RouteSpecPartsInput,
  RouteSpecPathParams,
} from './types';

type Search = {
  page: SingleRequiredFieldCodec<number>;
  query: SingleOptionalFieldCodec<string>;
};

type UserDetailSpec = RouteSpec<'/users/:id', { id: string }, Search, { from: string }>;

describe('RouteSpec types', () => {
  it('infers path params and callable arguments', () => {
    expectTypeOf<RouteSpecPathParams<'/orgs/:orgId/users/:userId'>>().toEqualTypeOf<{
      orgId: string | number | boolean;
      userId: string | number | boolean;
    }>();
    expectTypeOf<RouteSpecPathParams<'/:lang?/categories'>>().toEqualTypeOf<{
      lang?: string | number | boolean | null | undefined;
    }>();

    expectTypeOf<Parameters<RouteSpec<'/users'>>>().toEqualTypeOf<[]>();
    expectTypeOf<Parameters<RouteSpec<'/:lang?/categories'>>>().toEqualTypeOf<
      [input?: { lang?: string | number | boolean | null | undefined }]
    >();
    expectTypeOf<Parameters<UserDetailSpec>>().toEqualTypeOf<
      [
        input: {
          id: string;
          page?: number | null | undefined;
          query?: string | null | undefined;
        },
      ]
    >();
  });

  it('allows an omitted input when only search values are present', () => {
    expectTypeOf<Parameters<RouteSpec<'/users', Record<never, never>, Search>>>().toEqualTypeOf<
      [
        input?: {
          page?: number | null | undefined;
          query?: string | null | undefined;
        },
      ]
    >();
  });

  it('disables flat input when path and search keys conflict', () => {
    type ConflictingSearch = {
      id: SingleOptionalFieldCodec<string>;
    };

    expectTypeOf<RouteSpecFlatInput<{ id: string }, ConflictingSearch>>().toEqualTypeOf<never>();
    expectTypeOf<
      Parameters<RouteSpec<'/users/:id', { id: string }, ConflictingSearch>>
    >().toEqualTypeOf<[input: never]>();
  });

  it('keeps path and search separate in hrefByParts', () => {
    expectTypeOf<RouteSpecPartsInput<{ id: string }, Search>>().toEqualTypeOf<{
      params: { id: string };
      search?: {
        page?: number | null | undefined;
        query?: string | null | undefined;
      };
    }>();
  });

  it('exposes associated type helpers', () => {
    expectTypeOf<InferRouteSpecPath<UserDetailSpec>>().toEqualTypeOf<'/users/:id'>();
    expectTypeOf<InferRouteSpecParams<UserDetailSpec>>().toEqualTypeOf<{
      id: string;
    }>();
    expectTypeOf<InferRouteSpecSearchInput<UserDetailSpec>>().toEqualTypeOf<{
      page?: number | null | undefined;
      query?: string | null | undefined;
    }>();
    expectTypeOf<InferRouteSpecSearchValues<UserDetailSpec>>().toEqualTypeOf<{
      page: number;
      query: string | undefined;
    }>();
    expectTypeOf<InferRouteSpecState<UserDetailSpec>>().toEqualTypeOf<{
      from: string;
    }>();
  });
});
