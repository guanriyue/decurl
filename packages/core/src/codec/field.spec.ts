import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
  decodeField,
  encodeField,
  encodeFieldInternal,
  encodeFieldValue,
  isFieldValueEqual,
} from './field';
import type {
  MultiOptionalFieldCodec,
  MultiRequiredFieldCodec,
  SingleOptionalFieldCodec,
  SingleRequiredFieldCodec,
} from './types';

describe('decodeField', () => {
  it('decodes a single field by explicit key', () => {
    const codec = {
      decode: (input) => input,
    } satisfies SingleOptionalFieldCodec<string>;

    const value = decodeField(
      codec,
      new URLSearchParams('keyword=decurl'),
      'keyword',
    );

    expect(value).toBe('decurl');
    expectTypeOf(value).toEqualTypeOf<string | undefined>();
  });

  it('uses defaultValue without calling single decode when key is missing', () => {
    const decode = vi.fn((input: string) => Number(input));
    const codec = {
      decode,
      defaultValue: 1,
    } satisfies SingleRequiredFieldCodec<number>;

    const value = decodeField(codec, new URLSearchParams(), 'page');

    expect(value).toBe(1);
    expect(decode).not.toHaveBeenCalled();
    expectTypeOf(value).toEqualTypeOf<number>();
  });

  it('returns undefined without calling single decode when optional key is missing', () => {
    const decode = vi.fn((input: string) => Number(input));
    const codec = {
      decode,
    } satisfies SingleOptionalFieldCodec<number>;

    const value = decodeField(codec, new URLSearchParams(), 'page');

    expect(value).toBeUndefined();
    expect(decode).not.toHaveBeenCalled();
    expectTypeOf(value).toEqualTypeOf<number | undefined>();
  });

  it('calls single decode when raw value is an empty string', () => {
    const decode = vi.fn((input: string) => input.length);
    const codec = {
      decode,
      defaultValue: 1,
    } satisfies SingleRequiredFieldCodec<number>;

    const value = decodeField(
      codec,
      new URLSearchParams('keyword='),
      'keyword',
    );

    expect(value).toBe(0);
    expect(decode).toHaveBeenCalledWith('');
  });

  it('falls back to defaultValue when single decode returns nullish value', () => {
    const codec = {
      decode: () => undefined,
      defaultValue: 1,
    } satisfies SingleRequiredFieldCodec<number>;

    expect(decodeField(codec, new URLSearchParams('page=x'), 'page')).toBe(1);
  });

  it('decodes multi fields from all values in order', () => {
    const decode = vi.fn((input: string[]) => input.map(Number));
    const codec = {
      mode: 'multi',
      decode,
    } satisfies MultiOptionalFieldCodec<number[]>;

    const value = decodeField(codec, new URLSearchParams('id=1&id=2'), 'id');

    expect(value).toEqual([1, 2]);
    expect(decode).toHaveBeenCalledWith(['1', '2']);
    expectTypeOf(value).toEqualTypeOf<number[] | undefined>();
  });

  it('returns undefined without calling multi decode when optional key is missing', () => {
    const decode = vi.fn((input: string[]) => input);
    const codec = {
      mode: 'multi',
      decode,
    } satisfies MultiOptionalFieldCodec<string[]>;

    const value = decodeField(codec, new URLSearchParams(), 'tag');

    expect(value).toBeUndefined();
    expect(decode).not.toHaveBeenCalled();
  });

  it('uses defaultValue without calling multi decode when required key is missing', () => {
    const decode = vi.fn((input: string[]) => input);
    const codec = {
      mode: 'multi',
      decode,
      defaultValue: ['default'],
    } satisfies MultiRequiredFieldCodec<string[]>;

    const value = decodeField(codec, new URLSearchParams(), 'tag');

    expect(value).toEqual(['default']);
    expect(decode).not.toHaveBeenCalled();
  });

  it('decodes from a later alias when earlier aliases are missing', () => {
    const codec = {
      decode: (input) => Number(input),
    } satisfies SingleOptionalFieldCodec<number>;

    const value = decodeField(codec, new URLSearchParams('p=2'), [
      'page_num',
      'p',
    ]);

    expect(value).toBe(2);
  });

  it('continues to later aliases when decode returns nullish', () => {
    const decode = vi.fn((input: string) =>
      input === 'bad' ? undefined : Number(input),
    );
    const codec = {
      decode,
    } satisfies SingleOptionalFieldCodec<number>;

    const value = decodeField(codec, new URLSearchParams('page_num=bad&p=2'), [
      'page_num',
      'p',
    ]);

    expect(value).toBe(2);
    expect(decode).toHaveBeenCalledWith('bad');
    expect(decode).toHaveBeenCalledWith('2');
  });
});

describe('encodeFieldValue', () => {
  it('returns undefined for nullish values without calling custom encode', () => {
    const encode = vi.fn((value: number) => String(value));
    const codec = {
      decode: (input) => Number(input),
      encode,
    } satisfies SingleOptionalFieldCodec<number>;

    expect(encodeFieldValue(codec, undefined)).toBeUndefined();
    expect(encodeFieldValue(codec, null)).toBeUndefined();
    expect(encode).not.toHaveBeenCalled();
  });

  it('stringifies single field values by default', () => {
    const codec = {
      decode: (input) => Number(input),
    } satisfies SingleOptionalFieldCodec<number>;

    const value = encodeFieldValue(codec, 12);

    expect(value).toBe('12');
    expectTypeOf(value).toEqualTypeOf<string | undefined>();
  });

  it('uses custom single field encode when provided', () => {
    const codec = {
      decode: (input) => Number(input),
      encode: (value) => `page-${value}`,
    } satisfies SingleOptionalFieldCodec<number>;

    expect(encodeFieldValue(codec, 2)).toBe('page-2');
  });

  it('normalizes custom encode nullish result to undefined', () => {
    const codec = {
      decode: (input) => Number(input),
      encode: () => null,
    } satisfies SingleOptionalFieldCodec<number>;

    expect(encodeFieldValue(codec, 2)).toBeUndefined();
  });

  it('stringifies multi field array values by default', () => {
    const codec = {
      mode: 'multi',
      decode: (input) => input.map(Number),
    } satisfies MultiOptionalFieldCodec<number[]>;

    const value = encodeFieldValue(codec, [1, 2]);

    expect(value).toEqual(['1', '2']);
    expectTypeOf(value).toEqualTypeOf<string[] | undefined>();
  });

  it('filters nullish items when default-encoding multi field values', () => {
    const codec = {
      mode: 'multi',
      decode: (input) => input,
    } satisfies MultiOptionalFieldCodec<string[]>;

    expect(
      encodeFieldValue(codec, ['a', null, undefined, 'b'] as never),
    ).toEqual(['a', 'b']);
  });

  it('uses custom multi field encode when provided', () => {
    const codec = {
      mode: 'multi',
      decode: (input) => input.map(Number),
      encode: (value) => value.map((item) => `id-${item}`),
    } satisfies MultiOptionalFieldCodec<number[]>;

    expect(encodeFieldValue(codec, [1, 2])).toEqual(['id-1', 'id-2']);
  });
});

describe('encodeField', () => {
  it('writes a single field to a copied URLSearchParams', () => {
    const codec = {
      decode: (input) => Number(input),
    } satisfies SingleOptionalFieldCodec<number>;
    const base = new URLSearchParams('page=1&sort=desc');

    const searchParams = encodeField(codec, 2, base, 'page');

    expect(searchParams.toString()).toBe('sort=desc&page=2');
    expect(base.toString()).toBe('page=1&sort=desc');
  });

  it('deletes a field when the value is nullish', () => {
    const codec = {
      decode: (input) => input,
    } satisfies SingleOptionalFieldCodec<string>;

    const searchParams = encodeField(
      codec,
      null,
      new URLSearchParams('keyword=decurl&page=2'),
      'keyword',
    );

    expect(searchParams.toString()).toBe('page=2');
  });

  it('deletes aliases and writes the canonical key', () => {
    const codec = {
      decode: (input) => Number(input),
    } satisfies SingleOptionalFieldCodec<number>;

    const searchParams = encodeField(
      codec,
      3,
      new URLSearchParams('page_num=1&p=2&sort=desc'),
      ['page_num', 'p'],
    );

    expect(searchParams.toString()).toBe('sort=desc&page_num=3');
  });

  it('deletes a field when encoded value is undefined', () => {
    const codec = {
      decode: (input) => Number(input),
      encode: () => undefined,
    } satisfies SingleOptionalFieldCodec<number>;

    const searchParams = encodeField(
      codec,
      2,
      new URLSearchParams('page=1&sort=desc'),
      'page',
    );

    expect(searchParams.toString()).toBe('sort=desc');
  });

  it('deletes default values unless preserveDefault is true', () => {
    const codec = {
      decode: (input) => Number(input),
      defaultValue: 1,
    } satisfies SingleRequiredFieldCodec<number>;

    expect(
      encodeField(codec, 1, new URLSearchParams('page=2'), 'page').toString(),
    ).toBe('');

    expect(
      encodeField(codec, 1, new URLSearchParams('page=2'), 'page', {
        preserveDefault: true,
      }).toString(),
    ).toBe('page=1');
  });

  it('appends multi values in order', () => {
    const codec = {
      mode: 'multi',
      decode: (input) => input,
    } satisfies MultiOptionalFieldCodec<string[]>;

    const searchParams = encodeField(
      codec,
      ['a', 'b'],
      new URLSearchParams('tags=old&page=1'),
      'tags',
    );

    expect(searchParams.toString()).toBe('page=1&tags=a&tags=b');
  });
});

describe('encodeFieldInternal', () => {
  it('writes to the provided URLSearchParams instance', () => {
    const codec = {
      decode: (input) => Number(input),
    } satisfies SingleOptionalFieldCodec<number>;
    const searchParams = new URLSearchParams('page=1&sort=desc');

    const nextSearchParams = encodeFieldInternal(
      codec,
      2,
      searchParams,
      'page',
    );

    expect(nextSearchParams).toBe(searchParams);
    expect(searchParams.toString()).toBe('sort=desc&page=2');
  });
});

describe('isFieldValueEqual', () => {
  it('returns true when values are Object.is equal', () => {
    const codec = {
      decode: (input) => Number(input),
    } satisfies SingleOptionalFieldCodec<number>;

    expect(isFieldValueEqual(codec, 1, 1)).toBe(true);
    expect(isFieldValueEqual(codec, undefined, undefined)).toBe(true);
  });

  it('returns false when only one optional value is undefined', () => {
    const codec = {
      decode: (input) => Number(input),
    } satisfies SingleOptionalFieldCodec<number>;

    expect(isFieldValueEqual(codec, 1, undefined)).toBe(false);
    expect(isFieldValueEqual(codec, undefined, 1)).toBe(false);
  });

  it('uses Object.is as the default single field equality', () => {
    const codec = {
      decode: (input) => ({ value: input }),
    } satisfies SingleOptionalFieldCodec<{ value: string }>;

    expect(
      isFieldValueEqual(codec, { value: 'decurl' }, { value: 'decurl' }),
    ).toBe(false);
  });

  it('uses custom field equality when provided', () => {
    const codec = {
      decode: (input) => ({ value: input }),
      eq: (left, right) => left.value === right.value,
    } satisfies SingleOptionalFieldCodec<{ value: string }>;

    expect(
      isFieldValueEqual(codec, { value: 'decurl' }, { value: 'decurl' }),
    ).toBe(true);
  });

  it('uses order-sensitive shallow array equality for multi fields', () => {
    const codec = {
      mode: 'multi',
      decode: (input) => input.map(Number),
    } satisfies MultiOptionalFieldCodec<number[]>;

    expect(isFieldValueEqual(codec, [1, 2], [1, 2])).toBe(true);
    expect(isFieldValueEqual(codec, [1, 2], [2, 1])).toBe(false);
  });

  it('uses Object.is per item for multi field array equality', () => {
    const item = { id: 1 };
    const codec = {
      mode: 'multi',
      decode: () => [item],
    } satisfies MultiOptionalFieldCodec<Array<{ id: number }>>;

    expect(isFieldValueEqual(codec, [item], [item])).toBe(true);
    expect(isFieldValueEqual(codec, [{ id: 1 }], [{ id: 1 }])).toBe(false);
  });
});
