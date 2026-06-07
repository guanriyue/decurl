import { describe, expect, expectTypeOf, it } from 'vitest';
import { mapItems, pipe, shape, toNumber } from '../decode';
import type { FieldCodec, InferFieldValues } from './types';
import { createURLSearchParamsCodec } from './urlSearchParams';

describe('createURLSearchParamsCodec', () => {
  const definition = {
    keyword: {
      name: 'q',
      decode: (input) => input,
    },
    page: {
      decode: pipe(shape.integer, toNumber),
      defaultValue: 1,
    },
    tags: {
      mode: 'multi',
      decode: mapItems((input: string) => input),
    },
  } satisfies Record<string, FieldCodec>;

  it('creates a codec that decodes URLSearchParams with inferred values', () => {
    const codec = createURLSearchParamsCodec(definition);

    const values = codec.decode(
      new URLSearchParams('q=decurl&page=2&tags=a&tags=b'),
    );

    expect(values).toEqual({
      keyword: 'decurl',
      page: 2,
      tags: ['a', 'b'],
    });
    expectTypeOf(values).toEqualTypeOf<InferFieldValues<typeof definition>>();
  });

  it('creates a codec that encodes patch values with options', () => {
    const codec = createURLSearchParamsCodec(definition);

    const searchParams = codec.encode(
      {
        keyword: 'decurl',
        page: 1,
      },
      {
        base: 'page=2&tags=a&tags=b',
        preserveDefault: true,
      },
    );

    expect(searchParams.toString()).toBe('page=1&tags=a&tags=b&q=decurl');
  });
});
