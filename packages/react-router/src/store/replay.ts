import type { SearchLocation } from '../runtime/types';
import type { PendingEntry } from './types';

export const replay = (base: SearchLocation, entries: readonly PendingEntry[]): SearchLocation => {
  let search = new URLSearchParams(base.search);

  for (const entry of entries) {
    search = entry.apply(search);
  }

  return {
    pathname: base.pathname,
    search: search.toString(),
  };
};
