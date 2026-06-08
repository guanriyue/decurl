export type SearchLocation = {
  pathname: string;
  search: string;
};

export type SearchLocationLike = {
  pathname: string;
  search: string;
};

export type NavigateSearch = `?${string}`;

export type SearchNavigateOptions = {
  replace?: boolean;
  preventScrollReset?: boolean;
};

type Dispose = () => void;

export type SearchRuntime = {
  getLocation: () => SearchLocationLike;
  navigate: (
    location: SearchLocation,
    options: SearchNavigateOptions,
  ) => void | Promise<void>;
  subscribe?: (listener: (location: SearchLocationLike) => void) => Dispose;
};
