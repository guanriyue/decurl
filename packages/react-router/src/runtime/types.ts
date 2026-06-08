export type SearchLocation = {
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
  getLocation: () => SearchLocation;
  navigate: (
    location: SearchLocation,
    options: SearchNavigateOptions,
  ) => void | Promise<void>;
  subscribe?: (listener: (location: SearchLocation) => void) => Dispose;
};
