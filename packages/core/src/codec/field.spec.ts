import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
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

afterEach(() => {
  vi.restoreAllMocks();
});

describe('decodeField', () => {
  it('decodes a single field by explicit key', () => {
    const codec = {
      decode: (input) => input,
    } satisfies SingleOptionalFieldCodec<string>;

    const value = decodeField(
      new URLSearchParams('keyword=decurl'),
      codec,
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

    const value = decodeField(new URLSearchParams(), codec, 'page');

    expect(value).toBe(1);
    expect(decode).not.toHaveBeenCalled();
    expectTypeOf(value).toEqualTypeOf<number>();
  });

  it('returns undefined without calling single decode when optional key is missing', () => {
    const decode = vi.fn((input: string) => Number(input));
    const codec = {
      decode,
    } satisfies SingleOptionalFieldCodec<number>;

    const value = decodeField(new URLSearchParams(), codec, 'page');

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
      new URLSearchParams('keyword='),
      codec,
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

    expect(decodeField(new URLSearchParams('page=x'), codec, 'page')).toBe(1);
  });

  it('falls back to defaultValue when single decode throws', () => {
    const error = new Error('Invalid page');
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const codec = {
      decode: () => {
        throw error;
      },
      defaultValue: 1,
    } satisfies SingleRequiredFieldCodec<number>;

    expect(decodeField(new URLSearchParams('page=x'), codec, 'page')).toBe(1);
    expect(consoleError).toHaveBeenNthCalledWith(
      1,
      '[decurl] Field decode threw an exception.',
    );
    expect(consoleError).toHaveBeenNthCalledWith(2, error);
  });

  it('returns undefined when optional single decode throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const codec = {
      decode: () => {
        throw new Error('Invalid page');
      },
    } satisfies SingleOptionalFieldCodec<number>;

    expect(
      decodeField(new URLSearchParams('page=x'), codec, 'page'),
    ).toBeUndefined();
  });

  it('decodes multi fields from all values in order', () => {
    const decode = vi.fn((input: string[]) => input.map(Number));
    const codec = {
      mode: 'multi',
      decode,
    } satisfies MultiOptionalFieldCodec<number[]>;

    const value = decodeField(new URLSearchParams('id=1&id=2'), codec, 'id');

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

    const value = decodeField(new URLSearchParams(), codec, 'tag');

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

    const value = decodeField(new URLSearchParams(), codec, 'tag');

    expect(value).toEqual(['default']);
    expect(decode).not.toHaveBeenCalled();
  });

  it('falls back to defaultValue when multi decode throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const codec = {
      mode: 'multi',
      decode: () => {
        throw new Error('Invalid tags');
      },
      defaultValue: ['default'],
    } satisfies MultiRequiredFieldCodec<string[]>;

    const value = decodeField(new URLSearchParams('tag=a&tag=b'), codec, 'tag');

    expect(value).toEqual(['default']);
  });

  it('decodes from a later alias when earlier aliases are missing', () => {
    const codec = {
      decode: (input) => Number(input),
    } satisfies SingleOptionalFieldCodec<number>;

    const value = decodeField(new URLSearchParams('p=2'), codec, [
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

    const value = decodeField(new URLSearchParams('page_num=bad&p=2'), codec, [
      'page_num',
      'p',
    ]);

    expect(value).toBe(2);
    expect(decode).toHaveBeenCalledWith('bad');
    expect(decode).toHaveBeenCalledWith('2');
  });

  it('continues to later aliases when decode throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const decode = vi.fn((input: string) => {
      if (input === 'bad') {
        throw new Error('Invalid page');
      }

      return Number(input);
    });
    const codec = {
      decode,
    } satisfies SingleOptionalFieldCodec<number>;

    const value = decodeField(new URLSearchParams('page_num=bad&p=2'), codec, [
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

    const searchParams = encodeField(base, codec, 'page', 2);

    expect(searchParams.toString()).toBe('page=2&sort=desc');
    expect(base.toString()).toBe('page=1&sort=desc');
  });

  it('deletes a field when the value is nullish', () => {
    const codec = {
      decode: (input) => input,
    } satisfies SingleOptionalFieldCodec<string>;

    const searchParams = encodeField(
      new URLSearchParams('keyword=decurl&page=2'),
      codec,
      'keyword',
      null,
    );

    expect(searchParams.toString()).toBe('page=2');
  });

  it('deletes aliases and writes the canonical key', () => {
    const codec = {
      decode: (input) => Number(input),
    } satisfies SingleOptionalFieldCodec<number>;

    const searchParams = encodeField(
      new URLSearchParams('page_num=1&p=2&sort=desc'),
      codec,
      ['page_num', 'p'],
      3,
    );

    expect(searchParams.toString()).toBe('page_num=3&sort=desc');
  });

  it('deletes a field when encoded value is undefined', () => {
    const codec = {
      decode: (input) => Number(input),
      encode: () => undefined,
    } satisfies SingleOptionalFieldCodec<number>;

    const searchParams = encodeField(
      new URLSearchParams('page=1&sort=desc'),
      codec,
      'page',
      2,
    );

    expect(searchParams.toString()).toBe('sort=desc');
  });

  it('deletes default values unless preserveDefault is true', () => {
    const codec = {
      decode: (input) => Number(input),
      defaultValue: 1,
    } satisfies SingleRequiredFieldCodec<number>;

    expect(
      encodeField(new URLSearchParams('page=2'), codec, 'page', 1).toString(),
    ).toBe('');

    expect(
      encodeField(new URLSearchParams('page=2'), codec, 'page', 1, {
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
      new URLSearchParams('tags=old&page=1'),
      codec,
      'tags',
      ['a', 'b'],
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
      searchParams,
      codec,
      'page',
      2,
    );

    expect(nextSearchParams).toBe(searchParams);
    expect(searchParams.toString()).toBe('page=2&sort=desc');
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
