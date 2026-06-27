import { useMemo } from 'react';
import { type CreateSearchStoreOptions, createSearchStore } from '../store/searchStore';
import { SearchStateContext } from './SearchStateContext';

/**
 * Props for {@link SearchProvider}.
 */
export type SearchProviderProps = React.PropsWithChildren<{
  /**
   * Delay in milliseconds before optimistic search updates are flushed to React Router.
   */
  flushDelay?: CreateSearchStoreOptions['flushDelay'];

  /**
   * Scheduling strategy used when multiple search updates are queued before a flush.
   */
  flushMode?: CreateSearchStoreOptions['flushMode'];
}>;

/**
 * Provides an isolated decurl search store.
 *
 * Main-entry hooks such as `useSearchValue` and `useSearchValues` can use this provider
 * to customize store behavior while still configuring React Router runtime themselves.
 */
export const SearchProvider = ({
  children,
  flushDelay,
  flushMode,
}: SearchProviderProps): React.ReactElement => {
  const store = useMemo(() => {
    return createSearchStore({
      flushDelay,
      flushMode,
    });
  }, [flushDelay, flushMode]);
  const contextValue = useMemo(() => ({ store }), [store]);

  return <SearchStateContext.Provider value={contextValue}>{children}</SearchStateContext.Provider>;
};
