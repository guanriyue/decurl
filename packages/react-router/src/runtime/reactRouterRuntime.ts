import {
  type SearchLocationLike,
  toNavigateSearch,
  toSearchLocation,
} from './search';
import type {
  NavigateSearch,
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
