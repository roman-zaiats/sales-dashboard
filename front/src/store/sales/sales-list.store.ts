import { useMemo, useState } from 'react';

import {
  type Sale,
  type SalesListQueryVariables,
  type SaleFilterInput,
  type SaleSortInput,
  SaleSortField,
  useSalesListQuery,
} from '@/generated/graphql';

const PAGE_SIZE = 50;

export type SalesListFilterInput = Omit<SaleFilterInput, 'has_delay' | 'overdue_only' | 'tagIds'> & {
  hasDelay?: boolean;
  overdueOnly?: boolean;
  search?: string;
  tagIds?: string[];
  status?: Sale['status'];
};

export type SalesListSort = {
  field: SaleSortField;
  direction: SaleSortInput['direction'];
};

export const useSalesListStore = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Sale['status'] | undefined>(undefined);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [hasDelay, setHasDelay] = useState<boolean | undefined>(undefined);
  const [overdueOnly, setOverdueOnly] = useState<boolean | undefined>(undefined);
  const [sortField, setSortField] = useState<SaleSortField>('updated_at');
  const [sortDirection, setSortDirection] = useState<SaleSortInput['direction']>('ASC');
  const [skip, setSkip] = useState(0);

  const filter = useMemo<SalesListFilterInput>(() => ({
    search: search || undefined,
    status,
    tagIds: tagIds.length ? tagIds : undefined,
    hasDelay,
    overdueOnly,
  }), [search, status, tagIds, hasDelay, overdueOnly]);

  const variables = useMemo<SalesListQueryVariables>(
    () => ({
      filter: {
        search: filter.search,
        status: filter.status,
        tagIds: filter.tagIds,
        has_delay: filter.hasDelay,
        overdue_only: filter.overdueOnly,
      },
      sort: {
        field: sortField,
        direction: sortDirection,
      },
      pagination: {
        skip,
        limit: PAGE_SIZE,
      },
    }),
    [filter, sortDirection, sortField, skip],
  );

  const query = useSalesListQuery({ variables, fetchPolicy: 'cache-and-network' });

  const resetPagination = () => {
    setSkip(0);
  };

  const setSearchTerm = (value: string) => {
    setSearch(value);
    resetPagination();
  };

  return {
    filter,
    search,
    setSearchTerm,
    setStatus,
    setTagIds,
    setHasDelay,
    setOverdueOnly,
    setSortField,
    setSortDirection,
    setSkip,
    skip,
    setPage: (page: number) => setSkip(Math.max(0, page) * PAGE_SIZE),
    limit: PAGE_SIZE,
    sortField,
    sortDirection,
    data: query.data,
    sales: query.data?.salesList.items ?? [],
    totalCount: query.data?.salesList.totalCount ?? 0,
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,
    resetPagination,
  };
};
