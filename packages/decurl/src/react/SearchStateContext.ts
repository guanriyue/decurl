import { createContext, useContext } from 'react';
import { createSearchStore } from '../store/searchStore';
import type { SearchStore } from '../store/types';

export type SearchStateContextValue = {
  store: SearchStore;
};

const globalStore = createSearchStore();

export const SearchStateContext = createContext<SearchStateContextValue | null>(null);
SearchStateContext.displayName = 'SearchStateContext';

export const useRequiredContextStore = (
  consumerName: string,
  providerName = SearchStateContext.displayName ?? 'SearchStateContext',
): SearchStore => {
  const context = useContext(SearchStateContext);

  if (!context) {
    throw new Error(`${consumerName} must be used within ${providerName}.`);
  }

  return context.store;
};

export const useContextStore = (): SearchStore => {
  const context = useContext(SearchStateContext);

  if (!context) {
    return globalStore;
  }

  return context.store;
};
