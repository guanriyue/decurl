import { useLayoutEffect, useMemo } from 'react';
import type { NamedFieldCodec, RecordCodec } from './codec';
import { useRequiredContextStore } from './react/SearchStateContext';
import { useConfigureRuntime } from './react/useConfigureRuntime';
import type { UseSearchValueResult } from './react/useSearchValue';
import { useSearchValueStore } from './react/useSearchValue';
import type { UseSearchValuesResult } from './react/useSearchValues';
import { useSearchValuesStore } from './react/useSearchValues';
import {
  createReactRouterInstanceRuntime,
  type ReactRouterInstance,
} from './runtime/reactRouterRuntime';
import type { SearchStore } from './store/types';

const searchProviderName = '<SearchProvider>';

/**
 * Props for {@link SearchRuntimeConnector}.
 */
export type SearchRuntimeConnectorProps = {
  /**
   * React Router Data Router instance used by `<RouterProvider>`.
   *
   * Pass this when the provider is rendered outside the routed tree and cannot use
   * React Router hooks to read location and navigation capabilities.
   */
  router?: ReactRouterInstance;
};

/**
 * Reads and writes one search field from the store provided by the main-entry `SearchProvider`.
 *
 * This hook does not configure React Router runtime by itself. It throws when rendered
 * outside `<SearchProvider>`.
 */
export const useProvidedSearchValue = <TCodec extends NamedFieldCodec>(
  codec: TCodec,
): UseSearchValueResult<TCodec> => {
  const store = useRequiredContextStore('useProvidedSearchValue', searchProviderName);

  return useSearchValueStore(store, codec);
};

/**
 * Reads and writes multiple search fields from the store provided by the main-entry
 * `SearchProvider`.
 *
 * This hook does not configure React Router runtime by itself. It throws when rendered
 * outside `<SearchProvider>`.
 */
export const useProvidedSearchValues = <TDefinition extends RecordCodec>(
  recordCodec: TDefinition,
): UseSearchValuesResult<TDefinition> => {
  const store = useRequiredContextStore('useProvidedSearchValues', searchProviderName);

  return useSearchValuesStore(store, recordCodec);
};

const HookRuntimeConnector = (): null => {
  useConfigureRuntime();

  return null;
};

type RouterInstanceRuntimeConnectorProps = {
  router: ReactRouterInstance;
  store: SearchStore;
};

const RouterInstanceRuntimeConnector = ({
  router,
  store,
}: RouterInstanceRuntimeConnectorProps): null => {
  const runtime = useMemo(() => {
    return createReactRouterInstanceRuntime(router);
  }, [router]);

  store.configureRuntime(runtime);

  useLayoutEffect(() => {
    return runtime.subscribe?.((location) => {
      store.locationChanged(location);
    });
  }, [runtime, store]);

  return null;
};

/**
 * Wires the nearest main-entry `SearchProvider` store to React Router.
 *
 * Render this once inside `SearchProvider`, before any component that calls
 * `useProvidedSearchValue` or `useProvidedSearchValues`. Omit `router` for component
 * routers such as `<BrowserRouter>`, or pass a Data Router instance when using
 * `<RouterProvider>`.
 */
export const SearchRuntimeConnector = ({
  router,
}: SearchRuntimeConnectorProps): React.ReactElement => {
  const store = useRequiredContextStore('SearchRuntimeConnector', searchProviderName);

  if (typeof router === 'undefined') {
    return <HookRuntimeConnector />;
  }

  return <RouterInstanceRuntimeConnector router={router} store={store} />;
};
