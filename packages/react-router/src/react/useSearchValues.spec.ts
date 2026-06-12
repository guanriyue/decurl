/**
 * @vitest-environment jsdom
 */

import type { FieldCodec } from '@decurl/core/codec';
import { act, cleanup, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

describe('useSearchValues', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('decodes initial values from React Router location', () => {
    renderWithRouter(createElement(PaginationView), {
      initialEntry: '/users?page=2&pageSize=50',
    });

    expect(screen.getByTestId('pagination').textContent).toBe('2/50');
  });

  it('updates values optimistically before URL flush', () => {
    vi.useFakeTimers();
    let setPagination: SetSearchValues<typeof paginationSchema> | undefined;

    renderWithRouter(
      createElement(PaginationView, {
        onReady: (setValues) => {
          setPagination = setValues;
        },
      }),
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
      createElement(
        App,
        {},
        createElement(PaginationView, {
          onReady: (setValues) => {
            setPagination = setValues;
          },
        }),
        createElement(LocationView),
      ),
      {
        initialEntry: '/users?page=1&pageSize=20',
      },
    );

    act(() => {
      setPagination?.({ page: 2 });
    });

    expect(screen.getByTestId('location').textContent).toBe(
      '/users?page=1&pageSize=20',
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByTestId('location').textContent).toBe(
      '/users?page=2&pageSize=20',
    );
  });

  it('does not rerender a hook when unrelated selected values are unchanged', () => {
    vi.useFakeTimers();
    let setKeyword: SetSearchValues<typeof keywordSchema> | undefined;
    let paginationRenderCount = 0;

    renderWithRouter(
      createElement(
        App,
        {},
        createElement(PaginationView, {
          onRender: () => {
            paginationRenderCount += 1;
          },
        }),
        createElement(KeywordView, {
          onReady: (setValues) => {
            setKeyword = setValues;
          },
        }),
      ),
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
});

type PaginationViewProps = {
  onReady?: (setValues: SetSearchValues<typeof paginationSchema>) => void;
  onRender?: () => void;
};

const PaginationView = ({
  onReady,
  onRender,
}: PaginationViewProps): React.ReactElement => {
  const [values, setValues] = useSearchValues(paginationSchema);
  onReady?.(setValues);
  onRender?.();

  return createElement(
    'div',
    { 'data-testid': 'pagination' },
    `${values.page}/${values.pageSize}`,
  );
};

type KeywordViewProps = {
  onReady?: (setValues: SetSearchValues<typeof keywordSchema>) => void;
};

const KeywordView = ({ onReady }: KeywordViewProps): React.ReactElement => {
  const [values, setValues] = useSearchValues(keywordSchema);
  onReady?.(setValues);

  return createElement(
    'div',
    { 'data-testid': 'keyword' },
    values.keyword ?? '',
  );
};

const LocationView = (): React.ReactElement => {
  const location = useLocation();

  return createElement(
    'div',
    { 'data-testid': 'location' },
    `${location.pathname}${location.search}`,
  );
};

const App = ({ children }: React.PropsWithChildren): React.ReactElement => {
  return createElement('div', {}, children);
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
    createElement(
      MemoryRouter,
      { initialEntries: [initialEntry] },
      createElement(
        SearchStateContext.Provider,
        { value: { store } },
        children,
      ),
    ),
  );
};
