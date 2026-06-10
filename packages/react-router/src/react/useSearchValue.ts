import type {
  FieldCodec,
  InferFieldValue,
  NamedFieldCodec,
} from '@decurl/core/codec';
import { decodeField, encodeField, isFieldValueEqual } from '@decurl/core/codec';
import { useCallback, useSyncExternalStore } from 'react';
import type { SearchNavigateOptions } from '../runtime/types';
import { useContextStore } from './SearchStateContext';
import { useEqualityCheckedSelector } from './selector';
import { useConfigureRuntime } from './useConfigureRuntime';

export type SearchValuePatch<TCodec extends FieldCodec> =
  | InferFieldValue<TCodec>
  | null
  | undefined
  | ((
      previousValue: InferFieldValue<TCodec>,
    ) => InferFieldValue<TCodec> | null | undefined);

export type SetSearchValue<TCodec extends FieldCodec> = (
  patch: SearchValuePatch<TCodec>,
  options?: SearchNavigateOptions,
) => void;

export type UseSearchValueResult<TCodec extends FieldCodec> = [
  value: InferFieldValue<TCodec>,
  setValue: SetSearchValue<TCodec>,
];

export const useSearchValue = <TCodec extends FieldCodec>(
  codec: NamedFieldCodec<TCodec>,
): UseSearchValueResult<TCodec> => {
  useConfigureRuntime();

  const store = useContextStore();
  const fieldCodec = codec as unknown as TCodec;
  const selectValue = useEqualityCheckedSelector(
    (nextSnapshot) => {
      return decodeField(
        new URLSearchParams(nextSnapshot.location.search),
        fieldCodec,
        codec.name,
      );
    },
    (nextValue, previousValue) => {
      return isFieldValueEqual(fieldCodec, nextValue, previousValue);
    },
  );
  const getValueSnapshot = () => selectValue(store.getSnapshot());
  const value = useSyncExternalStore(
    store.subscribe,
    getValueSnapshot,
    getValueSnapshot,
  );
  const setValue = useCallback<SetSearchValue<TCodec>>(
    (patch, options) => {
      store.addEntry({
        apply: (searchParams) => {
          const previousValue = decodeField(
            searchParams,
            fieldCodec,
            codec.name,
          );
          const nextValue = resolveSearchValuePatch(patch, previousValue);

          return encodeField(
            searchParams,
            fieldCodec,
            codec.name,
            nextValue,
          );
        },
        options,
      });
    },
    [codec.name, fieldCodec, store],
  );

  return [value, setValue];
};

const resolveSearchValuePatch = <TCodec extends FieldCodec>(
  patch: SearchValuePatch<TCodec>,
  previousValue: InferFieldValue<TCodec>,
): InferFieldValue<TCodec> | null | undefined => {
  if (typeof patch === 'function') {
    const updater = patch as (
      previousValue: InferFieldValue<TCodec>,
    ) => InferFieldValue<TCodec> | null | undefined;

    return updater(previousValue);
  }

  return patch;
};
