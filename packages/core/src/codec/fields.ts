import { isDef } from '../_internal/isDef';
import { isNil } from '../_internal/isNil';
import { isUndefined } from '../_internal/isUndefined';
import { decodeField, encodeField, isFieldValueEqual } from './field';
import type { FieldCodec, InferFieldValues, RecordCodec } from './types';

export type EncodeFieldsOptions = {
  base?: URLSearchParams | string;
  preserveDefault?: boolean;
};

export type EncodeFieldsValues<TDefinition extends RecordCodec> = Partial<{
  [key in keyof InferFieldValues<TDefinition>]:
    | InferFieldValues<TDefinition>[key]
    | null
    | undefined;
}>;

export const decodeFields = <TDefinition extends RecordCodec>(
  definition: TDefinition,
  searchParams: URLSearchParams,
): InferFieldValues<TDefinition> => {
  return Object.fromEntries(
    Object.entries(definition).map(([key, codec]) => [
      key,
      decodeField(codec, searchParams, getFieldNames(codec, key)),
    ]),
  ) as InferFieldValues<TDefinition>;
};

export const encodeFields = <TDefinition extends RecordCodec>(
  definition: TDefinition,
  values: EncodeFieldsValues<TDefinition>,
  options: EncodeFieldsOptions = {},
): URLSearchParams => {
  const searchParams = new URLSearchParams(options.base);

  for (const [key, codec] of Object.entries(definition)) {
    if (!Object.hasOwn(values, key)) {
      continue;
    }

    const searchKeys = getFieldNames(codec, key);
    const canonicalKey = searchKeys[0];
    const value = values[key as keyof EncodeFieldsValues<TDefinition>];

    if (isNil(value)) {
      deleteSearchKeys(searchParams, searchKeys);
      continue;
    }

    if (
      options.preserveDefault !== true &&
      isDef(codec.defaultValue) &&
      isFieldValueEqual(codec, value, codec.defaultValue)
    ) {
      deleteSearchKeys(searchParams, searchKeys);
      continue;
    }

    const encoded = encodeField(codec, value);

    if (isUndefined(encoded)) {
      deleteSearchKeys(searchParams, searchKeys);
      continue;
    }

    deleteSearchKeys(searchParams, searchKeys);

    if (Array.isArray(encoded)) {
      for (const item of encoded) {
        searchParams.append(canonicalKey, item);
      }
    } else {
      searchParams.set(canonicalKey, encoded);
    }
  }

  return searchParams;
};

export const isFieldValuesEqual = <TDefinition extends RecordCodec>(
  definition: TDefinition,
  values: InferFieldValues<TDefinition>,
  previousValues: InferFieldValues<TDefinition>,
): boolean => {
  if (Object.is(values, previousValues)) {
    return true;
  }

  return Object.entries(definition).every(([key, codec]) => {
    return isFieldValueEqual(
      codec,
      values[key as keyof InferFieldValues<TDefinition>],
      previousValues[key as keyof InferFieldValues<TDefinition>],
    );
  });
};

const getFieldNames = (codec: FieldCodec, key: string): readonly string[] => {
  if (typeof codec.name === 'string') {
    return [codec.name];
  }

  if (Array.isArray(codec.name) && codec.name.length > 0) {
    return codec.name;
  }

  return [key];
};

const deleteSearchKeys = (
  searchParams: URLSearchParams,
  keys: readonly string[],
): void => {
  for (const key of keys) {
    searchParams.delete(key);
  }
};
