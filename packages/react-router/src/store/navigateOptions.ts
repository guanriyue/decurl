import type { SearchNavigateOptions } from '../runtime/types';
import type { PendingEntry } from './types';

export const defaultNavigateOptions: SearchNavigateOptions = {
  replace: true,
};

export const resolveNavigateOptions = (entries: readonly PendingEntry[]): SearchNavigateOptions => {
  const lastEntry = entries.at(-1);

  return {
    ...defaultNavigateOptions,
    ...lastEntry?.options,
  };
};
