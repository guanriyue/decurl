export const stripSearchPrefix = (search: string): string => {
  return search.startsWith('?') ? search.slice(1) : search;
};
