import type { InferFieldValues, RecordCodec } from './codec';
import { decodeField, isFieldValueEqual } from './field';

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
