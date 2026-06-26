import type { FieldCodec } from '@decurl/core/codec';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { routeSpec } from './routeSpec';

describe('routeSpec', () => {
  it('creates a callable href builder with route metadata', () => {
    const users = routeSpec({ path: '/users' });

    expect(users()).toBe('/users');
    expect(users.path).toBe('/users');
    expect(users.search).toBeUndefined();
    expectTypeOf(users.path).toEqualTypeOf<'/users'>();
  });

  it('generates and encodes path params through React Router', () => {
    const userDetail = routeSpec({ path: '/users/:id/active/:active' });

    expect(userDetail({ id: 'u/1', active: true })).toBe('/users/u%2F1/active/true');
  });

  it('supports optional path params and splats', () => {
    const categories = routeSpec({ path: '/:lang?/categories' });
    const files = routeSpec({ path: '/files/*' });

    expect(categories()).toBe('/categories');
    expect(categories({ lang: 'zh' })).toBe('/zh/categories');
    expect(files({ '*': 'docs/getting-started.md' })).toBe('/files/docs/getting-started.md');
  });

  it('encodes search values through the record codec', () => {
    const search = {
      keyword: {
        name: 'q',
        decode: (input) => input,
      },
      page: {
        decode: (input) => Number(input),
        encode: String,
        defaultValue: 1,
      },
    } satisfies Record<string, FieldCodec>;
    const users = routeSpec({ path: '/users', search });

    expect(users({ keyword: 'type safe', page: 2 })).toBe('/users?q=type+safe&page=2');
    expect(users({ page: 1 })).toBe('/users');
    expect(users()).toBe('/users');
  });

  it('keeps conflicting path and search values separate', () => {
    const search = {
      id: {
        decode: (input) => input,
      },
    } satisfies Record<string, FieldCodec>;
    const userDetail = routeSpec({ path: '/users/:id', search });

    expect(
      userDetail.hrefByParts({
        params: { id: 42 },
        search: { id: 'filter-id' },
      }),
    ).toBe('/users/42?id=filter-id');
  });
});
