import { isDef } from '../_internal/isDef';
import { isNil } from '../_internal/isNil';
import { isUndefined } from '../_internal/isUndefined';
import { shallowEqualArray } from '../_internal/shallowEqualArray';
import type {
  FieldCodec,
  InferFieldValue,
  MultiOptionalFieldCodec,
  MultiRequiredFieldCodec,
} from './types';

export type EncodedFieldValue<TCodec extends FieldCodec> = TCodec extends {
  mode: 'multi';
}
  ? string[] | undefined
  : string | undefined;

export const decodeField = <TCodec extends FieldCodec>(
  codec: TCodec,
  searchParams: URLSearchParams,
  key: string | readonly string[],
): InferFieldValue<TCodec> => {
  const keys = typeof key === 'string' ? [key] : key;

  if (isMultiFieldCodec(codec)) {
    for (const fieldKey of keys) {
      if (!searchParams.has(fieldKey)) {
        continue;
      }

      const decoded = codec.decode(searchParams.getAll(fieldKey));

      if (!isNil(decoded)) {
        return decoded as never;
      }
    }

    return codec.defaultValue as never;
  }

  for (const fieldKey of keys) {
    const raw = searchParams.get(fieldKey);

    if (raw === null) {
      continue;
    }

    const decoded = codec.decode(raw);

    if (!isNil(decoded)) {
      return decoded as never;
    }
  }

  return codec.defaultValue as never;
};

export const encodeField = <TCodec extends FieldCodec>(
  codec: TCodec,
  value: InferFieldValue<TCodec> | null | undefined,
): EncodedFieldValue<TCodec> => {
  if (isNil(value)) {
    return undefined as EncodedFieldValue<TCodec>;
  }

  if (!isUndefined(codec.encode)) {
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

  if (isUndefined(value) || isUndefined(previousValue)) {
    return false;
  }

  if (!isUndefined(codec.eq)) {
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
