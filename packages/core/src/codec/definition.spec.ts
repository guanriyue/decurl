import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { type DefinedFields, defineFields } from './definition';
import type { FieldCodec, SingleOptionalFieldCodec } from './types';

describe('defineFields', () => {
  it('sets missing field names to record keys without mutating input', () => {
    const textCodec = {
      decode: (input) => input,
    } satisfies SingleOptionalFieldCodec<string>;
    const definition = {
      text: textCodec,
    } satisfies Record<string, FieldCodec>;

    const fields = defineFields(definition);

    expect(fields.text).toEqual({
      decode: textCodec.decode,
      name: 'text',
    });
    expect(textCodec).toEqual({
      decode: textCodec.decode,
    });
    expectTypeOf(fields).toEqualTypeOf<DefinedFields<typeof definition>>();
  });

  it('falls back to the record key for empty name arrays', () => {
    const fields = defineFields({
      text: {
        name: [],
        decode: (input) => input,
      },
    } satisfies Record<string, FieldCodec>);

    expect(fields.text.name).toBe('text');
  });

  it('preserves configured names and aliases', () => {
    const fields = defineFields({
      page: {
        name: ['page_num', 'p'],
        decode: (input) => Number(input),
      },
      keyword: {
        name: 'q',
        decode: (input) => input,
      },
    } satisfies Record<string, FieldCodec>);

    expect(fields.page.name).toEqual(['page_num', 'p']);
    expect(fields.keyword.name).toBe('q');
  });

  it('warns in development when field names are duplicated', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    defineFields({
      page: {
        name: ['page_num', 'p'],
        decode: (input) => Number(input),
      },
      currentPage: {
        name: 'p',
        decode: (input) => Number(input),
      },
    } satisfies Record<string, FieldCodec>);

    expect(warn).toHaveBeenCalledWith(
      '[decurl] Duplicate field name "p" in schema definition: "page" and "currentPage".',
    );

    warn.mockRestore();
  });

  it('can disable duplicate name warnings', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    defineFields(
      {
        page: {
          name: ['page_num', 'p'],
          decode: (input) => Number(input),
        },
        currentPage: {
          name: 'p',
          decode: (input) => Number(input),
        },
      } satisfies Record<string, FieldCodec>,
      { warnOnNameConflict: false },
    );

    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
  });
});
