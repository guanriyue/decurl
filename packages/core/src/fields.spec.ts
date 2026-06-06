import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  FieldCodec,
  InferFieldValues,
  SingleOptionalFieldCodec,
} from './codec';
import { decodeFields, isFieldValuesEqual } from './fields';

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

describe('isFieldValuesEqual', () => {
  it('returns true for the same record reference', () => {
    const definition = {
      page: {
        decode: (input) => Number(input),
        defaultValue: 1,
      },
    } satisfies Record<string, FieldCodec>;
    const values = { page: 1 };

    expect(isFieldValuesEqual(definition, values, values)).toBe(true);
  });

  it('returns true when every field value is equal', () => {
    const definition = {
      page: {
        decode: (input) => Number(input),
        defaultValue: 1,
      },
      tags: {
        mode: 'multi',
        decode: (input) => input,
      },
    } satisfies Record<string, FieldCodec>;

    expect(
      isFieldValuesEqual(
        definition,
        { page: 1, tags: ['a', 'b'] },
        { page: 1, tags: ['a', 'b'] },
      ),
    ).toBe(true);
  });

  it('returns false when any field value is different', () => {
    const definition = {
      page: {
        decode: (input) => Number(input),
        defaultValue: 1,
      },
      tags: {
        mode: 'multi',
        decode: (input) => input,
      },
    } satisfies Record<string, FieldCodec>;

    expect(
      isFieldValuesEqual(
        definition,
        { page: 2, tags: ['a', 'b'] },
        { page: 1, tags: ['a', 'b'] },
      ),
    ).toBe(false);
  });

  it('uses field-level custom equality', () => {
    const definition = {
      filter: {
        decode: (input) => ({ value: input }),
        eq: (left, right) => left.value === right.value,
      } satisfies SingleOptionalFieldCodec<{ value: string }>,
    };

    expect(
      isFieldValuesEqual(
        definition,
        { filter: { value: 'decurl' } },
        { filter: { value: 'decurl' } },
      ),
    ).toBe(true);
  });
});
