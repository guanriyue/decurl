import {
  decodeFields,
  type EncodeFieldsOptions,
  type EncodeFieldsValues,
  encodeFields,
} from './fields';
import type { InferFieldValues, RecordCodec } from './types';

export type URLSearchParamsCodec<TDefinition extends RecordCodec> = {
  decode: (searchParams: URLSearchParams) => InferFieldValues<TDefinition>;
  encode: (
    values: EncodeFieldsValues<TDefinition>,
    options?: EncodeFieldsOptions,
  ) => URLSearchParams;
};

export const createURLSearchParamsCodec = <TDefinition extends RecordCodec>(
  definition: TDefinition,
): URLSearchParamsCodec<TDefinition> => {
  return {
    decode: (searchParams) => decodeFields(definition, searchParams),

    encode: (values, options) => encodeFields(definition, values, options),
  };
};
