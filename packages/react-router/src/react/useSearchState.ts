import type { InferFieldValues, RecordCodec } from '@decurl/core/codec';
import { decodeFields } from '@decurl/core/codec';
import { useCallback, useSyncExternalStore } from 'react';
import type { SearchNavigateOptions } from '../runtime/types';
import type { SearchPatch } from '../store/types';
import { useContextStore } from './SearchStateContext';
import { useSearchStateSelector } from './selector';
import { useConfigureRuntime } from './useConfigureRuntime';

export type SetSearchState<TDefinition extends RecordCodec> = (
  patch: SearchPatch<TDefinition>,
  options?: SearchNavigateOptions,
) => void;

export type UseSearchStateResult<TDefinition extends RecordCodec> = [
  values: InferFieldValues<TDefinition>,
  setValues: (
    patch: SearchPatch<TDefinition>,
    options?: SearchNavigateOptions,
  ) => void,
];

export const useSearchState = <TDefinition extends RecordCodec>(
  schema: TDefinition,
): UseSearchStateResult<TDefinition> => {
  useConfigureRuntime();

  const store = useContextStore();
  const selectValues = useSearchStateSelector(schema, (nextSnapshot) => {
    return decodeFields(
      schema,
      new URLSearchParams(nextSnapshot.location.search),
    );
  });
  const getValuesSnapshot = () => selectValues(store.getSnapshot());
  const values = useSyncExternalStore(
    store.subscribe,
    getValuesSnapshot,
    getValuesSnapshot,
  );
  const setValues = useCallback<SetSearchState<TDefinition>>(
    (patch, options) => {
      store.setValues(schema, patch, options);
    },
    [schema, store],
  );

  return [values, setValues];
};
