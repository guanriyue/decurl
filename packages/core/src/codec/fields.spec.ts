import { describe, expect, expectTypeOf, it } from 'vitest';
import { decodeFields, encodeFields, isFieldValuesEqual } from './fields';
import type {
  FieldCodec,
  InferFieldValues,
  MultiOptionalFieldCodec,
  SingleOptionalFieldCodec,
} from './types';

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

  it('decodes from the first name when multiple names are configured', () => {
    const definition = {
      page: {
        name: ['page_num', 'p'],
        decode: (input) => Number(input),
      },
    } satisfies Record<string, FieldCodec>;

    expect(
      decodeFields(definition, new URLSearchParams('page_num=2&p=1')),
    ).toEqual({
      page: 2,
    });
  });

  it('decodes from a legacy name when the canonical name is missing', () => {
    const definition = {
      page: {
        name: ['page_num', 'p'],
        decode: (input) => Number(input),
      },
    } satisfies Record<string, FieldCodec>;

    expect(decodeFields(definition, new URLSearchParams('p=2'))).toEqual({
      page: 2,
    });
  });

  it('continues to a legacy name when canonical decode fails', () => {
    const definition = {
      page: {
        name: ['page_num', 'p'],
        decode: (input) => (input === 'bad' ? undefined : Number(input)),
      },
    } satisfies Record<string, FieldCodec>;

    expect(
      decodeFields(definition, new URLSearchParams('page_num=bad&p=2')),
    ).toEqual({
      page: 2,
    });
  });

  it('falls back to the record key when field name is an empty array', () => {
    const definition = {
      keyword: {
        name: [],
        decode: (input) => input,
      },
    } satisfies Record<string, FieldCodec>;

    expect(
      decodeFields(definition, new URLSearchParams('keyword=decurl')),
    ).toEqual({
      keyword: 'decurl',
    });
  });
});

describe('encodeFields', () => {
  it('encodes patch values into URLSearchParams', () => {
    const definition = {
      keyword: {
        decode: (input) => input,
      },
      page: {
        decode: (input) => Number(input),
        defaultValue: 1,
      },
    } satisfies Record<string, FieldCodec>;

    const searchParams = encodeFields(definition, {
      keyword: 'decurl',
      page: 2,
    });

    expect(searchParams.toString()).toBe('keyword=decurl&page=2');
  });

  it('starts from base and keeps untouched values', () => {
    const definition = {
      keyword: {
        decode: (input) => input,
      },
      page: {
        decode: (input) => Number(input),
        defaultValue: 1,
      },
    } satisfies Record<string, FieldCodec>;

    const searchParams = encodeFields(
      definition,
      { keyword: 'decurl' },
      { base: 'page=2&sort=desc' },
    );

    expect(searchParams.toString()).toBe('page=2&sort=desc&keyword=decurl');
  });

  it('keeps the canonical key position when updating a single field', () => {
    const definition = {
      page: {
        decode: (input) => Number(input),
      },
    } satisfies Record<string, FieldCodec>;

    const searchParams = encodeFields(
      definition,
      { page: 2 },
      { base: 'page=1&pageSize=10' },
    );

    expect(searchParams.toString()).toBe('page=2&pageSize=10');
  });

  it('ignores keys outside the definition', () => {
    const definition = {
      page: {
        decode: (input) => Number(input),
      },
    } satisfies Record<string, FieldCodec>;

    const searchParams = encodeFields(definition, {
      page: 2,
      sort: 'desc',
    } as never);

    expect(searchParams.toString()).toBe('page=2');
  });

  it('deletes a key when the patch value is nullish', () => {
    const definition = {
      keyword: {
        decode: (input) => input,
      },
      page: {
        decode: (input) => Number(input),
      },
    } satisfies Record<string, FieldCodec>;

    const searchParams = encodeFields(
      definition,
      { keyword: null },
      { base: 'keyword=decurl&page=2' },
    );

    expect(searchParams.toString()).toBe('page=2');
  });

  it('deletes a key when encodeFieldValue returns undefined', () => {
    const definition = {
      page: {
        decode: (input) => Number(input),
        encode: () => undefined,
      },
    } satisfies Record<string, FieldCodec>;

    const searchParams = encodeFields(
      definition,
      { page: 2 },
      { base: 'page=1&keyword=decurl' },
    );

    expect(searchParams.toString()).toBe('keyword=decurl');
  });

  it('appends multi values in order after deleting previous values', () => {
    const definition = {
      tags: {
        mode: 'multi',
        decode: (input) => input,
      } satisfies MultiOptionalFieldCodec<string[]>,
    };

    const searchParams = encodeFields(
      definition,
      { tags: ['a', 'b'] },
      { base: 'tags=old&tags=older&page=1' },
    );

    expect(searchParams.toString()).toBe('page=1&tags=a&tags=b');
  });

  it('uses field name as the search params key', () => {
    const definition = {
      keyword: {
        name: 'q',
        decode: (input) => input,
      },
    } satisfies Record<string, FieldCodec>;

    const searchParams = encodeFields(
      definition,
      { keyword: 'decurl' },
      { base: 'keyword=ignored&q=old' },
    );

    expect(searchParams.toString()).toBe('keyword=ignored&q=decurl');
  });

  it('deletes aliases and writes the canonical name when encoding aliases', () => {
    const definition = {
      page: {
        name: ['page_num', 'p'],
        decode: (input) => Number(input),
      },
    } satisfies Record<string, FieldCodec>;

    const searchParams = encodeFields(
      definition,
      { page: 3 },
      { base: 'page_num=1&p=2&sort=desc' },
    );

    expect(searchParams.toString()).toBe('page_num=3&sort=desc');
  });

  it('keeps aliases in base when the field is omitted from the patch', () => {
    const definition = {
      page: {
        name: ['page_num', 'p'],
        decode: (input) => Number(input),
      },
    } satisfies Record<string, FieldCodec>;

    const searchParams = encodeFields(
      definition,
      {},
      { base: 'page_num=1&p=2&sort=desc' },
    );

    expect(searchParams.toString()).toBe('page_num=1&p=2&sort=desc');
  });

  it('deletes all aliases when the patch value is nullish', () => {
    const definition = {
      page: {
        name: ['page_num', 'p'],
        decode: (input) => Number(input),
      },
    } satisfies Record<string, FieldCodec>;

    const searchParams = encodeFields(
      definition,
      { page: null },
      { base: 'page_num=1&p=2&sort=desc' },
    );

    expect(searchParams.toString()).toBe('sort=desc');
  });

  it('deletes all aliases when default cleanup applies', () => {
    const definition = {
      page: {
        name: ['page_num', 'p'],
        decode: (input) => Number(input),
        defaultValue: 1,
      },
    } satisfies Record<string, FieldCodec>;

    const searchParams = encodeFields(
      definition,
      { page: 1 },
      { base: 'page_num=2&p=3&sort=desc' },
    );

    expect(searchParams.toString()).toBe('sort=desc');
  });

  it('deletes all aliases when custom encode returns undefined', () => {
    const definition = {
      page: {
        name: ['page_num', 'p'],
        decode: (input) => Number(input),
        encode: () => undefined,
      },
    } satisfies Record<string, FieldCodec>;

    const searchParams = encodeFields(
      definition,
      { page: 2 },
      { base: 'page_num=1&p=2&sort=desc' },
    );

    expect(searchParams.toString()).toBe('sort=desc');
  });

  it('falls back to the record key when encoding an empty name array', () => {
    const definition = {
      keyword: {
        name: [],
        decode: (input) => input,
      },
    } satisfies Record<string, FieldCodec>;

    const searchParams = encodeFields(definition, {
      keyword: 'decurl',
    });

    expect(searchParams.toString()).toBe('keyword=decurl');
  });

  it('deletes default values unless preserveDefault is true', () => {
    const definition = {
      page: {
        decode: (input) => Number(input),
        defaultValue: 1,
      },
    } satisfies Record<string, FieldCodec>;

    expect(
      encodeFields(definition, { page: 1 }, { base: 'page=2' }).toString(),
    ).toBe('');

    expect(
      encodeFields(
        definition,
        { page: 1 },
        {
          base: 'page=2',
          preserveDefault: true,
        },
      ).toString(),
    ).toBe('page=1');
  });

  it('does not delete default values that are omitted from the patch', () => {
    const definition = {
      page: {
        decode: (input) => Number(input),
        defaultValue: 1,
      },
    } satisfies Record<string, FieldCodec>;

    const searchParams = encodeFields(definition, {}, { base: 'page=1' });

    expect(searchParams.toString()).toBe('page=1');
  });

  it('uses field equality when checking default values', () => {
    const definition = {
      filter: {
        decode: (input) => ({ value: input }),
        encode: (value) => value.value,
        defaultValue: { value: 'all' },
        eq: (left, right) => left.value === right.value,
      },
    } satisfies Record<string, FieldCodec>;

    const searchParams = encodeFields(
      definition,
      { filter: { value: 'all' } },
      { base: 'filter=active' },
    );

    expect(searchParams.toString()).toBe('');
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
