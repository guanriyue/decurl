import type { FieldCodec } from '@decurl/core/codec';
import { decodeFields, encodeFields } from '@decurl/core/codec';
import { describe, expect, it } from 'vitest';
import type { SearchLocation } from '../runtime/types';
import { replay } from './replay';
import type { PendingEntry, SearchPatch } from './types';

describe('replay', () => {
  const base: SearchLocation = {
    pathname: '/users',
    search: 'page=1&pageSize=20',
  };

  it('applies partial patches on top of the current search', () => {
    const schema = {
      keyword: {
        name: 'q',
        decode: (input) => input,
      },
      page: {
        decode: (input) => Number(input),
        defaultValue: 1,
      },
    } satisfies Record<string, FieldCodec>;

    const result = replay(base, [
      createEntry(schema, { keyword: 'decurl' }),
      createEntry(schema, { page: 2 }),
    ]);

    expect(result).toEqual({
      pathname: '/users',
      search: 'page=2&pageSize=20&q=decurl',
    });
  });

  it('evaluates updater patches against intermediate decoded values', () => {
    const schema = {
      page: {
        decode: (input) => Number(input),
        defaultValue: 1,
      },
    } satisfies Record<string, FieldCodec>;

    const result = replay(base, [
      createEntry(schema, (previousValues) => ({
        page: previousValues.page + 1,
      })),
      createEntry(schema, (previousValues) => ({
        page: previousValues.page + 1,
      })),
    ]);

    expect(result.search).toBe('page=3&pageSize=20');
  });

  it('lets later entries keep fields they do not patch', () => {
    const paginationSchema = {
      page: {
        decode: (input) => Number(input),
        defaultValue: 1,
      },
    } satisfies Record<string, FieldCodec>;
    const filterSchema = {
      keyword: {
        name: 'q',
        decode: (input) => input,
      },
    } satisfies Record<string, FieldCodec>;

    const result = replay(base, [
      createEntry(paginationSchema, { page: 2 }),
      createEntry(filterSchema, { keyword: 'decurl' }),
    ]);

    expect(result.search).toBe('page=2&pageSize=20&q=decurl');
  });

  it('applies multi field patches with core codec semantics', () => {
    const schema = {
      tags: {
        mode: 'multi',
        decode: (input) => input,
      },
    } satisfies Record<string, FieldCodec>;

    const result = replay(
      {
        pathname: '/users',
        search: 'tags=old&page=1',
      },
      [createEntry(schema, { tags: ['a', 'b'] })],
    );

    expect(result.search).toBe('page=1&tags=a&tags=b');
  });
});

const createEntry = <TDefinition extends Record<string, FieldCodec>>(
  schema: TDefinition,
  patch: SearchPatch<TDefinition>,
): PendingEntry => {
  return {
    id: 1,
    baseLocation: {
      pathname: '/users',
      search: 'page=1&pageSize=20',
    },
    apply: (searchParams) => {
      const previousValues = decodeFields(schema, searchParams);
      const nextPatch =
        typeof patch === 'function' ? patch(previousValues) : patch;

      return encodeFields(schema, nextPatch, { base: searchParams });
    },
  };
};
