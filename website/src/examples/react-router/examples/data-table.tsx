import { useSearchValues } from '@guanriyue/decurl';
import { defineFields, field } from '@guanriyue/decurl/codec';
import {
  elementOf,
  length,
  mapItems,
  pipe,
  unique,
} from '@guanriyue/decurl/decode';
import { useSearchPagination } from '@guanriyue/decurl/pagination';
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Filter,
  FlaskConical,
  LoaderCircle,
  RotateCcw,
  Search,
} from 'lucide-react';
import { useLocation } from 'react-router';
import useSWR from 'swr';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  type CharacterSortKey,
  type CharacterStatus,
  fetchRickAndMortyCharacters,
} from '@/data/rick-and-morty-characters';

const statusOptions = ['Alive', 'Dead', 'unknown'] as const;
const skeletonRows = Array.from({ length: 10 }, (_, index) => index);

const fields = defineFields({
  keyword: field({
    name: 'keyword',
    decode: pipe(length.min(1)),
  }),
  statuses: field({
    name: 'status',
    mode: 'multi',
    decode: pipe(mapItems(elementOf(statusOptions)), unique),
  }),
  sortBy: field({
    name: 'sort',
    decode: elementOf(['id', 'name', 'status', 'species', 'location']),
    defaultValue: 'id',
  }),
  order: field({
    name: 'order',
    decode: elementOf(['asc', 'desc']),
    defaultValue: 'asc',
  }),
});

const toSearchText = (search: string): string => {
  return search.length > 0 ? search : '(empty)';
};

const getSortIcon = (
  sortBy: string,
  order: string,
  column: CharacterSortKey,
) => {
  if (sortBy !== column) {
    return <ChevronsUpDown />;
  }

  return order === 'asc' ? <ArrowUp /> : <ArrowDown />;
};

const getNextStatuses = (
  statuses: CharacterStatus[] | undefined,
  status: CharacterStatus,
  checked: boolean,
) => {
  const nextStatuses = new Set(statuses ?? []);

  if (checked) {
    nextStatuses.add(status);
  } else {
    nextStatuses.delete(status);
  }

  const nextList = Array.from(nextStatuses);
  return nextList.length > 0 ? nextList : undefined;
};

const getVisiblePages = (page: number, pageCount: number): number[] => {
  const start = Math.max(1, page - 1);
  const end = Math.min(pageCount, page + 1);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

const DataTable = () => {
  const location = useLocation();
  const [values, setValues] = useSearchValues(fields);
  const pagination = useSearchPagination();
  const {
    data: result,
    isLoading,
    isValidating,
  } = useSWR(
    [
      'rick-and-morty-characters',
      values.keyword ?? '',
      values.statuses?.join('|') ?? '',
      values.sortBy,
      values.order,
      pagination.page,
      pagination.pageSize,
    ],
    () =>
      fetchRickAndMortyCharacters({
        ...values,
        page: pagination.page,
        pageSize: pagination.pageSize,
      }),
    {
      keepPreviousData: true,
      onSuccess: (nextResult) => {
        pagination.preventOverflow(nextResult);
      },
    },
  );
  const showSkeleton = isLoading && !result;
  const isUpdating = isValidating && !!result;
  const pageCount = result?.pageCount ?? 1;
  const page = Math.min(Math.max(pagination.page, 1), pageCount);
  const visiblePages = getVisiblePages(page, pageCount);

  const updateSort = (column: CharacterSortKey) => {
    setValues({
      sortBy: column,
      order:
        values.sortBy === column && values.order === 'asc' ? 'desc' : 'asc',
    });
    pagination.resetPage();
  };

  const updatePage = (nextPage: number) => {
    pagination.setPage(Math.min(Math.max(nextPage, 1), pageCount));
  };

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 lg:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Filter name, species, location..."
            value={values.keyword ?? ''}
            onChange={(event) => {
              const keyword = event.currentTarget.value;

              setValues({
                keyword: keyword === '' ? undefined : keyword,
              });
              pagination.resetPage();
            }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {isUpdating && (
            <Badge variant="secondary" className="gap-1.5">
              <LoaderCircle className="size-3 animate-spin" />
              Updating
            </Badge>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline">
                <Filter />
                Status
                {values.statuses && (
                  <Badge variant="secondary">{values.statuses.length}</Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Status filter</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {statusOptions.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={
                    values.statuses?.some((value) => value === status) ?? false
                  }
                  onCheckedChange={(checked) => {
                    setValues({
                      statuses: getNextStatuses(
                        values.statuses,
                        status,
                        checked === true,
                      ),
                    });
                    pagination.resetPage();
                  }}
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              pagination.setPage(999);
            }}
          >
            <FlaskConical />
            Page 999
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setValues({
                keyword: undefined,
                statuses: undefined,
                sortBy: undefined,
                order: undefined,
              });
              pagination.setPagination({
                page: undefined,
                pageSize: undefined,
              });
            }}
          >
            <RotateCcw />
            Reset
          </Button>
        </div>
      </div>

      <Table className="min-w-[52rem] table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-3"
                onClick={() => {
                  updateSort('id');
                }}
              >
                ID
                {getSortIcon(values.sortBy, values.order, 'id')}
              </Button>
            </TableHead>
            <TableHead className="w-56">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-3"
                onClick={() => {
                  updateSort('name');
                }}
              >
                Name
                {getSortIcon(values.sortBy, values.order, 'name')}
              </Button>
            </TableHead>
            <TableHead className="w-32">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-3"
                onClick={() => {
                  updateSort('status');
                }}
              >
                Status
                {getSortIcon(values.sortBy, values.order, 'status')}
              </Button>
            </TableHead>
            <TableHead className="w-36">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-3"
                onClick={() => {
                  updateSort('species');
                }}
              >
                Species
                {getSortIcon(values.sortBy, values.order, 'species')}
              </Button>
            </TableHead>
            <TableHead className="w-32">Gender</TableHead>
            <TableHead className="w-64">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-3"
                onClick={() => {
                  updateSort('location');
                }}
              >
                Location
                {getSortIcon(values.sortBy, values.order, 'location')}
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {showSkeleton &&
            skeletonRows.map((row) => (
              <TableRow key={row}>
                <TableCell className="w-16">
                  <Skeleton className="h-4 w-8" />
                </TableCell>
                <TableCell className="w-56">
                  <Skeleton className="h-4 w-36" />
                </TableCell>
                <TableCell className="w-32">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell className="w-36">
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="w-32">
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell className="w-64">
                  <Skeleton className="h-4 w-40" />
                </TableCell>
              </TableRow>
            ))}

          {!showSkeleton &&
            result?.rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="w-16 font-mono text-xs">
                  {row.id}
                </TableCell>
                <TableCell className="w-56 truncate font-medium">
                  {row.name}
                </TableCell>
                <TableCell className="w-32">
                  <Badge variant="outline">{row.status}</Badge>
                </TableCell>
                <TableCell className="w-36 truncate">{row.species}</TableCell>
                <TableCell className="w-32 truncate">{row.gender}</TableCell>
                <TableCell className="w-64 truncate">{row.location}</TableCell>
              </TableRow>
            ))}
          {!showSkeleton && result?.rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-24 text-center text-muted-foreground"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {showSkeleton ? (
          <Skeleton className="h-5 w-56" />
        ) : (
          <p className="text-sm text-muted-foreground">
            Showing {result?.rangeStart}-{result?.rangeEnd} of {result?.total}{' '}
            characters
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(value) => {
                const pageSize = Number(value);

                if (!useSearchPagination.pageSizeOptions.includes(pageSize)) {
                  return;
                }

                pagination.setPageSize(pageSize);
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

          <Pagination className="mx-0 w-auto justify-start">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={page <= 1}
                  tabIndex={page <= 1 ? -1 : undefined}
                  className={
                    isLoading || page <= 1
                      ? 'pointer-events-none opacity-50'
                      : undefined
                  }
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
                      href="#"
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
                    href="#"
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
                      href="#"
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
                  href="#"
                  aria-disabled={page >= pageCount}
                  tabIndex={page >= pageCount ? -1 : undefined}
                  className={
                    isLoading || page >= pageCount
                      ? 'pointer-events-none opacity-50'
                      : undefined
                  }
                  onClick={(event) => {
                    event.preventDefault();
                    updatePage(page + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
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
          <Badge variant="secondary">keyword: {values.keyword ?? '-'}</Badge>
          <Badge variant="secondary">
            statuses: {values.statuses?.join(', ') || '-'}
          </Badge>
          <Badge variant="secondary">sortBy: {values.sortBy}</Badge>
          <Badge variant="secondary">order: {values.order}</Badge>
          <Badge variant="secondary">page: {pagination.page}</Badge>
          <Badge variant="secondary">pageSize: {pagination.pageSize}</Badge>
        </div>
      </div>
    </section>
  );
};

export default DataTable;
