import { useSyncExternalStore } from 'react';
import { useStableEvent } from '../_internal/useStableEvent';
import type { EncodeFieldsValues, InferFieldValues, RecordCodec } from '../codec';
import { decodeFields, encodeFields } from '../codec';
import type { SearchNavigateOptions } from '../runtime/types';
import type { SearchStore } from '../store/types';
import { useContextStore } from './SearchStateContext';
import { useSearchStateSelector } from './selector';
import { useConfigureRuntime } from './useConfigureRuntime';

export type SearchValuesPatch<TDefinition extends RecordCodec> =
  | EncodeFieldsValues<TDefinition>
  | undefined
  | ((
      previousValues: InferFieldValues<TDefinition>,
    ) => EncodeFieldsValues<TDefinition> | undefined);

export type SetSearchValues<TDefinition extends RecordCodec> = (
  patch: SearchValuesPatch<TDefinition>,
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

  return useSearchValuesStore(store, schema);
};

export const useSearchValuesStore = <TDefinition extends RecordCodec>(
  store: SearchStore,
  schema: TDefinition,
): UseSearchValuesResult<TDefinition> => {
  const selectValues = useSearchStateSelector(schema, (nextSnapshot) => {
    return decodeFields(schema, new URLSearchParams(nextSnapshot.location.search));
  });
  const getValuesSnapshot = () => selectValues(store.getSnapshot());
  const values = useSyncExternalStore(store.subscribe, getValuesSnapshot, getValuesSnapshot);
  const setValues = useStableEvent<SetSearchValues<TDefinition>>((patch, options) => {
    store.addEntry({
      apply: (searchParams) => {
        if (typeof patch !== 'function') {
          return encodeFields(schema, normalizeSearchPatch(schema, patch), {
            base: searchParams,
          });
        }

        const previousValues = decodeFields(schema, searchParams);
        const nextPatch = patch(previousValues);

        return encodeFields(schema, normalizeSearchPatch(schema, nextPatch), {
          base: searchParams,
        });
      },
      options,
    });
  });

  return [values, setValues];
};

const normalizeSearchPatch = <TDefinition extends RecordCodec>(
  schema: TDefinition,
  patch: EncodeFieldsValues<TDefinition> | undefined,
): EncodeFieldsValues<TDefinition> => {
  if (typeof patch !== 'undefined') {
    return patch;
  }

  return Object.fromEntries(
    Object.keys(schema).map((key) => [key, undefined]),
  ) as EncodeFieldsValues<TDefinition>;
};
