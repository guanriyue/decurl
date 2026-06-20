import { useSearchValues } from '@decurl/react-router';
import { defineFields, field } from '@decurl/react-router/codec';
import {
  elementOf,
  min,
  pipe,
  shape,
  toNumber,
  trim,
} from '@decurl/react-router/decode';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination';

const pageSizeValues = [5, 10, 20];

const fields = defineFields({
  page: field({
    name: 'example_page',
    decode: pipe(trim, shape.integer, toNumber, min(1)),
    defaultValue: 1,
  }),
  pageSize: field({
    name: 'example_page_size',
    decode: pipe(trim, shape.integer, toNumber, elementOf(pageSizeValues)),
    defaultValue: 5,
  }),
});

const items = Array.from({ length: 37 }, (_, index) => {
  const id = index + 1;

  return {
    id,
    title: `Decurl example ${id}`,
    description: `Search params item ${id}`,
  };
});

const toSearchText = (search: string): string => {
  return search.length > 0 ? search : '(empty)';
};

const getVisiblePages = (page: number, pageCount: number): number[] => {
  const start = Math.max(1, page - 1);
  const end = Math.min(pageCount, page + 1);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

const PaginationDemo = () => {
  const location = useLocation();
  const [values, setValues] = useSearchValues(fields);
  const pageCount = Math.max(1, Math.ceil(items.length / values.pageSize));
  const page = Math.min(values.page, pageCount);
  const startIndex = (page - 1) * values.pageSize;
  const currentItems = items.slice(startIndex, startIndex + values.pageSize);
  const visiblePages = getVisiblePages(page, pageCount);

  const updatePage = (nextPage: number) => {
    setValues({
      page: Math.min(Math.max(nextPage, 1), pageCount),
    });
  };

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 p-4">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Docs list</h2>
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{startIndex + currentItems.length} of{' '}
              {items.length}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Page size</span>
            {pageSizeValues.map((pageSize) => (
              <Button
                key={pageSize}
                type="button"
                size="sm"
                variant={values.pageSize === pageSize ? 'default' : 'outline'}
                onClick={() => {
                  setValues({
                    page: 1,
                    pageSize,
                  });
                }}
              >
                {pageSize}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {currentItems.map((item) => (
            <article key={item.id} className="rounded-md bg-muted/40 p-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">#{item.id}</Badge>
                <h3 className="text-sm font-medium">{item.title}</h3>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.description}
              </p>
            </article>
          ))}
        </div>

        <div className="space-y-3">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={page <= 1}
                  onClick={() => {
                    updatePage(page - 1);
                  }}
                >
                  <ChevronLeft />
                  Previous
                </Button>
              </PaginationItem>

              {visiblePages[0] > 1 && (
                <>
                  <PaginationItem>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        updatePage(1);
                      }}
                    >
                      1
                    </Button>
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
                  <Button
                    type="button"
                    size="icon"
                    variant={visiblePage === page ? 'outline' : 'ghost'}
                    aria-current={visiblePage === page ? 'page' : undefined}
                    onClick={() => {
                      updatePage(visiblePage);
                    }}
                  >
                    {visiblePage}
                  </Button>
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
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        updatePage(pageCount);
                      }}
                    >
                      {pageCount}
                    </Button>
                  </PaginationItem>
                </>
              )}

              <PaginationItem>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={page >= pageCount}
                  onClick={() => {
                    updatePage(page + 1);
                  }}
                >
                  Next
                  <ChevronRight />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          <p className="text-center text-sm text-muted-foreground">
            Page {page} of {pageCount}
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-md bg-muted/40 p-4 text-sm">
        <div className="space-y-2">
          <span className="font-medium">location.search</span>
          <code className="block break-all rounded-md bg-background/70 px-2.5 py-2 font-mono text-xs">
            {toSearchText(location.search)}
          </code>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">page: {values.page}</Badge>
          <Badge variant="secondary">pageSize: {values.pageSize}</Badge>
        </div>
      </div>
    </section>
  );
};

export default PaginationDemo;
