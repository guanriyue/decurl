/**
 * @vitest-environment jsdom
 */

import { act, cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, MemoryRouter, RouterProvider, useLocation } from 'react-router';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import type { SingleRequiredFieldCodec, WithDefinedFieldName } from './codec';
import { SearchProvider } from './index';
import {
  SearchRuntimeConnector,
  useProvidedSearchValue,
  useProvidedSearchValues,
} from './provided';
import type { SetSearchValue } from './react/useSearchValue';

const pageCodec = {
  name: 'page',
  decode: (input) => Number(input),
  defaultValue: 1,
} satisfies WithDefinedFieldName<SingleRequiredFieldCodec<number>>;

describe('SearchProvider', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('connects provided hooks with React Router', () => {
    renderWithRouter(<PageView />, {
      initialEntry: '/users?page=2',
    });

    expect(screen.getByTestId('page').textContent).toBe('2');
  });

  it('throws when useProvidedSearchValue is rendered without SearchProvider', () => {
    expectMissingSearchProvider(<MissingSearchValueProviderView />, 'useProvidedSearchValue');
  });

  it('throws when useProvidedSearchValues is rendered without SearchProvider', () => {
    expectMissingSearchProvider(<MissingSearchValuesProviderView />, 'useProvidedSearchValues');
  });

  it('throws when useProvidedSearchValue is rendered without SearchRuntimeConnector', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      expect(() => {
        render(
          <MemoryRouter initialEntries={['/users?page=2']}>
            <SearchProvider>
              <PageView />
            </SearchProvider>
          </MemoryRouter>,
        );
      }).toThrow(
        'decurl store runtime is not configured. Call useConfigureRuntime() before reading search state.',
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it('does not rerender provided hook consumers when React Router confirms flush', () => {
    vi.useFakeTimers();
    let setPage: SetSearchValue<typeof pageCodec> | undefined;
    let pageRenderCount = 0;

    renderWithRouter(
      <App>
        <PageView
          onReady={(nextSetPage) => {
            setPage = nextSetPage;
          }}
          onRender={() => {
            pageRenderCount += 1;
          }}
        />
        <LocationView />
      </App>,
      {
        initialEntry: '/users?page=1',
      },
    );
    pageRenderCount = 0;

    act(() => {
      setPage?.(2);
    });

    expect(screen.getByTestId('page').textContent).toBe('2');
    expect(pageRenderCount).toBe(1);

    pageRenderCount = 0;

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByTestId('location').textContent).toBe('/users?page=2');
    expect(pageRenderCount).toBe(0);
  });

  it('uses a router instance to connect provided hooks with React Router', () => {
    vi.useFakeTimers();
    let setPage: SetSearchValue<typeof pageCodec> | undefined;

    const router = createMemoryRouter(
      [
        {
          path: '/users',
          element: (
            <PageView
              onReady={(nextSetPage) => {
                setPage = nextSetPage;
              }}
            />
          ),
        },
      ],
      {
        initialEntries: ['/users?page=5'],
      },
    );

    render(
      <SearchProvider>
        <SearchRuntimeConnector router={router} />
        <RouterProvider router={router} />
      </SearchProvider>,
    );

    expect(screen.getByTestId('page').textContent).toBe('5');

    act(() => {
      setPage?.(6);
    });

    expect(screen.getByTestId('page').textContent).toBe('6');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(router.state.location.search).toBe('?page=6');
  });

  it('uses the configured flush delay', () => {
    vi.useFakeTimers();
    let setPage: SetSearchValue<typeof pageCodec> | undefined;

    renderWithRouter(
      <App>
        <PageView
          onReady={(nextSetPage) => {
            setPage = nextSetPage;
          }}
        />
        <LocationView />
      </App>,
      {
        initialEntry: '/users?page=1',
        flushDelay: 200,
      },
    );

    act(() => {
      setPage?.(2);
    });

    expect(screen.getByTestId('page').textContent).toBe('2');
    expect(screen.getByTestId('location').textContent).toBe('/users?page=1');

    act(() => {
      vi.advanceTimersByTime(199);
    });

    expect(screen.getByTestId('location').textContent).toBe('/users?page=1');

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.getByTestId('location').textContent).toBe('/users?page=2');
  });
});

type PageViewProps = {
  onReady?: (setValue: SetSearchValue<typeof pageCodec>) => void;
  onRender?: () => void;
};

const PageView = ({ onReady, onRender }: PageViewProps): React.ReactElement => {
  const [page, setPage] = useProvidedSearchValue(pageCodec);
  expectTypeOf(page).toEqualTypeOf<number>();
  onReady?.(setPage);
  onRender?.();

  return <div data-testid="page">{page}</div>;
};

const MissingSearchValueProviderView = (): React.ReactElement => {
  useProvidedSearchValue(pageCodec);

  return <div />;
};

const MissingSearchValuesProviderView = (): React.ReactElement => {
  useProvidedSearchValues({ page: pageCodec });

  return <div />;
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
  flushDelay?: number;
};

const renderWithRouter = (
  children: React.ReactElement,
  { initialEntry, flushDelay }: RenderWithRouterOptions,
) => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <SearchProvider flushDelay={flushDelay}>
        <SearchRuntimeConnector />
        {children}
      </SearchProvider>
    </MemoryRouter>,
  );
};

const expectMissingSearchProvider = (element: React.ReactElement, consumerName: string): void => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

  try {
    expect(() => {
      render(<MemoryRouter initialEntries={['/users?page=2']}>{element}</MemoryRouter>);
    }).toThrow(`${consumerName} must be used within <SearchProvider>.`);
  } finally {
    consoleError.mockRestore();
  }
};
