import { useMemo, useState } from 'react';

import {
  type DelayedSalesQueryVariables,
  type Sale,
  type SaleFilterInput,
  type SaleSortInput,
  SaleSortField,
  useDelayedSalesQuery,
} from '@/generated/graphql';
import { normalizeTagFilters } from './sales.filters';

const PAGE_SIZE = 50;

export type DelayedSalesListFilterInput = Omit<SaleFilterInput, 'has_delay' | 'overdue_only' | 'tagIds'> & {
  overdueOnly?: boolean;
  search?: string;
  tagIds?: string[];
  status?: Sale['status'];
};

export const useDelayedSalesListStore = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Sale['status'] | undefined>(undefined);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [overdueOnly, setOverdueOnly] = useState<boolean | undefined>(undefined);
  const [sortField, setSortField] = useState<SaleSortField>('delivery_delay_at');
  const [sortDirection, setSortDirection] = useState<SaleSortInput['direction']>('ASC');
  const [skip, setSkip] = useState(0);

  const filter = useMemo<DelayedSalesListFilterInput>(
    () => ({
      search: search || undefined,
      status,
      tagIds: normalizeTagFilters(tagIds),
      overdueOnly,
    }),
    [search, status, tagIds, overdueOnly],
  );

  const variables = useMemo<DelayedSalesQueryVariables>(
    () => ({
      filter: {
        search: filter.search,
        status: filter.status,
        tagIds: filter.tagIds,
        has_delay: true,
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

  const query = useDelayedSalesQuery({ variables, fetchPolicy: 'cache-and-network' });

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
    sales: query.data?.delayedSales.items ?? [],
    totalCount: query.data?.delayedSales.totalCount ?? 0,
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,
    resetPagination,
  };
};
