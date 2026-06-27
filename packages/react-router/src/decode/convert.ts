import type { Decode } from './types';

export const toNumber: Decode<unknown, number> = (input) => {
  const value = Number(input);

  return Number.isFinite(value) ? value : undefined;
};

export const toBoolean: Decode<'true' | 'false' | (string & {}), boolean> = (input) => {
  return input === 'true' ? true : input === 'false' ? false : undefined;
};
