import { describe, expectTypeOf, it } from 'vitest';
import type {
  FieldCodec,
  FieldsCodec,
  InferFieldValue,
  InferFieldValues,
  MultiOptionalFieldCodec,
  MultiRequiredFieldCodec,
  NamedFieldCodec,
  SingleOptionalFieldCodec,
  SingleRequiredFieldCodec,
  WithDefinedFieldName,
} from './types';
import { field } from './types';

describe('FieldCodec types', () => {
  it('infers optional single field values as value or undefined', () => {
    const codec = {
      decode: (input) => (input === null ? undefined : Number(input)),
    } satisfies SingleOptionalFieldCodec<number>;

    expectTypeOf(codec.decode).parameter(0).toEqualTypeOf<string>();
    expectTypeOf<InferFieldValue<typeof codec>>().toEqualTypeOf<number | undefined>();
  });

  it('infers required single field values as value', () => {
    const codec = {
      decode: (input) => (input === null ? undefined : Number(input)),
      defaultValue: 1,
    } satisfies SingleRequiredFieldCodec<number>;

    expectTypeOf(codec.decode).parameter(0).toEqualTypeOf<string>();
    expectTypeOf<InferFieldValue<typeof codec>>().toEqualTypeOf<number>();
  });

  it('infers optional multi field values as value or undefined', () => {
    const codec = {
      mode: 'multi',
      decode: (input) => input,
    } satisfies MultiOptionalFieldCodec<string[]>;

    expectTypeOf(codec.decode).parameter(0).toEqualTypeOf<string[]>();
    expectTypeOf<InferFieldValue<typeof codec>>().toEqualTypeOf<string[] | undefined>();
  });

  it('infers required multi field values as value', () => {
    const codec = {
      mode: 'multi',
      decode: (input) => input,
      defaultValue: [] as string[],
    } satisfies MultiRequiredFieldCodec<string[]>;

    expectTypeOf(codec.decode).parameter(0).toEqualTypeOf<string[]>();
    expectTypeOf<InferFieldValue<typeof codec>>().toEqualTypeOf<string[]>();
  });

  it('supports the unified field codec union', () => {
    const singleCodec = {
      decode: (input) => input,
    } satisfies FieldCodec<string>;

    const multiCodec = {
      mode: 'multi',
      decode: (input) => input,
    } satisfies FieldCodec<string[]>;

    expectTypeOf<InferFieldValue<typeof singleCodec>>().toEqualTypeOf<string | undefined>();
    expectTypeOf<InferFieldValue<typeof multiCodec>>().toEqualTypeOf<string[] | undefined>();
  });

  it('rejects nullish default values', () => {
    const undefinedDefault = {
      decode: (input) => (input === null ? undefined : Number(input)),
      // @ts-expect-error defaultValue cannot be undefined.
      defaultValue: undefined,
    } satisfies SingleRequiredFieldCodec<number>;

    const nullDefault = {
      decode: (input) => (input === null ? undefined : Number(input)),
      // @ts-expect-error defaultValue cannot be null.
      defaultValue: null,
    } satisfies SingleRequiredFieldCodec<number>;

    void undefinedDefault;
    void nullDefault;
  });

  it('rejects mismatched mode and decode input shapes', () => {
    const singleDecode = {
      // @ts-expect-error single field decode receives string.
      decode: (input: string[]) => input,
    } satisfies SingleOptionalFieldCodec<string[]>;

    const multiDecode = {
      mode: 'multi',
      // @ts-expect-error multi field decode receives string[].
      decode: (input: string | null) => input,
    } satisfies MultiOptionalFieldCodec<string>;

    void singleDecode;
    void multiDecode;
  });

  it('infers values from a field codec definition', () => {
    const definition = {
      /**
       * key
       */
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
      selectedIds: {
        mode: 'multi',
        decode: (input) => input.map(Number),
        defaultValue: [],
      },
    } satisfies Record<string, FieldCodec>;

    expectTypeOf<InferFieldValues<typeof definition>>().toEqualTypeOf<{
      keyword: string | undefined;
      page: number;
      tags: string[] | undefined;
      selectedIds: number[];
    }>();
  });

  it('maps required and optional data values to field codecs', () => {
    type SearchSchema = FieldsCodec<{
      page: number;
      pageSize: number | undefined;
      keyword?: string;
    }>;

    expectTypeOf<SearchSchema>().toEqualTypeOf<{
      page: SingleRequiredFieldCodec<number>;
      pageSize: SingleOptionalFieldCodec<number>;
      keyword: SingleOptionalFieldCodec<string>;
    }>();
  });

  it('allows arrays to be encoded as single array fields or multi fields', () => {
    type SearchSchema = FieldsCodec<{
      tags: string[];
      selectedIds?: number[];
    }>;

    expectTypeOf<SearchSchema>().toEqualTypeOf<{
      tags: SingleRequiredFieldCodec<string[]> | MultiRequiredFieldCodec<string[]>;
      selectedIds: SingleOptionalFieldCodec<number[]> | MultiOptionalFieldCodec<number[]>;
    }>();
  });

  it('infers named single field codecs from explicit string names', () => {
    const codec = field({
      name: 'keyword',
      decode: (input) => input,
    });

    expectTypeOf(codec).toEqualTypeOf<WithDefinedFieldName<SingleOptionalFieldCodec<string>>>();
    expectTypeOf(codec).toExtend<NamedFieldCodec>();
  });

  it('infers named multi field codecs from explicit non-empty alias tuples', () => {
    const codec = field({
      mode: 'multi',
      name: ['tag', 't'] as const,
      decode: (input) => input,
    });

    expectTypeOf(codec).toEqualTypeOf<WithDefinedFieldName<MultiOptionalFieldCodec<string[]>>>();
    expectTypeOf(codec).toExtend<NamedFieldCodec>();
  });

  it('uses NamedFieldCodec as the concrete named field codec type', () => {
    const codec: NamedFieldCodec = field({
      name: 'keyword',
      decode: (input) => input,
    });

    void codec;
  });

  it('does not infer named field codecs from empty name arrays', () => {
    const codec = field({
      name: [],
      decode: (input) => input,
    });

    expectTypeOf(codec).toEqualTypeOf<SingleOptionalFieldCodec<string>>();
  });

  it('does not infer named field codecs from unknown-length name arrays', () => {
    const names: string[] = ['keyword'];
    const codec = field({
      name: names,
      decode: (input) => input,
    });

    expectTypeOf(codec).toEqualTypeOf<SingleOptionalFieldCodec<string>>();
  });
});
