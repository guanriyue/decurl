import type { SearchLocation, SearchRuntime } from '../runtime/types';
import type { SearchStore, SearchStoreSnapshot } from './types';

const initialLocation: SearchLocation = {
  pathname: '/',
  search: '',
};

export const createSearchStore = (): SearchStore => {
  let runtime: SearchRuntime | undefined;
  let snapshot: SearchStoreSnapshot = {
    location: initialLocation,
  };
  const listeners = new Set<() => void>();

  const notify = (): void => {
    for (const listener of listeners) {
      listener();
    }
  };

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    configureRuntime: (nextRuntime) => {
      runtime = nextRuntime;
    },
    locationChanged: (location) => {
      snapshot = { location };
      notify();
    },
    setValues: () => {
      throw new Error('useSearchState store is not implemented yet.');
    },
    flush: () => {
      void runtime;
    },
  };
};

