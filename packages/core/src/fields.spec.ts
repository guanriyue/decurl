import { describe, expect, expectTypeOf, it } from 'vitest';
import type { FieldCodec, InferFieldValues } from './codec';
import { decodeFields } from './fields';

describe('decodeFields', () => {
  it('decodes field values from a record codec', () => {
    const definition = {
      keyword: {
        decode: (input) => input,
      },
      page: {
        decode: (input) => Number(input),
        defaultValue: 1,
      },
      tags: {
        mode: 'multi',
        decode: (input) => input,
      },
    } satisfies Record<string, FieldCodec>;

    const values = decodeFields(
      definition,
      new URLSearchParams('keyword=decurl&page=2&tags=a&tags=b'),
    );

    expect(values).toEqual({
      keyword: 'decurl',
      page: 2,
      tags: ['a', 'b'],
    });
    expectTypeOf(values).toEqualTypeOf<InferFieldValues<typeof definition>>();
  });

  it('uses defaultValue for missing required fields', () => {
    const definition = {
      page: {
        decode: (input) => Number(input),
        defaultValue: 1,
      },
    } satisfies Record<string, FieldCodec>;

    expect(decodeFields(definition, new URLSearchParams())).toEqual({
      page: 1,
    });
  });

  it('lets field name override the record key', () => {
    const definition = {
      keyword: {
        name: 'q',
        decode: (input) => input,
      },
    } satisfies Record<string, FieldCodec>;

    expect(decodeFields(definition, new URLSearchParams('q=decurl'))).toEqual({
      keyword: 'decurl',
    });
  });
});
