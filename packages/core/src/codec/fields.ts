import { isDef } from '../_internal/isDef';
import { isNil } from '../_internal/isNil';
import { isUndefined } from '../_internal/isUndefined';
import { decodeField, encodeField, isFieldValueEqual } from './field';
import type { InferFieldValues, RecordCodec } from './types';

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
      decodeField(codec, searchParams, codec.name ?? key),
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

    const searchKey = codec.name ?? key;
    const value = values[key as keyof EncodeFieldsValues<TDefinition>];

    if (isNil(value)) {
      searchParams.delete(searchKey);
      continue;
    }

    if (
      options.preserveDefault !== true &&
      isDef(codec.defaultValue) &&
      isFieldValueEqual(codec, value, codec.defaultValue)
    ) {
      searchParams.delete(searchKey);
      continue;
    }

    const encoded = encodeField(codec, value);

    if (isUndefined(encoded)) {
      searchParams.delete(searchKey);
      continue;
    }

    if (Array.isArray(encoded)) {
      searchParams.delete(searchKey);
      for (const item of encoded) {
        searchParams.append(searchKey, item);
      }
    } else {
      searchParams.set(searchKey, encoded);
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
