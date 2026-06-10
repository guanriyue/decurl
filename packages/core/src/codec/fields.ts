import { decodeField, encodeFieldInternal, isFieldValueEqual } from './field';
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
    const value = values[key as keyof EncodeFieldsValues<TDefinition>];

    encodeFieldInternal(codec, value, searchParams, searchKeys, {
      preserveDefault: options.preserveDefault,
    });
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
