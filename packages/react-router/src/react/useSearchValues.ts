import type { InferFieldValues, RecordCodec } from '@decurl/core/codec';
import { decodeFields, encodeFields } from '@decurl/core/codec';
import { useCallback, useSyncExternalStore } from 'react';
import type { SearchNavigateOptions } from '../runtime/types';
import type { SearchPatch } from '../store/types';
import { useContextStore } from './SearchStateContext';
import { useSearchStateSelector } from './selector';
import { useConfigureRuntime } from './useConfigureRuntime';

export type SetSearchValues<TDefinition extends RecordCodec> = (
  patch: SearchPatch<TDefinition>,
  options?: SearchNavigateOptions,
) => void;

export type UseSearchValuesResult<TDefinition extends RecordCodec> = [
  values: InferFieldValues<TDefinition>,
  setValues: SetSearchValues<TDefinition>,
];

export const useSearchValues = <TDefinition extends RecordCodec>(
  schema: TDefinition,
): UseSearchValuesResult<TDefinition> => {
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
  const setValues = useCallback<SetSearchValues<TDefinition>>(
    (patch, options) => {
      store.addEntry({
        apply: (searchParams) => {
          const previousValues = decodeFields(schema, searchParams);
          const nextPatch =
            typeof patch === 'function' ? patch(previousValues) : patch;

          return encodeFields(schema, nextPatch, { base: searchParams });
        },
        options,
      });
    },
    [schema, store],
  );

  return [values, setValues];
};
