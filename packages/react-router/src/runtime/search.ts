import { stripSearchPrefix } from '../_internal/stripSearchPrefix';
import type {
  NavigateSearch,
  SearchLocation,
  SearchLocationLike,
} from './types';

export const toSearchLocation = (
  location: SearchLocationLike,
): SearchLocation => {
  return {
    pathname: location.pathname,
    search: stripSearchPrefix(location.search),
  };
};

export const toNavigateSearch = (location: SearchLocation): NavigateSearch => {
  return `?${location.search}`;
};
