import { describe, expect, it } from 'vitest';
import type { SearchLocation } from '../runtime/types';
import { resolveNavigateOptions } from './navigateOptions';
import type { PendingEntry } from './types';

describe('resolveNavigateOptions', () => {
  it('uses replace by default', () => {
    expect(resolveNavigateOptions([])).toEqual({
      replace: true,
    });
  });

  it('merges the last entry options with defaults', () => {
    expect(
      resolveNavigateOptions([
        createEntry({ replace: false }),
        createEntry({ preventScrollReset: true }),
      ]),
    ).toEqual({
      replace: true,
      preventScrollReset: true,
    });
  });

  it('uses defaults when the last entry does not provide options', () => {
    expect(
      resolveNavigateOptions([
        createEntry({ replace: false, preventScrollReset: true }),
        createEntry(),
      ]),
    ).toEqual({
      replace: true,
    });
  });
});

const baseLocation: SearchLocation = {
  pathname: '/users',
  search: 'page=1',
};

const createEntry = (
  options?: PendingEntry['options'],
): PendingEntry => {
  return {
    id: 1,
    baseLocation,
    schema: {},
    patch: {},
    options,
  };
};

