import { decodeFields, encodeFields } from '@decurl/core/codec';
import type { SearchLocation } from '../runtime/types';
import type { PendingEntry } from './types';

export const replay = (
  base: SearchLocation,
  entries: readonly PendingEntry[],
): SearchLocation => {
  let search = new URLSearchParams(base.search);

  for (const entry of entries) {
    const previousValues = decodeFields(
      entry.schema,
      search,
    );
    const patch =
      typeof entry.patch === 'function'
        ? entry.patch(previousValues)
        : entry.patch;

    search = encodeFields(entry.schema, patch, { base: search });
  }

  return {
    pathname: base.pathname,
    search: search.toString(),
  };
};

