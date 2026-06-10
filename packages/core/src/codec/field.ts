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

export type EncodeFieldOptions = {
  preserveDefault?: boolean;
};

export const decodeField = <TCodec extends FieldCodec>(
  searchParams: URLSearchParams,
  codec: TCodec,
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

export const encodeFieldValue = <TCodec extends FieldCodec>(
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

export const encodeField = <TCodec extends FieldCodec>(
  searchParams: URLSearchParams,
  codec: TCodec,
  key: string | readonly string[],
  value: InferFieldValue<TCodec> | null | undefined,
  options: EncodeFieldOptions = {},
): URLSearchParams => {
  const nextSearchParams = new URLSearchParams(searchParams);

  return encodeFieldInternal(nextSearchParams, codec, key, value, options);
};

export const encodeFieldInternal = <TCodec extends FieldCodec>(
  searchParams: URLSearchParams,
  codec: TCodec,
  key: string | readonly string[],
  value: InferFieldValue<TCodec> | null | undefined,
  options: EncodeFieldOptions = {},
): URLSearchParams => {
  const keys = typeof key === 'string' ? [key] : key;
  const canonicalKey = keys[0];

  if (isUndefined(canonicalKey)) {
    return searchParams;
  }

  if (isNil(value)) {
    deleteSearchKeys(searchParams, keys);
    return searchParams;
  }

  if (
    options.preserveDefault !== true &&
    isDef(codec.defaultValue) &&
    isFieldValueEqual(codec, value, codec.defaultValue)
  ) {
    deleteSearchKeys(searchParams, keys);
    return searchParams;
  }

  const encoded = encodeFieldValue(codec, value);

  if (isUndefined(encoded)) {
    deleteSearchKeys(searchParams, keys);
    return searchParams;
  }

  if (isMultiFieldCodec(codec)) {
    deleteSearchKeys(searchParams, keys);

    if (!Array.isArray(encoded)) {
      return searchParams;
    }

    for (const item of encoded) {
      searchParams.append(canonicalKey, item);
    }
  } else {
    searchParams.set(canonicalKey, encoded as string);
    deleteSearchKeys(searchParams, keys.slice(1));
  }

  return searchParams;
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

const deleteSearchKeys = (
  searchParams: URLSearchParams,
  keys: readonly string[],
): void => {
  for (const key of keys) {
    searchParams.delete(key);
  }
};
