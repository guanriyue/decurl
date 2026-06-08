import { stripSearchPrefix } from '../_internal/stripSearchPrefix';
import type { NavigateSearch, SearchLocation } from './types';

export type SearchLocationLike = {
  pathname: string;
  search: string;
};

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
