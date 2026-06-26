import type { DataRouter } from 'react-router';
import { toNavigateSearch, toSearchLocation } from './search';
import type {
  NavigateSearch,
  SearchLocationLike,
  SearchNavigateOptions,
  SearchRuntime,
} from './types';

export type ReactRouterNavigate = (
  to: NavigateSearch,
  options?: SearchNavigateOptions,
) => void | Promise<void>;

export type ReactRouterRuntimeInput = {
  location: SearchLocationLike;
  navigate: ReactRouterNavigate;
};

export type ReactRouterInstance = Pick<DataRouter, 'navigate' | 'state' | 'subscribe'>;

export const createReactRouterRuntime = ({
  location,
  navigate,
}: ReactRouterRuntimeInput): SearchRuntime => {
  return {
    getLocation: () => toSearchLocation(location),
    navigate: (nextLocation, options) => {
      return navigate(toNavigateSearch(nextLocation), options);
    },
  };
};

export const createReactRouterInstanceRuntime = (router: ReactRouterInstance): SearchRuntime => {
  return {
    getLocation: () => toSearchLocation(router.state.location),
    navigate: (nextLocation, options) => {
      return router.navigate(toNavigateSearch(nextLocation), options);
    },
    subscribe: (listener) => {
      return router.subscribe((state) => {
        listener(toSearchLocation(state.location));
      });
    },
  };
};
