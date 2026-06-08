import type {
  InferFieldValues,
  RecordCodec,
} from '@decurl/core/codec';
import type { SearchNavigateOptions } from '../runtime/types';
import type { SearchPatch } from '../store/types';

export type SetSearchState<TDefinition extends RecordCodec> = (
  patch: SearchPatch<TDefinition>,
  options?: SearchNavigateOptions,
) => void;

export type UseSearchStateResult<TDefinition extends RecordCodec> = [
  InferFieldValues<TDefinition>,
  SetSearchState<TDefinition>,
];

export const useSearchState = <TDefinition extends RecordCodec>(
  _schema: TDefinition,
): UseSearchStateResult<TDefinition> => {
  throw new Error('useSearchState is not implemented yet.');
};

