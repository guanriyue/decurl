import { shallowEqualArray } from './_internal/shallowEqualArray';
import type {
  FieldCodec,
  InferFieldValue,
  MultiOptionalFieldCodec,
  MultiRequiredFieldCodec,
} from './codec';

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
