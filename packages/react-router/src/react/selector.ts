import type { InferFieldValues, RecordCodec } from '@decurl/core/codec';
import { isFieldValuesEqual } from '@decurl/core/codec';
import { useRef } from 'react';
import type { SearchStoreSnapshot } from '../store/types';

export type SearchStateSelector<TValue> = (
  snapshot: SearchStoreSnapshot,
) => TValue;

export const useSearchStateSelector = <TDefinition extends RecordCodec>(
  schema: TDefinition,
  selector: SearchStateSelector<InferFieldValues<TDefinition>>,
): SearchStateSelector<InferFieldValues<TDefinition>> => {
  const previousValuesRef = useRef<InferFieldValues<TDefinition> | undefined>(
    undefined,
  );

  return (snapshot) => {
    const nextValues = selector(snapshot);
    const previousValues = previousValuesRef.current;

    if (
      typeof previousValues !== 'undefined' &&
      isFieldValuesEqual(schema, nextValues, previousValues)
    ) {
      return previousValues;
    }

    previousValuesRef.current = nextValues;
    return nextValues;
  };
};
