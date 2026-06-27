import { useSearchPagination } from '@guanriyue/decurl/pagination';
import { useEffect } from 'react';
import { useLocation } from 'react-router';

import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const items = Array.from({ length: 123 }, (_, index) => index + 1);

const toSearchText = (search: string): string => {
  return search.length > 0 ? search : '(empty)';
};

const getVisiblePages = (page: number, pageCount: number): number[] => {
  const start = Math.max(1, page - 1);
  const end = Math.min(pageCount, page + 1);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

const UseSearchPaginationDemo = () => {
  const location = useLocation();
  const pagination = useSearchPagination();
  const pageCount = Math.max(1, Math.ceil(items.length / pagination.pageSize));
  const page = Math.min(pagination.page, pageCount);
  const startIndex = (page - 1) * pagination.pageSize;
  const currentItems = items.slice(
    startIndex,
    startIndex + pagination.pageSize,
  );
  const visiblePages = getVisiblePages(page, pageCount);
  const currentHref = `${location.pathname}${location.search}`;

  useEffect(() => {
    pagination.preventOverflow(items.length);
  }, [pagination.preventOverflow]);

  const updatePage = (nextPage: number) => {
    pagination.setPage(Math.min(Math.max(nextPage, 1), pageCount));
  };

  return (
    <section className="mx-auto w-full max-w-6xl space-y-5 p-4">
      <div className="grid min-h-44 grid-cols-3 content-start gap-2 sm:grid-cols-5 lg:grid-cols-10">
        {currentItems.map((item) => (
          <div
            key={item}
            className="flex h-9 items-center justify-center rounded-md bg-muted/50 font-mono text-xs"
          >
            #{item}
          </div>
        ))}
      </div>

      <div className="grid items-center gap-4 border-t pt-4 md:grid-cols-[1fr_auto_1fr]">
        <p className="text-sm text-muted-foreground">
          {startIndex + 1}-{startIndex + currentItems.length} of {items.length}
        </p>

        <Pagination className="w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={currentHref}
                aria-disabled={page <= 1}
                className={cn(page <= 1 && 'pointer-events-none opacity-50')}
                onClick={(event) => {
                  event.preventDefault();
                  updatePage(page - 1);
                }}
              />
            </PaginationItem>

            {visiblePages[0] > 1 && (
              <>
                <PaginationItem>
                  <PaginationLink
                    href={currentHref}
                    onClick={(event) => {
                      event.preventDefault();
                      updatePage(1);
                    }}
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
                {visiblePages[0] > 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
              </>
            )}

            {visiblePages.map((visiblePage) => (
              <PaginationItem key={visiblePage}>
                <PaginationLink
                  href={currentHref}
                  isActive={visiblePage === page}
                  onClick={(event) => {
                    event.preventDefault();
                    updatePage(visiblePage);
                  }}
                >
                  {visiblePage}
                </PaginationLink>
              </PaginationItem>
            ))}

            {visiblePages[visiblePages.length - 1] < pageCount && (
              <>
                {visiblePages[visiblePages.length - 1] < pageCount - 1 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink
                    href={currentHref}
                    onClick={(event) => {
                      event.preventDefault();
                      updatePage(pageCount);
                    }}
                  >
                    {pageCount}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}

            <PaginationItem>
              <PaginationNext
                href={currentHref}
                aria-disabled={page >= pageCount}
                className={cn(
                  page >= pageCount && 'pointer-events-none opacity-50',
                )}
                onClick={(event) => {
                  event.preventDefault();
                  updatePage(page + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        <div className="flex items-center gap-2 md:justify-end">
          <span className="text-sm text-muted-foreground">Page size</span>
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(value) => {
              pagination.setPageSize(Number(value));
            }}
          >
            <SelectTrigger size="sm" className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {useSearchPagination.pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={String(pageSize)}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3 rounded-md bg-muted/40 p-4 text-sm">
        <code className="block break-all font-mono text-xs">
          {toSearchText(location.search)}
        </code>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">page: {pagination.page}</Badge>
          <Badge variant="secondary">pageSize: {pagination.pageSize}</Badge>
        </div>
      </div>
    </section>
  );
};

export default UseSearchPaginationDemo;
