import type {
  FieldCodec,
  InferFieldValue,
  MultiOptionalFieldCodec,
  MultiRequiredFieldCodec,
  NamedFieldCodec,
  SingleOptionalFieldCodec,
  SingleRequiredFieldCodec,
} from '@decurl/core/codec';
import {
  decodeField,
  encodeField,
  isFieldValueEqual,
} from '@decurl/core/codec';
import { useCallback, useSyncExternalStore } from 'react';
import type { SearchNavigateOptions } from '../runtime/types';
import type { SearchStore } from '../store/types';
import { useContextStore } from './SearchStateContext';
import { useEqualityCheckedSelector } from './selector';
import { useConfigureRuntime } from './useConfigureRuntime';

export type SearchValueCodec =
  // biome-ignore lint/suspicious/noExplicitAny: 用于表达任意具名 FieldCodec 分支
  | NamedFieldCodec<SingleOptionalFieldCodec<any>>
  // biome-ignore lint/suspicious/noExplicitAny: 用于表达任意具名 FieldCodec 分支
  | NamedFieldCodec<SingleRequiredFieldCodec<any>>
  // biome-ignore lint/suspicious/noExplicitAny: 用于表达任意具名 FieldCodec 分支
  | NamedFieldCodec<MultiOptionalFieldCodec<any>>
  // biome-ignore lint/suspicious/noExplicitAny: 用于表达任意具名 FieldCodec 分支
  | NamedFieldCodec<MultiRequiredFieldCodec<any>>;

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

export const useSearchValue = <TCodec extends SearchValueCodec>(
  codec: TCodec,
): UseSearchValueResult<TCodec> => {
  useConfigureRuntime();

  const store = useContextStore();

  return useSearchValueStore(store, codec);
};

export const useSearchValueStore = <TCodec extends SearchValueCodec>(
  store: SearchStore,
  codec: TCodec,
): UseSearchValueResult<TCodec> => {
  const selectValue = useEqualityCheckedSelector(
    (nextSnapshot) => {
      return decodeField(
        new URLSearchParams(nextSnapshot.location.search),
        codec,
        codec.name,
      );
    },
    (nextValue, previousValue) => {
      return isFieldValueEqual(codec, nextValue, previousValue);
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
          const previousValue = decodeField(searchParams, codec, codec.name);
          const nextValue = resolveSearchValuePatch(patch, previousValue);

          return encodeField(searchParams, codec, codec.name, nextValue);
        },
        options,
      });
    },
    [codec, store],
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
