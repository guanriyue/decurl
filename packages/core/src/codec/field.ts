import { isDef } from '../_internal/isDef';
import { isNil } from '../_internal/isNil';
import { shallowEqualArray } from '../_internal/shallowEqualArray';
import type {
  FieldCodec,
  InferFieldValue,
  MultiOptionalFieldCodec,
  MultiRequiredFieldCodec,
} from './types';

export type EncodedFieldValue<TCodec extends FieldCodec> =
  TCodec extends { mode: 'multi' } ? string[] | undefined : string | undefined;

export const decodeField = <TCodec extends FieldCodec>(
  codec: TCodec,
  searchParams: URLSearchParams,
  key: string,
): InferFieldValue<TCodec> => {
  if (isMultiFieldCodec(codec)) {
    const decoded =
      codec.decode(searchParams.getAll(key)) ?? codec.defaultValue;
    return decoded as never;
  }

  const raw = searchParams.get(key);

  if (raw === null) {
    return codec.defaultValue as never;
  }

  const decoded = codec.decode(raw) ?? codec.defaultValue;
  return decoded as never;
};

export const encodeField = <TCodec extends FieldCodec>(
  codec: TCodec,
  value: InferFieldValue<TCodec> | null | undefined,
): EncodedFieldValue<TCodec> => {
  if (isNil(value)) {
    return undefined as EncodedFieldValue<TCodec>;
  }

  if (codec.encode !== undefined) {
    return (codec.encode(value) ?? undefined) as never;
  }

  if (isMultiFieldCodec(codec)) {
    if (!Array.isArray(value)) {
      return undefined as EncodedFieldValue<TCodec>;
    }

    return (value as readonly unknown[])
      .filter(isDef)
      .map(String) as EncodedFieldValue<TCodec>;
  }

  return String(value) as EncodedFieldValue<TCodec>;
};

export const isFieldValueEqual = <TCodec extends FieldCodec>(
  codec: TCodec,
  value: InferFieldValue<TCodec>,
  previousValue: InferFieldValue<TCodec>,
): boolean => {
  if (Object.is(value, previousValue)) {
    return true;
  }

  if (value === undefined || previousValue === undefined) {
    return false;
  }

  if (codec.eq !== undefined) {
    return codec.eq(value as never, previousValue as never);
  }

  if (isMultiFieldCodec(codec)) {
    return shallowEqualArray(value, previousValue);
  }

  return false;
};

const isMultiFieldCodec = <TValue>(
  codec: FieldCodec<TValue>,
): codec is
  | MultiOptionalFieldCodec<TValue>
  | MultiRequiredFieldCodec<TValue> => {
  return codec.mode === 'multi';
};
