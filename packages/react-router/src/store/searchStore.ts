import { toSearchLocation } from '../runtime/search';
import type { SearchLocation, SearchRuntime } from '../runtime/types';
import { createFlushScheduler, type FlushSchedulerMode } from './flushScheduler';
import { resolveNavigateOptions } from './navigateOptions';
import type { PendingEntry, SearchStore, SearchStoreSnapshot, SearchStoreState } from './types';

const initialLocation: SearchLocation = {
  pathname: '/',
  search: '',
};

const defaultFlushDelay = 100;
const defaultFlushMode: FlushSchedulerMode = 'throttle';
const unconfiguredRuntimeMessage =
  '@decurl/react-router store runtime is not configured. Call useConfigureRuntime() before reading search state.';

export type CreateSearchStoreOptions = {
  initialLocation?: SearchLocation;
  flushDelay?: number;
  /**
   * Flush 调度模式。
   *
   * 默认使用 throttle，避免持续更新时 URL 一直无法持久化。
   */
  flushMode?: FlushSchedulerMode;
};

export const createSearchStore = (options: CreateSearchStoreOptions = {}): SearchStore => {
  const confirmedLocation = options.initialLocation ?? initialLocation;
  let isLocationInitialized = typeof options.initialLocation !== 'undefined';
  let runtime: SearchRuntime | undefined;
  let nextEntryId = 0;
  let inflightFlushes: string[] = [];
  let state: SearchStoreState = {
    confirmedLocation,
    optimisticLocation: confirmedLocation,
    pendingEntries: [],
  };
  const listeners = new Set<() => void>();

  const getSnapshotFromState = (): SearchStoreSnapshot => {
    assertRuntimeConfigured();

    return {
      location: state.optimisticLocation,
    };
  };

  const assertRuntimeConfigured = (): void => {
    if (!isLocationInitialized) {
      throw new Error(unconfiguredRuntimeMessage);
    }
  };

  const notify = (): void => {
    for (const listener of listeners) {
      listener();
    }
  };

  const setOptimisticLocation = (location: SearchLocation): void => {
    if (isSameLocation(state.optimisticLocation, location)) {
      return;
    }

    state = {
      ...state,
      optimisticLocation: location,
    };
    notify();
  };

  const applyEntryToLocation = (location: SearchLocation, entry: PendingEntry): SearchLocation => {
    const searchParams = entry.apply(new URLSearchParams(location.search));

    return {
      pathname: location.pathname,
      search: searchParams.toString(),
    };
  };

  const getLatestInflightFlushLocation = (): SearchLocation | undefined => {
    const search = inflightFlushes.at(-1);

    if (typeof search === 'undefined') {
      return undefined;
    }

    return {
      pathname: state.confirmedLocation.pathname,
      search,
    };
  };

  const consumeInflightSearch = (search: string): boolean => {
    const index = inflightFlushes.lastIndexOf(search);

    if (index < 0) {
      return false;
    }

    inflightFlushes = inflightFlushes.slice(index + 1);
    return true;
  };

  const flush = (): void => {
    flushScheduler.cancel();

    if (typeof runtime === 'undefined') {
      return;
    }

    const flushEntries = state.pendingEntries;

    if (flushEntries.length === 0) {
      return;
    }

    if (isSameLocation(state.optimisticLocation, state.confirmedLocation)) {
      return;
    }

    const flushTarget = state.optimisticLocation;
    const resolvedOptions = resolveNavigateOptions(flushEntries);

    inflightFlushes = [...inflightFlushes, flushTarget.search];
    state = {
      ...state,
      pendingEntries: [],
    };
    void runtime.navigate(flushTarget, resolvedOptions);
  };

  const flushScheduler = createFlushScheduler({
    delay: options.flushDelay ?? defaultFlushDelay,
    mode: options.flushMode ?? defaultFlushMode,
    flush,
  });

  const store: SearchStore = {
    getSnapshot: getSnapshotFromState,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    configureRuntime: (nextRuntime) => {
      runtime = nextRuntime;

      if (isLocationInitialized) {
        return;
      }

      const location = toSearchLocation(nextRuntime.getLocation());
      state = {
        confirmedLocation: location,
        optimisticLocation: location,
        pendingEntries: [],
      };
      inflightFlushes = [];
      isLocationInitialized = true;
    },
    locationChanged: (nextLocation) => {
      const location = toSearchLocation(nextLocation);
      const reset = (): void => {
        flushScheduler.cancel();
        state = {
          confirmedLocation: location,
          optimisticLocation: location,
          pendingEntries: [],
        };
        inflightFlushes = [];
        notify();
      };

      if (location.pathname !== state.confirmedLocation.pathname) {
        reset();
        return;
      }

      if (consumeInflightSearch(location.search)) {
        state = {
          ...state,
          confirmedLocation: location,
        };
        return;
      }

      if (location.search === state.confirmedLocation.search) {
        return;
      }

      reset();
    },
    addEntry: (entryOptions) => {
      const baseLocation = getLatestInflightFlushLocation() ?? state.confirmedLocation;
      const entry: PendingEntry = {
        id: ++nextEntryId,
        baseLocation,
        apply: entryOptions.apply,
        options: entryOptions.options,
      };

      state = {
        ...state,
        pendingEntries: [...state.pendingEntries, entry],
      };
      setOptimisticLocation(applyEntryToLocation(state.optimisticLocation, entry));
      flushScheduler.schedule();
    },
    flush,
  };

  if (process.env.NODE_ENV === 'test') {
    Object.defineProperty(store, '__debug', {
      value: () => ({
        state: {
          ...state,
          pendingEntries: [...state.pendingEntries],
        },
        inflightFlushes: [...inflightFlushes],
        latestInflightFlushLocation: getLatestInflightFlushLocation(),
      }),
    });
  }

  return store;
};

const isSameLocation = (left: SearchLocation, right: SearchLocation): boolean => {
  return left.pathname === right.pathname && left.search === right.search;
};
