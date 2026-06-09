import type { RecordCodec } from '@decurl/core/codec';
import { toSearchLocation } from '../runtime/search';
import type { SearchLocation, SearchRuntime } from '../runtime/types';
import {
  createFlushScheduler,
  type FlushSchedulerMode,
} from './flushScheduler';
import { resolveNavigateOptions } from './navigateOptions';
import { replay } from './replay';
import type {
  PendingEntry,
  SearchStore,
  SearchStoreSnapshot,
  SearchStoreState,
} from './types';

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

export const createSearchStore = (
  options: CreateSearchStoreOptions = {},
): SearchStore => {
  const confirmedLocation = options.initialLocation ?? initialLocation;
  let isLocationInitialized = typeof options.initialLocation !== 'undefined';
  let runtime: SearchRuntime | undefined;
  let nextEntryId = 0;
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

  const recomputeOptimisticLocation = (): void => {
    const base = state.inflightFlush ?? state.confirmedLocation;
    setOptimisticLocation(replay(base, state.pendingEntries));
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

    state = {
      ...state,
      inflightFlush: flushTarget,
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
      isLocationInitialized = true;
    },
    locationChanged: (nextLocation) => {
      const location = toSearchLocation(nextLocation);

      if (
        typeof state.inflightFlush !== 'undefined' &&
        isSameLocation(state.inflightFlush, location)
      ) {
        state = {
          ...state,
          confirmedLocation: location,
          inflightFlush: undefined,
        };
        recomputeOptimisticLocation();
        return;
      }

      flushScheduler.cancel();
      state = {
        confirmedLocation: location,
        optimisticLocation: location,
        pendingEntries: [],
      };
      notify();
    },
    setValues: (schema, patch, entryOptions) => {
      const baseLocation = state.inflightFlush ?? state.confirmedLocation;
      const entry: PendingEntry<RecordCodec> = {
        id: ++nextEntryId,
        baseLocation,
        schema,
        patch,
        options: entryOptions,
      };

      state = {
        ...state,
        pendingEntries: [...state.pendingEntries, entry],
      };
      recomputeOptimisticLocation();
      flushScheduler.schedule();
    },
    flush,
  };

  return store;
};

const isSameLocation = (
  left: SearchLocation,
  right: SearchLocation,
): boolean => {
  return left.pathname === right.pathname && left.search === right.search;
};
