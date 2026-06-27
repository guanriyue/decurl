import { useRef } from 'react';
import type { InferFieldValues, RecordCodec } from '../codec';
import { isFieldValuesEqual } from '../codec';
import type { SearchStoreSnapshot } from '../store/types';

export type SearchStateSelector<TValue> = (snapshot: SearchStoreSnapshot) => TValue;

export type SearchStateEquality<TValue> = (value: TValue, previousValue: TValue) => boolean;

export const useEqualityCheckedSelector = <TValue>(
  selector: SearchStateSelector<TValue>,
  equality: SearchStateEquality<TValue>,
): SearchStateSelector<TValue> => {
  const previousValueRef = useRef<TValue | undefined>(undefined);

  return (snapshot) => {
    const nextValue = selector(snapshot);
    const previousValue = previousValueRef.current;

    if (typeof previousValue !== 'undefined' && equality(nextValue, previousValue)) {
      return previousValue;
    }

    previousValueRef.current = nextValue;
    return nextValue;
  };
};

export const useSearchStateSelector = <TDefinition extends RecordCodec>(
  schema: TDefinition,
  selector: SearchStateSelector<InferFieldValues<TDefinition>>,
): SearchStateSelector<InferFieldValues<TDefinition>> => {
  return useEqualityCheckedSelector(selector, (nextValues, previousValues) => {
    return isFieldValuesEqual(schema, nextValues, previousValues);
  });
};
