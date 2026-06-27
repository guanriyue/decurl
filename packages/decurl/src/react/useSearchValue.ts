import { useSyncExternalStore } from 'react';
import { useStableEvent } from '../_internal/useStableEvent';
import type { FieldCodec, InferFieldValue, NamedFieldCodec } from '../codec';
import { decodeField, encodeField, isFieldValueEqual } from '../codec';
import type { SearchNavigateOptions } from '../runtime/types';
import type { SearchStore } from '../store/types';
import { useContextStore } from './SearchStateContext';
import { useEqualityCheckedSelector } from './selector';
import { useConfigureRuntimeStore } from './useConfigureRuntime';

export type SearchValuePatch<TCodec extends FieldCodec> =
  | InferFieldValue<TCodec>
  | null
  | undefined
  | ((previousValue: InferFieldValue<TCodec>) => InferFieldValue<TCodec> | null | undefined);

export type SetSearchValue<TCodec extends FieldCodec> = (
  patch: SearchValuePatch<TCodec>,
  options?: SearchNavigateOptions,
) => void;

export type UseSearchValueResult<TCodec extends FieldCodec> = [
  value: InferFieldValue<TCodec>,
  setValue: SetSearchValue<TCodec>,
];

export const useSearchValue = <TCodec extends NamedFieldCodec>(
  codec: TCodec,
): UseSearchValueResult<TCodec> => {
  const store = useContextStore();
  useConfigureRuntimeStore(store);

  return useSearchValueStore(store, codec);
};

export const useSearchValueContext = <TCodec extends NamedFieldCodec>(
  codec: TCodec,
): UseSearchValueResult<TCodec> => {
  const store = useContextStore();

  return useSearchValueStore(store, codec);
};

export const useSearchValueStore = <TCodec extends NamedFieldCodec>(
  store: SearchStore,
  codec: TCodec,
): UseSearchValueResult<TCodec> => {
  const selectValue = useEqualityCheckedSelector(
    (nextSnapshot) => {
      return decodeField(new URLSearchParams(nextSnapshot.location.search), codec, codec.name);
    },
    (nextValue, previousValue) => {
      return isFieldValueEqual(codec, nextValue, previousValue);
    },
  );
  const getValueSnapshot = () => selectValue(store.getSnapshot());
  const value = useSyncExternalStore(store.subscribe, getValueSnapshot, getValueSnapshot);
  const setValue = useStableEvent<SetSearchValue<TCodec>>((patch, options) => {
    store.addEntry({
      apply: (searchParams) => {
        if (typeof patch !== 'function') {
          return encodeField(searchParams, codec, codec.name, patch);
        }

        const previousValue = decodeField(searchParams, codec, codec.name);
        const updater = patch as (
          previousValue: InferFieldValue<TCodec>,
        ) => InferFieldValue<TCodec> | null | undefined;
        const nextValue = updater(previousValue);

        return encodeField(searchParams, codec, codec.name, nextValue);
      },
      options,
    });
  });

  return [value, setValue];
};
