import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import type {
  MultiOptionalFieldCodec,
  SingleOptionalFieldCodec,
  SingleRequiredFieldCodec,
} from './codec';
import { decodeField } from './field';

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
