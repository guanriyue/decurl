import type { InferFieldValues, RecordCodec } from './codec';
import { decodeField } from './field';

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
