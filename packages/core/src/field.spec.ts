import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import type {
  MultiOptionalFieldCodec,
  SingleOptionalFieldCodec,
  SingleRequiredFieldCodec,
} from './codec';
import { decodeField, isFieldValueEqual } from './field';

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

  it('passes an empty array to multi decode when key is missing', () => {
    const decode = vi.fn((input: string[]) => input);
    const codec = {
      mode: 'multi',
      decode,
    } satisfies MultiOptionalFieldCodec<string[]>;

    const value = decodeField(codec, new URLSearchParams(), 'tag');

    expect(value).toEqual([]);
    expect(decode).toHaveBeenCalledWith([]);
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
      isFieldValueEqual(
        codec,
        { value: 'decurl' },
        { value: 'decurl' },
      ),
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
