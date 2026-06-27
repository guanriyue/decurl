/**
 * @vitest-environment jsdom
 */

import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SingleRequiredFieldCodec, WithDefinedFieldName } from '../codec';
import { createSearchStore } from '../store/searchStore';
import type { SearchStore } from '../store/types';
import { SearchStateContext } from './SearchStateContext';
import type { SetSearchValue } from './useSearchValue';
import { useSearchValue } from './useSearchValue';

const pageCodec = {
  name: ['page_num', 'p'],
  decode: (input) => {
    const value = Number(input);

    return Number.isFinite(value) ? value : undefined;
  },
  defaultValue: 1,
} satisfies WithDefinedFieldName<SingleRequiredFieldCodec<number>>;

describe('useSearchValue', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('decodes value from named field codec aliases', () => {
    renderWithRouter(<PageView />, {
      initialEntry: '/users?p=2',
    });

    expect(screen.getByTestId('page').textContent).toBe('2');
  });

  it('falls back to later aliases when an earlier alias cannot be decoded', () => {
    renderWithRouter(<PageView />, {
      initialEntry: '/users?page_num=bad&p=3',
    });

    expect(screen.getByTestId('page').textContent).toBe('3');
  });

  it('updates optimistically and flushes with the canonical field name', () => {
    vi.useFakeTimers();
    let setPage: SetSearchValue<typeof pageCodec> | undefined;

    renderWithRouter(
      <App>
        <PageView
          onReady={(setValue) => {
            setPage = setValue;
          }}
        />
        <LocationView />
      </App>,
      {
        initialEntry: '/users?tab=profile&p=2',
      },
    );

    act(() => {
      setPage?.((previousValue) => previousValue + 1);
    });

    expect(screen.getByTestId('page').textContent).toBe('3');
    expect(screen.getByTestId('location').textContent).toBe('/users?tab=profile&p=2');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByTestId('location').textContent).toBe('/users?tab=profile&page_num=3');
  });

  it('removes all field aliases when value is null or undefined', () => {
    vi.useFakeTimers();
    let setPage: SetSearchValue<typeof pageCodec> | undefined;

    renderWithRouter(
      <App>
        <PageView
          onReady={(setValue) => {
            setPage = setValue;
          }}
        />
        <LocationView />
      </App>,
      {
        initialEntry: '/users?tab=profile&page_num=3&p=2',
      },
    );

    act(() => {
      setPage?.(undefined);
    });

    expect(screen.getByTestId('page').textContent).toBe('1');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByTestId('location').textContent).toBe('/users?tab=profile');
  });
});

type PageViewProps = {
  onReady?: (setValue: SetSearchValue<typeof pageCodec>) => void;
};

const PageView = ({ onReady }: PageViewProps): React.ReactElement => {
  const [page, setPage] = useSearchValue(pageCodec);
  onReady?.(setPage);

  return <div data-testid="page">{page}</div>;
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
