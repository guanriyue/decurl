/**
 * @vitest-environment jsdom
 */

import { act, cleanup, render, screen } from '@testing-library/react';
import { useLayoutEffect } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SingleRequiredFieldCodec } from '../codec';
import { SearchStateContext } from '../react/SearchStateContext';
import { createSearchStore } from '../store/searchStore';
import type { SearchStore } from '../store/types';
import type {
  SearchPaginationFields,
  SearchPaginationTotalSource,
  UseSearchPaginationOptions,
  UseSearchPaginationResult,
} from './useSearchPagination';
import { useSearchPagination } from './useSearchPagination';

describe('useSearchPagination', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('在 Hook 上暴露默认 fields 和 pageSizeOptions', () => {
    expect(useSearchPagination.pageSizeOptions).toEqual([10, 20, 50, 100]);
    expect(useSearchPagination.fields.page.defaultValue).toBe(1);
    expect(useSearchPagination.fields.pageSize.defaultValue).toBe(10);
  });

  it('默认 fields 会解析去除空白后的严格正整数', () => {
    renderWithRouter(
      <App>
        <PaginationView />
      </App>,
      {
        initialEntry: '/users?page=%202%20&pageSize=%2050%20',
      },
    );

    expect(screen.getByTestId('pagination').textContent).toBe('2/50');
  });

  it('默认 fields 会拒绝非严格正整数格式', () => {
    renderWithRouter(
      <App>
        <PaginationView />
      </App>,
      {
        initialEntry: '/users?page=01&pageSize=1e2',
      },
    );

    expect(screen.getByTestId('pagination').textContent).toBe('1/10');
  });

  it('默认 fields 会拒绝不在默认选项中的 pageSize', () => {
    renderWithRouter(
      <App>
        <PaginationView />
      </App>,
      {
        initialEntry: '/users?page=2&pageSize=25',
      },
    );

    expect(screen.getByTestId('pagination').textContent).toBe('2/10');
  });

  it('setPage 只更新页码', () => {
    vi.useFakeTimers();
    let pagination: UseSearchPaginationResult | undefined;

    renderWithRouter(
      <App>
        <PaginationView
          onReady={(nextPagination) => {
            pagination = nextPagination;
          }}
        />
        <LocationView />
      </App>,
      {
        initialEntry: '/users?page=2&pageSize=20',
      },
    );

    act(() => {
      pagination?.setPage(3);
    });

    expect(screen.getByTestId('pagination').textContent).toBe('3/20');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByTestId('location').textContent).toBe('/users?page=3&pageSize=20');
  });

  it('resetPage 会把页码重置为 1', () => {
    vi.useFakeTimers();
    let pagination: UseSearchPaginationResult | undefined;

    renderWithRouter(
      <App>
        <PaginationView
          onReady={(nextPagination) => {
            pagination = nextPagination;
          }}
        />
        <LocationView />
      </App>,
      {
        initialEntry: '/users?page=3&pageSize=20',
      },
    );

    act(() => {
      pagination?.resetPage();
    });

    expect(screen.getByTestId('pagination').textContent).toBe('1/20');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByTestId('location').textContent).toBe('/users?pageSize=20');
  });

  it('setPageSize 默认把页码重置为 1', () => {
    vi.useFakeTimers();
    let pagination: UseSearchPaginationResult | undefined;

    renderWithRouter(
      <App>
        <PaginationView
          onReady={(nextPagination) => {
            pagination = nextPagination;
          }}
        />
        <LocationView />
      </App>,
      {
        initialEntry: '/users?page=3&pageSize=20',
      },
    );

    act(() => {
      pagination?.setPageSize(50);
    });

    expect(screen.getByTestId('pagination').textContent).toBe('1/50');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByTestId('location').textContent).toBe('/users?pageSize=50');
  });

  it('可以通过 options 在 pageSize 变化时保留 item offset', () => {
    vi.useFakeTimers();
    let pagination: UseSearchPaginationResult | undefined;

    renderWithRouter(
      <App>
        <PaginationView
          options={{ pageSizeChangeStrategy: 'preserve-offset' }}
          onReady={(nextPagination) => {
            pagination = nextPagination;
          }}
        />
        <LocationView />
      </App>,
      {
        initialEntry: '/users?page=3&pageSize=10',
      },
    );

    act(() => {
      pagination?.setPageSize(20);
    });

    expect(screen.getByTestId('pagination').textContent).toBe('2/20');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByTestId('location').textContent).toBe('/users?page=2&pageSize=20');
  });

  it('setPagination 修改 pageSize 时不应用联动策略', () => {
    let pagination: UseSearchPaginationResult | undefined;

    renderWithRouter(
      <App>
        <PaginationView
          options={{ pageSizeChangeStrategy: 'reset' }}
          onReady={(nextPagination) => {
            pagination = nextPagination;
          }}
        />
      </App>,
      {
        initialEntry: '/users?page=3&pageSize=10',
      },
    );

    act(() => {
      pagination?.setPagination({ pageSize: 20 });
    });

    expect(screen.getByTestId('pagination').textContent).toBe('3/20');
  });

  it('setPagination 区分空 patch 和显式 undefined', () => {
    let pagination: UseSearchPaginationResult | undefined;

    renderWithRouter(
      <App>
        <PaginationView
          onReady={(nextPagination) => {
            pagination = nextPagination;
          }}
        />
      </App>,
      {
        initialEntry: '/users?page=3&pageSize=20',
      },
    );

    act(() => {
      pagination?.setPagination({});
    });

    expect(screen.getByTestId('pagination').textContent).toBe('3/20');

    act(() => {
      pagination?.setPagination({ page: undefined });
    });

    expect(screen.getByTestId('pagination').textContent).toBe('1/20');
  });

  it('支持自定义 fields 读取和写入不同的 URL key', () => {
    vi.useFakeTimers();
    let pagination: UseSearchPaginationResult | undefined;

    renderWithRouter(
      <App>
        <PaginationView
          fields={customFields}
          onReady={(nextPagination) => {
            pagination = nextPagination;
          }}
        />
        <LocationView />
      </App>,
      {
        initialEntry: '/users?p=2&size=25',
      },
    );

    expect(screen.getByTestId('pagination').textContent).toBe('2/25');

    act(() => {
      pagination?.setPagination({ page: 3, pageSize: 50 });
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByTestId('location').textContent).toBe('/users?p=3&size=50');
  });

  it('自定义 fields 场景不会使用默认 pageSizeOptions 校验 pageSize', () => {
    renderWithRouter(
      <App>
        <PaginationView fields={customFields} />
      </App>,
      {
        initialEntry: '/users?p=2&size=25',
      },
    );

    expect(screen.getByTestId('pagination').textContent).toBe('2/25');
  });

  it('固定 pageSize 不阻止 setPageSize 提交 page 联动 patch', () => {
    let pagination: UseSearchPaginationResult | undefined;

    renderWithRouter(
      <App>
        <PaginationView
          fields={fixedPageSizeFields}
          options={{ pageSizeChangeStrategy: 'preserve-offset' }}
          onReady={(nextPagination) => {
            pagination = nextPagination;
          }}
        />
      </App>,
      {
        initialEntry: '/users?p=3&size=20',
      },
    );

    act(() => {
      pagination?.setPageSize(10);
    });

    // page patch 使用调用参数 10 计算，pageSize 最终仍由 codec 回退为 20。
    expect(screen.getByTestId('pagination').textContent).toBe('5/20');
  });

  it('preventOverflow 会把越界页码回退到最大页', () => {
    vi.useFakeTimers();
    let pagination: UseSearchPaginationResult | undefined;

    renderWithRouter(
      <App>
        <PaginationView
          onReady={(nextPagination) => {
            pagination = nextPagination;
          }}
        />
        <LocationView />
      </App>,
      {
        initialEntry: '/users?page=5&pageSize=20',
      },
    );

    act(() => {
      pagination?.preventOverflow(41);
    });

    expect(screen.getByTestId('pagination').textContent).toBe('3/20');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByTestId('location').textContent).toBe('/users?page=3&pageSize=20');
  });

  it('preventOverflow 支持包含 total 的对象', () => {
    let pagination: UseSearchPaginationResult | undefined;

    renderWithRouter(
      <App>
        <PaginationView
          onReady={(nextPagination) => {
            pagination = nextPagination;
          }}
        />
      </App>,
      {
        initialEntry: '/users?page=5&pageSize=20',
      },
    );

    act(() => {
      pagination?.preventOverflow({ total: 41 });
    });

    expect(screen.getByTestId('pagination').textContent).toBe('3/20');
  });

  it.each<[string, SearchPaginationTotalSource]>([
    ['null', null],
    ['undefined', undefined],
    ['对象中的 null', { total: null }],
    ['对象中的 undefined', { total: undefined }],
  ])('preventOverflow 接收 %s 时不提交修正', (_, totalSource) => {
    let pagination: UseSearchPaginationResult | undefined;

    renderWithRouter(
      <App>
        <PaginationView
          onReady={(nextPagination) => {
            pagination = nextPagination;
          }}
        />
      </App>,
      {
        initialEntry: '/users?page=5&pageSize=20',
      },
    );

    act(() => {
      pagination?.preventOverflow(totalSource);
    });

    expect(screen.getByTestId('pagination').textContent).toBe('5/20');
  });

  it.each<[string, number]>([
    ['负数', -1],
    ['小数', 1.5],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
  ])('preventOverflow 接收非法 total：%s 时不提交修正', (_, total) => {
    let pagination: UseSearchPaginationResult | undefined;

    renderWithRouter(
      <App>
        <PaginationView
          onReady={(nextPagination) => {
            pagination = nextPagination;
          }}
        />
      </App>,
      {
        initialEntry: '/users?page=5&pageSize=20',
      },
    );

    act(() => {
      pagination?.preventOverflow(total);
    });

    expect(screen.getByTestId('pagination').textContent).toBe('5/20');
  });

  it('preventOverflow 在 total 为 0 时回退到第 1 页', () => {
    let pagination: UseSearchPaginationResult | undefined;

    renderWithRouter(
      <App>
        <PaginationView
          onReady={(nextPagination) => {
            pagination = nextPagination;
          }}
        />
      </App>,
      {
        initialEntry: '/users?page=5&pageSize=20',
      },
    );

    act(() => {
      pagination?.preventOverflow(0);
    });

    expect(screen.getByTestId('pagination').textContent).toBe('1/20');
  });

  it('preventOverflow 在当前页未溢出时不更新引用', () => {
    const records: UseSearchPaginationResult[] = [];

    renderWithRouter(
      <App>
        <PaginationView
          onReady={(pagination) => {
            records.push(pagination);
          }}
        />
      </App>,
      {
        initialEntry: '/users?page=2&pageSize=20',
      },
    );

    act(() => {
      records[0].preventOverflow(100);
    });

    expect(records).toHaveLength(1);
  });

  it('返回的操作函数在重新渲染后保持引用稳定', () => {
    const records: UseSearchPaginationResult[] = [];

    renderWithRouter(
      <App>
        <PaginationView
          onReady={(pagination) => {
            records.push(pagination);
          }}
        />
      </App>,
      {
        initialEntry: '/users?page=1&pageSize=10',
      },
    );

    act(() => {
      records.at(-1)?.setPage(2);
    });

    expect(records).toHaveLength(2);
    expect(records[1].setPage).toBe(records[0].setPage);
    expect(records[1].resetPage).toBe(records[0].resetPage);
    expect(records[1].setPageSize).toBe(records[0].setPageSize);
    expect(records[1].setPagination).toBe(records[0].setPagination);
    expect(records[1].preventOverflow).toBe(records[0].preventOverflow);
  });
});

type PaginationViewProps = {
  fields?: SearchPaginationFields;
  options?: UseSearchPaginationOptions;
  onReady?: (pagination: UseSearchPaginationResult) => void;
};

const PaginationView = ({ fields, options, onReady }: PaginationViewProps): React.ReactElement => {
  const pagination =
    typeof fields === 'undefined'
      ? // biome-ignore lint/correctness/useHookAtTopLevel: 方便测试
        useSearchPagination(options)
      : // biome-ignore lint/correctness/useHookAtTopLevel: 方便测试
        useSearchPagination(fields, options);

  // 避免在 render 阶段把 action 暴露出去后立刻调用。
  useLayoutEffect(() => {
    onReady?.(pagination);
  });

  return (
    <div data-testid="pagination">
      {pagination.page}/{pagination.pageSize}
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

const decodePositiveInteger: SingleRequiredFieldCodec<number>['decode'] = (input) => {
  const value = input.trim();

  if (!/^[1-9][0-9]*$/.test(value)) {
    return undefined;
  }

  const numberValue = Number(value);

  return Number.isSafeInteger(numberValue) ? numberValue : undefined;
};

const customFields = {
  page: {
    name: 'p',
    decode: decodePositiveInteger,
    defaultValue: 1,
  },
  pageSize: {
    name: 'size',
    decode: decodePositiveInteger,
    defaultValue: 25,
  },
} satisfies SearchPaginationFields;

const fixedPageSizeFields = {
  page: customFields.page,
  pageSize: {
    name: 'size',
    decode: (input: string) => {
      return input === '20' ? 20 : undefined;
    },
    defaultValue: 20,
  },
} satisfies SearchPaginationFields;
