import type { RecordCodec } from '@decurl/core/codec';
import { useLayoutEffect, useMemo } from 'react';
import {
  SearchStateContext,
  type SearchStateContextValue,
} from './react/SearchStateContext';
import { useConfigureRuntimeStore } from './react/useConfigureRuntime';
import type {
  SearchValueCodec,
  SetSearchValue,
  UseSearchValueResult,
} from './react/useSearchValue';
import { useSearchValueStore } from './react/useSearchValue';
import type {
  SetSearchValues,
  UseSearchValuesResult,
} from './react/useSearchValues';
import { useSearchValuesStore } from './react/useSearchValues';
import {
  createReactRouterInstanceRuntime,
  type ReactRouterInstance,
} from './runtime/reactRouterRuntime';
import {
  type CreateSearchStoreOptions,
  createSearchStore,
} from './store/searchStore';
import type { SearchStore } from './store/types';

export type ReactRouterSearchProviderProps = React.PropsWithChildren<{
  router?: ReactRouterInstance;
}>;

export type ReactRouterSearchRuntimeConfigurerProps = {
  router: ReactRouterInstance;
};

export type ReactRouterSearch = {
  /** 当前 factory 绑定的 store。 */
  store: SearchStore;

  /**
   * 将绑定 store 与当前 React Router runtime 接线。
   *
   * 使用 BrowserRouter 等组件式 Router 时，该组件必须在任何消费绑定 hooks
   * 的组件之前渲染。
   */
  RuntimeConfigurer: () => null;

  /**
   * 使用传入的 router instance 将绑定 store 与 React Router runtime 接线。
   */
  RouterRuntimeConfigurer: (
    props: ReactRouterSearchRuntimeConfigurerProps,
  ) => null;

  /**
   * 提供绑定 store 的 provider，并自动完成 React Router runtime 接线。
   *
   * 使用 BrowserRouter 等组件式 Router 时，该组件必须在 Router 内部，并且
   * 包裹所有消费绑定 hooks 的组件。
   *
   * 如果传入 router，则使用 router instance runtime 接线。
   */
  Provider: (props: ReactRouterSearchProviderProps) => React.ReactElement;

  /** Provider 的兼容别名。 */
  ContextProvider: (props: ReactRouterSearchProviderProps) => React.ReactElement;

  /** 使用绑定 store 的多字段 search values hook，不会自动配置 runtime。 */
  useSearchValues: <TDefinition extends RecordCodec>(
    schema: TDefinition,
  ) => UseSearchValuesResult<TDefinition>;

  /** 使用绑定 store 的单字段 search value hook，不会自动配置 runtime。 */
  useSearchValue: <TCodec extends SearchValueCodec>(
    codec: TCodec,
  ) => UseSearchValueResult<TCodec>;
};

export type CreateReactRouterSearchOptions = CreateSearchStoreOptions;

export type {
  SetSearchValue,
  SetSearchValues,
  UseSearchValueResult,
  UseSearchValuesResult,
};

export const createReactRouterSearch = (
  options: CreateReactRouterSearchOptions = {},
): ReactRouterSearch => {
  const store = createSearchStore(options);
  const contextValue: SearchStateContextValue = { store };

  const RuntimeConfigurer = (): null => {
    useConfigureRuntimeStore(store);

    return null;
  };

  const RouterRuntimeConfigurer = ({
    router,
  }: ReactRouterSearchRuntimeConfigurerProps): null => {
    const runtime = useMemo(() => {
      return createReactRouterInstanceRuntime(router);
    }, [router]);

    store.configureRuntime(runtime);

    useLayoutEffect(() => {
      return runtime.subscribe?.((location) => {
        store.locationChanged(location);
      });
    }, [runtime]);

    return null;
  };

  const Provider = ({
    children,
    router,
  }: ReactRouterSearchProviderProps): React.ReactElement => {
    return (
      <SearchStateContext.Provider value={contextValue}>
        {typeof router === 'undefined' ? (
          <RuntimeConfigurer />
        ) : (
          <RouterRuntimeConfigurer router={router} />
        )}
        {children}
      </SearchStateContext.Provider>
    );
  };

  return {
    store,
    RuntimeConfigurer,
    RouterRuntimeConfigurer,
    Provider,
    ContextProvider: Provider,
    useSearchValues: (schema) => useSearchValuesStore(store, schema),
    useSearchValue: (codec) => useSearchValueStore(store, codec),
  };
};
