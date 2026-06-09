import { createContext, useContext } from 'react';
import { createSearchStore } from '../store/searchStore';
import type { SearchStore } from '../store/types';

export type SearchStateContextValue = {
  store: SearchStore;
};

export const defaultSearchStateContextValue: SearchStateContextValue = {
  store: createSearchStore(),
};

export const SearchStateContext = createContext<SearchStateContextValue>(
  defaultSearchStateContextValue,
);

export const useSearchStateContext = (): SearchStateContextValue => {
  return useContext(SearchStateContext);
};

export const useContextStore = (): SearchStore => {
  return useSearchStateContext().store;
};
