import type { FieldCodec } from '@decurl/core/codec';
import { decodeFields, encodeFields } from '@decurl/core/codec';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  SearchLocation,
  SearchNavigateOptions,
  SearchRuntime,
} from '../runtime/types';
import { createSearchStore } from './searchStore';
import type { SearchPatch, SearchStore } from './types';

describe('createSearchStore', () => {
  const schema = {
    keyword: {
      name: 'q',
      decode: (input) => input,
    },
    page: {
      decode: (input) => Number(input),
      defaultValue: 1,
    },
  } satisfies Record<string, FieldCodec>;

  afterEach(() => {
    vi.useRealTimers();
  });

  it('throws when snapshot is read before runtime is configured', () => {
    const store = createSearchStore();

    expect(() => store.getSnapshot()).toThrow(
      '@decurl/react-router store runtime is not configured.',
    );
  });

  it('allows snapshot reads when explicit initial location is provided', () => {
    const store = createSearchStore({
      initialLocation: location('/users', 'page=1'),
    });

    expect(store.getSnapshot().location).toEqual(location('/users', 'page=1'));
  });

  it('hydrates the initial location from runtime without notifying subscribers', () => {
    const store = createSearchStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.configureRuntime({
      getLocation: () => ({
        pathname: '/users',
        search: '?page=2',
      }),
      navigate: vi.fn(),
    });

    expect(store.getSnapshot().location).toEqual(location('/users', 'page=2'));
    expect(listener).not.toHaveBeenCalled();
  });

  it('does not rehydrate location after the store has been initialized', () => {
    const store = createSearchStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.configureRuntime({
      getLocation: () => ({
        pathname: '/users',
        search: '?page=2',
      }),
      navigate: vi.fn(),
    });
    store.configureRuntime({
      getLocation: () => ({
        pathname: '/orders',
        search: '?page=3',
      }),
      navigate: vi.fn(),
    });

    expect(store.getSnapshot().location).toEqual(location('/users', 'page=2'));
    expect(listener).not.toHaveBeenCalled();
  });

  it('normalizes location changes before applying them', () => {
    const store = createSearchStore({
      initialLocation: location('/users', 'page=1'),
    });

    store.locationChanged({
      pathname: '/users',
      search: '?page=2',
    });

    expect(store.getSnapshot().location).toEqual(location('/users', 'page=2'));
  });

  it('updates optimistic location immediately when values are set', () => {
    const store = createSearchStore({
      initialLocation: location('/users', 'page=1&pageSize=20'),
    });
    const listener = vi.fn();
    store.subscribe(listener);

    addValues(store, schema, { keyword: 'decurl' });

    expect(store.getSnapshot().location).toEqual(
      location('/users', 'page=1&pageSize=20&q=decurl'),
    );
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('replays updater patches against intermediate values', () => {
    const store = createSearchStore({
      initialLocation: location('/users', 'page=1'),
    });

    addValues(store, schema, (previousValues) => ({
      page: previousValues.page + 1,
    }));
    addValues(store, schema, (previousValues) => ({
      page: previousValues.page + 1,
    }));

    expect(store.getSnapshot().location.search).toBe('page=3');
  });

  it('flushes optimistic location with resolved navigate options', () => {
    const navigate = vi.fn();
    const store = createSearchStore({
      initialLocation: location('/users', 'page=1'),
    });
    store.configureRuntime(runtime(navigate));

    addValues(store, schema, { page: 2 }, { replace: false });
    addValues(store, schema, { keyword: 'decurl' }, { preventScrollReset: true });
    store.flush();

    expect(navigate).toHaveBeenCalledWith(
      location('/users', 'page=2&q=decurl'),
      {
        replace: true,
        preventScrollReset: true,
      },
    );
  });

  it('flushes pending entries after the default delay', () => {
    vi.useFakeTimers();
    const navigate = vi.fn();
    const store = createSearchStore({
      initialLocation: location('/users', 'page=1'),
    });
    store.configureRuntime(runtime(navigate));

    addValues(store, schema, { page: 2 });

    expect(navigate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(99);
    expect(navigate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(navigate).toHaveBeenCalledWith(location('/users', 'page=2'), {
      replace: true,
    });
  });

  it('uses throttle flush by default and persists combined entries', () => {
    vi.useFakeTimers();
    const navigate = vi.fn();
    const store = createSearchStore({
      initialLocation: location('/users', 'page=1'),
    });
    store.configureRuntime(runtime(navigate));

    addValues(store, schema, { page: 2 });
    vi.advanceTimersByTime(50);
    addValues(store, schema, { keyword: 'decurl' });
    vi.advanceTimersByTime(49);

    expect(navigate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(navigate).toHaveBeenCalledWith(
      location('/users', 'page=2&q=decurl'),
      {
        replace: true,
      },
    );
  });

  it('can use debounce flush when configured', () => {
    vi.useFakeTimers();
    const navigate = vi.fn();
    const store = createSearchStore({
      initialLocation: location('/users', 'page=1'),
      flushMode: 'debounce',
    });
    store.configureRuntime(runtime(navigate));

    addValues(store, schema, { page: 2 });
    vi.advanceTimersByTime(50);
    addValues(store, schema, { keyword: 'decurl' });
    vi.advanceTimersByTime(99);

    expect(navigate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(navigate).toHaveBeenCalledWith(
      location('/users', 'page=2&q=decurl'),
      {
        replace: true,
      },
    );
  });

  it('uses a zero timeout when flushDelay is zero', () => {
    vi.useFakeTimers();
    const navigate = vi.fn();
    const store = createSearchStore({
      initialLocation: location('/users', 'page=1'),
      flushDelay: 0,
    });
    store.configureRuntime(runtime(navigate));

    addValues(store, schema, { page: 2 });
    addValues(store, schema, { keyword: 'decurl' });

    expect(navigate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(0);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(
      location('/users', 'page=2&q=decurl'),
      {
        replace: true,
      },
    );
  });

  it('drops delayed flush when an external location change arrives', () => {
    vi.useFakeTimers();
    const navigate = vi.fn();
    const store = createSearchStore({
      initialLocation: location('/users', 'page=1'),
    });
    store.configureRuntime(runtime(navigate));

    addValues(store, schema, { page: 2 });
    store.locationChanged(location('/users/1', 'tab=profile'));
    vi.advanceTimersByTime(100);

    expect(navigate).not.toHaveBeenCalled();
    expect(store.getSnapshot().location).toEqual(
      location('/users/1', 'tab=profile'),
    );
  });

  it('does not navigate when flush entries are empty', () => {
    const navigate = vi.fn();
    const store = createSearchStore({
      initialLocation: location('/users', 'page=1'),
    });
    store.configureRuntime(runtime(navigate));

    addValues(store, schema, { page: 2 });
    store.flush();
    store.flush();

    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('manual flush cancels scheduled flush', () => {
    vi.useFakeTimers();
    const navigate = vi.fn();
    const store = createSearchStore({
      initialLocation: location('/users', 'page=1'),
    });
    store.configureRuntime(runtime(navigate));

    addValues(store, schema, { page: 2 });
    store.flush();
    vi.advanceTimersByTime(100);

    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('does not notify when flush confirmation keeps optimistic location unchanged', () => {
    const navigate = vi.fn();
    const store = createSearchStore({
      initialLocation: location('/users', 'page=1'),
    });
    store.configureRuntime(runtime(navigate));
    const listener = vi.fn();
    store.subscribe(listener);

    addValues(store, schema, { page: 2 });
    listener.mockClear();
    store.flush();
    store.locationChanged(location('/users', 'page=2'));

    expect(listener).not.toHaveBeenCalled();
  });

  it('does not look back to earlier entry options when the last entry has none', () => {
    const navigate = vi.fn();
    const store = createSearchStore({
      initialLocation: location('/users', 'page=1'),
    });
    store.configureRuntime(runtime(navigate));

    addValues(store, schema, { page: 2 }, { replace: false });
    addValues(store, schema, { keyword: 'decurl' });
    store.flush();

    expect(navigate).toHaveBeenCalledWith(
      location('/users', 'page=2&q=decurl'),
      {
        replace: true,
      },
    );
  });

  it('keeps new pending entries when a previous flush is confirmed', () => {
    const navigate = vi.fn();
    const store = createSearchStore({
      initialLocation: location('/users', 'page=1'),
    });
    store.configureRuntime(runtime(navigate));

    addValues(store, schema, { page: 3 });
    store.flush();
    addValues(store, schema, { page: 4 });
    store.locationChanged(location('/users', 'page=3'));

    expect(store.getSnapshot().location).toEqual(location('/users', 'page=4'));
  });

  it('keeps optimistic location when an older inflight flush is confirmed', () => {
    const navigate = vi.fn();
    const store = createSearchStore({
      initialLocation: location('/users', 'page=1'),
    });
    store.configureRuntime(runtime(navigate));
    const listener = vi.fn();
    store.subscribe(listener);

    addValues(store, schema, { page: 2 });
    store.flush();
    addValues(store, schema, { page: 3 });
    store.flush();
    listener.mockClear();

    store.locationChanged(location('/users', 'page=2'));

    expect(store.getSnapshot().location).toEqual(location('/users', 'page=3'));
    expect(listener).not.toHaveBeenCalled();
  });

  it('replays pending entries from the latest inflight flush when an older inflight flush is confirmed', () => {
    const navigate = vi.fn();
    const store = createSearchStore({
      initialLocation: location('/users', 'page=1'),
    });
    store.configureRuntime(runtime(navigate));

    addValues(store, schema, { page: 2 });
    store.flush();
    addValues(store, schema, { page: 3 });
    store.flush();
    addValues(store, schema, { keyword: 'decurl' });
    store.locationChanged(location('/users', 'page=2'));

    expect(store.getSnapshot().location).toEqual(
      location('/users', 'page=3&q=decurl'),
    );
  });

  it('drops inflight flushes and pending entries when an external location change arrives', () => {
    vi.useFakeTimers();
    const navigate = vi.fn();
    const store = createSearchStore({
      initialLocation: location('/users', 'page=1'),
    });
    store.configureRuntime(runtime(navigate));

    addValues(store, schema, { page: 2 });
    store.flush();
    addValues(store, schema, { page: 3 });
    store.locationChanged(location('/orders', 'tab=active'));
    vi.advanceTimersByTime(100);

    expect(store.getSnapshot().location).toEqual(
      location('/orders', 'tab=active'),
    );
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('drops pending entries when an external location change arrives', () => {
    const store = createSearchStore({
      initialLocation: location('/users', 'page=1'),
    });

    addValues(store, schema, { page: 2 });
    store.locationChanged(location('/users/1', 'tab=profile'));

    expect(store.getSnapshot().location).toEqual(
      location('/users/1', 'tab=profile'),
    );
  });

  it('does not navigate when the optimistic location equals the confirmed location', () => {
    const navigate = vi.fn();
    const store = createSearchStore({
      initialLocation: location('/users', 'page=1'),
    });
    store.configureRuntime(runtime(navigate));

    store.flush();

    expect(navigate).not.toHaveBeenCalled();
  });
});

const location = (pathname: string, search: string): SearchLocation => {
  return { pathname, search };
};

const addValues = <TDefinition extends Record<string, FieldCodec>>(
  store: SearchStore,
  schema: TDefinition,
  patch: SearchPatch<TDefinition>,
  options?: SearchNavigateOptions,
): void => {
  store.addEntry({
    apply: (searchParams) => {
      const previousValues = decodeFields(schema, searchParams);
      const nextPatch =
        typeof patch === 'function' ? patch(previousValues) : patch;

      return encodeFields(schema, nextPatch, { base: searchParams });
    },
    options,
  });
};

const runtime = (
  navigate: (
    location: SearchLocation,
    options: SearchNavigateOptions,
  ) => void,
): SearchRuntime => {
  return {
    getLocation: () => location('/users', 'page=1'),
    navigate,
  };
};
