/**
 * @vitest-environment jsdom
 */

import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FieldCodec } from '../codec';
import { createSearchStore } from '../store/searchStore';
import type { SearchStore } from '../store/types';
import { SearchStateContext } from './SearchStateContext';
import type { SetSearchValues } from './useSearchValues';
import { useSearchValues } from './useSearchValues';

const paginationSchema = {
  page: {
    decode: (input) => Number(input),
    defaultValue: 1,
  },
  pageSize: {
    decode: (input) => Number(input),
    defaultValue: 20,
  },
} satisfies Record<string, FieldCodec>;

const keywordSchema = {
  keyword: {
    name: 'q',
    decode: (input) => input,
  },
} satisfies Record<string, FieldCodec>;

const searchSchema = {
  keyword: {
    name: 'q',
    decode: (input) => input,
  },
  page: {
    decode: (input) => Number(input),
    defaultValue: 1,
  },
  pageSize: {
    decode: (input) => Number(input),
    defaultValue: 20,
  },
} satisfies Record<string, FieldCodec>;

describe('useSearchValues', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('decodes initial values from React Router location', () => {
    renderWithRouter(<PaginationView />, {
      initialEntry: '/users?page=2&pageSize=50',
    });

    expect(screen.getByTestId('pagination').textContent).toBe('2/50');
  });

  it('updates values optimistically before URL flush', () => {
    vi.useFakeTimers();
    let setPagination: SetSearchValues<typeof paginationSchema> | undefined;

    renderWithRouter(
      <PaginationView
        onReady={(setValues) => {
          setPagination = setValues;
        }}
      />,
      {
        initialEntry: '/users?page=1&pageSize=20',
      },
    );

    act(() => {
      setPagination?.({ page: 2 });
    });

    expect(screen.getByTestId('pagination').textContent).toBe('2/20');
  });

  it('flushes optimistic values to React Router location', () => {
    vi.useFakeTimers();
    let setPagination: SetSearchValues<typeof paginationSchema> | undefined;

    renderWithRouter(
      <App>
        <PaginationView
          onReady={(setValues) => {
            setPagination = setValues;
          }}
        />
        <LocationView />
      </App>,
      {
        initialEntry: '/users?page=1&pageSize=20',
      },
    );

    act(() => {
      setPagination?.({ page: 2 });
    });

    expect(screen.getByTestId('location').textContent).toBe('/users?page=1&pageSize=20');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByTestId('location').textContent).toBe('/users?page=2&pageSize=20');
  });

  it('does not rerender a hook when unrelated selected values are unchanged', () => {
    vi.useFakeTimers();
    let setKeyword: SetSearchValues<typeof keywordSchema> | undefined;
    let paginationRenderCount = 0;

    renderWithRouter(
      <App>
        <PaginationView
          onRender={() => {
            paginationRenderCount += 1;
          }}
        />
        <KeywordView
          onReady={(setValues) => {
            setKeyword = setValues;
          }}
        />
      </App>,
      {
        initialEntry: '/users?page=1&pageSize=20',
      },
    );
    paginationRenderCount = 0;

    act(() => {
      setKeyword?.({ keyword: 'decurl' });
    });

    expect(paginationRenderCount).toBe(0);
  });

  it('clears all schema fields when patch is undefined', () => {
    vi.useFakeTimers();
    let setSearch: SetSearchValues<typeof searchSchema> | undefined;

    renderWithRouter(
      <App>
        <SearchView
          onReady={(setValues) => {
            setSearch = setValues;
          }}
        />
        <LocationView />
      </App>,
      {
        initialEntry: '/users?q=decurl&page=2&pageSize=50&sort=desc',
      },
    );

    act(() => {
      setSearch?.(undefined);
    });

    expect(screen.getByTestId('search').textContent).toBe('/1/20');
    expect(screen.getByTestId('location').textContent).toBe(
      '/users?q=decurl&page=2&pageSize=50&sort=desc',
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByTestId('location').textContent).toBe('/users?sort=desc');
  });

  it('clears all schema fields when updater returns undefined', () => {
    vi.useFakeTimers();
    let setSearch: SetSearchValues<typeof searchSchema> | undefined;

    renderWithRouter(
      <App>
        <SearchView
          onReady={(setValues) => {
            setSearch = setValues;
          }}
        />
        <LocationView />
      </App>,
      {
        initialEntry: '/users?q=decurl&page=2&pageSize=50&sort=desc',
      },
    );

    act(() => {
      setSearch?.(() => undefined);
    });

    expect(screen.getByTestId('search').textContent).toBe('/1/20');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByTestId('location').textContent).toBe('/users?sort=desc');
  });
});

type PaginationViewProps = {
  onReady?: (setValues: SetSearchValues<typeof paginationSchema>) => void;
  onRender?: () => void;
};

const PaginationView = ({ onReady, onRender }: PaginationViewProps): React.ReactElement => {
  const [values, setValues] = useSearchValues(paginationSchema);
  onReady?.(setValues);
  onRender?.();

  return (
    <div data-testid="pagination">
      {values.page}/{values.pageSize}
    </div>
  );
};

type KeywordViewProps = {
  onReady?: (setValues: SetSearchValues<typeof keywordSchema>) => void;
};

const KeywordView = ({ onReady }: KeywordViewProps): React.ReactElement => {
  const [values, setValues] = useSearchValues(keywordSchema);
  onReady?.(setValues);

  return <div data-testid="keyword">{values.keyword ?? ''}</div>;
};

type SearchViewProps = {
  onReady?: (setValues: SetSearchValues<typeof searchSchema>) => void;
};

const SearchView = ({ onReady }: SearchViewProps): React.ReactElement => {
  const [values, setValues] = useSearchValues(searchSchema);
  onReady?.(setValues);

  return (
    <div data-testid="search">
      {values.keyword ?? ''}/{values.page}/{values.pageSize}
    </div>
  );
};

const LocationView = (): React.ReactElement => {
  const location = useLocation();

  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}
    </div>
  );
};

const App = ({ children }: React.PropsWithChildren): React.ReactElement => {
  return <div>{children}</div>;
};

type RenderWithRouterOptions = {
  initialEntry: string;
  store?: SearchStore;
};

const renderWithRouter = (
  children: React.ReactElement,
  { initialEntry, store = createSearchStore() }: RenderWithRouterOptions,
) => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <SearchStateContext.Provider value={{ store }}>{children}</SearchStateContext.Provider>
    </MemoryRouter>,
  );
};
