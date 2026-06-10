/**
 * @vitest-environment jsdom
 */

import type {
  NamedFieldCodec,
  SingleRequiredFieldCodec,
} from '@decurl/core/codec';
import { act, cleanup, render, screen } from '@testing-library/react';
import {
  createMemoryRouter,
  MemoryRouter,
  RouterProvider,
  useLocation,
} from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactRouterSearch } from './configured';
import { createReactRouterSearch } from './configured';
import type { SetSearchValue } from './react/useSearchValue';

const pageCodec = {
  name: 'page',
  decode: (input) => Number(input),
  defaultValue: 1,
} satisfies NamedFieldCodec<SingleRequiredFieldCodec<number>>;

describe('createReactRouterSearch', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('uses the bound Provider to connect hooks with React Router', () => {
    const search = createReactRouterSearch();

    renderWithRouter(search, <PageView search={search} />, {
      initialEntry: '/users?page=2',
    });

    expect(screen.getByTestId('page').textContent).toBe('2');
  });

  it('does not rerender bound hook consumers when React Router confirms flush', () => {
    vi.useFakeTimers();
    const search = createReactRouterSearch();
    let setPage: SetSearchValue<typeof pageCodec> | undefined;
    let pageRenderCount = 0;

    renderWithRouter(
      search,
      <App>
        <PageView
          search={search}
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

  it('uses a router instance Provider to connect hooks with React Router', async () => {
    vi.useFakeTimers();
    const search = createReactRouterSearch();
    let setPage: SetSearchValue<typeof pageCodec> | undefined;

    const router = createMemoryRouter(
      [
        {
          path: '/users',
          element: (
            <PageView
              search={search}
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
      <search.Provider router={router}>
        <RouterProvider router={router} />
      </search.Provider>,
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
});

type PageViewProps = {
  search: ReactRouterSearch;
  onReady?: (setValue: SetSearchValue<typeof pageCodec>) => void;
  onRender?: () => void;
};

const PageView = ({
  search,
  onReady,
  onRender,
}: PageViewProps): React.ReactElement => {
  const [page, setPage] = search.useSearchValue(pageCodec);
  onReady?.(setPage);
  onRender?.();

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
};

const renderWithRouter = (
  search: ReactRouterSearch,
  children: React.ReactElement,
  { initialEntry }: RenderWithRouterOptions,
) => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <search.Provider>{children}</search.Provider>
    </MemoryRouter>,
  );
};
