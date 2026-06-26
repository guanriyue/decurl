import type { RecordCodec, SingleRequiredFieldCodec } from '@decurl/core/codec';
import { useStableEvent } from '../_internal/useStableEvent';
import type { UseSearchValuesResult } from '../react/useSearchValues';
import { useSearchValues } from '../react/useSearchValues';
import type { SearchNavigateOptions } from '../runtime/types';

const defaultPageSizeOptions = [10, 20, 50, 100] as const;

export type SearchPaginationFields = {
  page: SingleRequiredFieldCodec<number>;
  pageSize: SingleRequiredFieldCodec<number>;
};

type SearchPaginationPageSizeChangeContext = {
  page: number;
  pageSize: number;
  nextPageSize: number;
};

export type SearchPaginationPageSizeChangeStrategy = 'reset' | 'preserve-offset';

export type UseSearchPaginationOptions = {
  pageSizeChangeStrategy?: SearchPaginationPageSizeChangeStrategy;
};

export type CreateUseSearchPaginationOptions = {
  useSearchValues: <TDefinition extends RecordCodec>(
    schema: TDefinition,
  ) => UseSearchValuesResult<TDefinition>;
};

export type SearchPaginationPatch = {
  page?: number | null | undefined;
  pageSize?: number | null | undefined;
};

export type SearchPaginationTotalSource =
  | number
  | null
  | undefined
  | { total?: number | null | undefined };

type SearchPaginationPreventOverflow = (totalSource: SearchPaginationTotalSource) => void;

export type UseSearchPaginationResult = {
  page: number;
  pageSize: number;
  setPage: (page: number, options?: SearchNavigateOptions) => void;
  resetPage: () => void;
  setPageSize: (pageSize: number, options?: SearchNavigateOptions) => void;
  setPagination: (patch: SearchPaginationPatch, options?: SearchNavigateOptions) => void;
  preventOverflow: SearchPaginationPreventOverflow;
};

export type UseSearchPagination = {
  (): UseSearchPaginationResult;
  (options?: UseSearchPaginationOptions): UseSearchPaginationResult;
  (fields: SearchPaginationFields, options?: UseSearchPaginationOptions): UseSearchPaginationResult;
  fields: SearchPaginationFields;
  pageSizeOptions: readonly number[];
};

export const createUseSearchPagination = ({
  useSearchValues,
}: CreateUseSearchPaginationOptions): UseSearchPagination => {
  const defaultFields = createDefaultPaginationFields();

  const useCreatedSearchPagination = ((
    fieldsOrOptions?: SearchPaginationFields | UseSearchPaginationOptions,
    maybeOptions?: UseSearchPaginationOptions,
  ): UseSearchPaginationResult => {
    const fields = isSearchPaginationFields(fieldsOrOptions) ? fieldsOrOptions : defaultFields;
    const options = isSearchPaginationFields(fieldsOrOptions) ? maybeOptions : fieldsOrOptions;
    const schema = {
      page: fields.page,
      pageSize: fields.pageSize,
    };
    const [values, setPagination] = useSearchValues(schema);
    const page = values.page;
    const pageSize = values.pageSize;

    const setPage = useStableEvent(
      (nextPage: number, navigateOptions?: SearchNavigateOptions): void => {
        setPagination(
          {
            page: nextPage,
          },
          navigateOptions,
        );
      },
    );

    const resetPage = useStableEvent((): void => {
      setPagination({
        page: 1,
      });
    });

    const setPageSize = useStableEvent(
      (nextPageSize: number, navigateOptions?: SearchNavigateOptions): void => {
        const previousPage = values.page;
        const previousPageSize = values.pageSize;

        if (previousPageSize === nextPageSize) {
          return;
        }

        setPagination(
          {
            page: resolvePageAfterPageSizeChange({
              page: previousPage,
              pageSize: previousPageSize,
              nextPageSize,
              pageSizeChangeStrategy: options?.pageSizeChangeStrategy ?? 'reset',
            }),
            pageSize: nextPageSize,
          },
          navigateOptions,
        );
      },
    );

    const preventOverflow = useStableEvent((totalSource: SearchPaginationTotalSource): void => {
      const total = resolveTotal(totalSource);

      if (typeof total === 'undefined') {
        return;
      }

      const maxPage = getMaxPage(total, pageSize);

      if (page <= maxPage) {
        return;
      }

      setPagination({ page: maxPage });
    });

    return {
      page,
      pageSize,
      setPage,
      resetPage,
      setPageSize,
      setPagination,
      preventOverflow,
    };
  }) as UseSearchPagination;

  useCreatedSearchPagination.fields = defaultFields;
  useCreatedSearchPagination.pageSizeOptions = defaultPageSizeOptions;

  return useCreatedSearchPagination;
};

const createDefaultPaginationFields = (): SearchPaginationFields => {
  return {
    page: {
      decode: decodeStrictPositiveInteger,
      defaultValue: 1,
    },
    pageSize: {
      decode: (input) => {
        const value = decodeStrictPositiveInteger(input);

        if (typeof value === 'undefined') {
          return undefined;
        }

        return (defaultPageSizeOptions as readonly number[]).includes(value) ? value : undefined;
      },
      defaultValue: defaultPageSizeOptions[0],
    },
  };
};

const isSearchPaginationFields = (
  value: SearchPaginationFields | UseSearchPaginationOptions | undefined,
): value is SearchPaginationFields => {
  return typeof value === 'object' && value !== null && 'page' in value && 'pageSize' in value;
};

const decodeStrictPositiveInteger = (input: string): number | undefined => {
  const value = input.trim();

  if (!/^[1-9][0-9]*$/.test(value)) {
    return undefined;
  }

  const numberValue = Number(value);

  return Number.isSafeInteger(numberValue) ? numberValue : undefined;
};

const resolvePageAfterPageSizeChange = ({
  page,
  pageSize,
  nextPageSize,
  pageSizeChangeStrategy,
}: SearchPaginationPageSizeChangeContext & {
  pageSizeChangeStrategy: SearchPaginationPageSizeChangeStrategy;
}): number => {
  if (pageSizeChangeStrategy === 'reset') {
    return 1;
  }

  return Math.floor(((page - 1) * pageSize) / nextPageSize) + 1;
};

const getMaxPage = (total: number, pageSize: number): number => {
  return Math.max(1, Math.ceil(total / pageSize));
};

const resolveTotal = (totalSource: SearchPaginationTotalSource): number | undefined => {
  const total = typeof totalSource === 'number' ? totalSource : totalSource?.total;

  if (typeof total !== 'number' || !Number.isSafeInteger(total) || total < 0) {
    return undefined;
  }

  return total;
};

export const useSearchPagination = createUseSearchPagination({
  useSearchValues,
});
