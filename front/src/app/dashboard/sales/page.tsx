import { useMemo, useState } from 'react';

import { BoardDraggableBoard } from '@/components/sales/BoardDraggableBoard';
import { SalesPageErrorBoundary } from '@/components/sales/SalesPageErrorBoundary';
import { SalesLoadingStates } from '@/components/sales/SalesLoadingStates';
import { SalesTable, type SalesTableSortState, type SalesTableSortField } from '@/components/sales/SalesTable';
import { SalesTaskFilters } from '@/components/sales/SalesTaskFilters';
import { SalesViewToggle } from '@/components/sales/SalesViewToggle';
import { Button } from '@/components/ui/button';
import type { Sale, SaleStatus } from '@/generated/graphql';
import { useTagsQuery } from '@/generated/graphql';
import { saleDisplayLabel } from '@/lib/sales/sales-utils';
import { SALE_STATUS_LABELS, SALE_STATUS_VALUES } from '@/lib/sales/status';
import { useSalesListStore } from '@/store/sales/sales-list.store';

type SalesView = 'table' | 'board';
type DelayFilterValue = 'HAS_DELAY' | 'NO_DELAY';
type OverdueFilterValue = 'OVERDUE' | 'NOT_OVERDUE';

type TagFilterOption = {
  value: string;
  label: string;
  count?: number;
};

const STATUS_ORDER: Record<SaleStatus, number> = {
  RECEIVED: 0,
  COMPLETED: 1,
  DELAYED: 2,
  PROBLEM: 3,
};

const parseTimestamp = (value?: string | null): number => {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
};

const hasDelay = (sale: Sale): boolean => Boolean(sale.deliveryDelayAt);

const isOverdue = (sale: Sale): boolean => {
  if (!sale.deliveryDelayAt) {
    return false;
  }

  const parsed = Date.parse(sale.deliveryDelayAt);
  if (Number.isNaN(parsed)) {
    return false;
  }

  return parsed < Date.now();
};

const getSearchText = (sale: Sale): string => {
  return [
    saleDisplayLabel(sale),
    sale.listing?.eventName ?? '',
    sale.listing?.listingId ?? '',
    sale.listing?.eventId ?? '',
    sale.buyerEmail ?? '',
    sale.problemReason ?? '',
    sale.filledBy?.fullName ?? '',
    sale.status,
    ...sale.dashboardTags.map((tag) => tag.name),
  ]
    .join(' ')
    .toLowerCase();
};

const compareText = (left: string, right: string): number => {
  return left.localeCompare(right, undefined, { sensitivity: 'base' });
};

export const SalesPage = () => {
  const {
    sales,
    loading,
    error,
    refetch,
    totalCount,
    skip,
    setPage,
    limit,
  } = useSalesListStore();

  const tagsQuery = useTagsQuery({ variables: { limit: 250 } });

  const [search, setSearch] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<SaleStatus[]>([]);
  const [selectedDelay, setSelectedDelay] = useState<DelayFilterValue[]>([]);
  const [selectedOverdue, setSelectedOverdue] = useState<OverdueFilterValue[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [sortState, setSortState] = useState<SalesTableSortState>({ field: 'createdAt', direction: 'desc' });
  const [salesView, setSalesView] = useState<SalesView>('table');
  const [boardWarning, setBoardWarning] = useState<string | null>(null);

  const statusOptions = useMemo(
    () =>
      SALE_STATUS_VALUES.map((status) => ({
        value: status,
        label: SALE_STATUS_LABELS[status],
        count: sales.filter((sale) => sale.status === status).length,
      })),
    [sales],
  );

  const delayOptions = useMemo(
    () => [
      { value: 'HAS_DELAY', label: 'Has delay', count: sales.filter((sale) => hasDelay(sale)).length },
      { value: 'NO_DELAY', label: 'No delay', count: sales.filter((sale) => !hasDelay(sale)).length },
    ],
    [sales],
  );

  const overdueOptions = useMemo(
    () => [
      { value: 'OVERDUE', label: 'Overdue', count: sales.filter((sale) => isOverdue(sale)).length },
      { value: 'NOT_OVERDUE', label: 'Not overdue', count: sales.filter((sale) => !isOverdue(sale)).length },
    ],
    [sales],
  );

  const tagCounts = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();

    for (const sale of sales) {
      for (const tag of sale.dashboardTags) {
        const current = counts.get(tag.id);
        if (current) {
          current.count += 1;
          continue;
        }

        counts.set(tag.id, { label: tag.name, count: 1 });
      }
    }

    return counts;
  }, [sales]);

  const tagOptions = useMemo(() => {
    const optionsById = new Map<string, TagFilterOption>();

    for (const [value, payload] of tagCounts) {
      optionsById.set(value, { value, label: payload.label, count: payload.count });
    }

    for (const tag of tagsQuery.data?.tags ?? []) {
      const existing = optionsById.get(tag.id);
      optionsById.set(tag.id, {
        value: tag.id,
        label: tag.name,
        count: existing?.count,
      });
    }

    return [...optionsById.values()].sort((left, right) => compareText(left.label, right.label));
  }, [tagCounts, tagsQuery.data?.tags]);

  const hasActiveFilters =
    search.trim().length > 0 ||
    selectedStatuses.length > 0 ||
    selectedDelay.length > 0 ||
    selectedOverdue.length > 0 ||
    selectedTagIds.length > 0;

  const clearAllFilters = (): void => {
    setSearch('');
    setSelectedStatuses([]);
    setSelectedDelay([]);
    setSelectedOverdue([]);
    setSelectedTagIds([]);
    setPage(0);
  };

  const filteredSales = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return sales.filter((sale) => {
      if (normalizedSearch && !getSearchText(sale).includes(normalizedSearch)) {
        return false;
      }

      if (selectedStatuses.length > 0 && !selectedStatuses.includes(sale.status)) {
        return false;
      }

      if (selectedDelay.length > 0) {
        const delayValue: DelayFilterValue = hasDelay(sale) ? 'HAS_DELAY' : 'NO_DELAY';
        if (!selectedDelay.includes(delayValue)) {
          return false;
        }
      }

      if (selectedOverdue.length > 0) {
        const overdueValue: OverdueFilterValue = isOverdue(sale) ? 'OVERDUE' : 'NOT_OVERDUE';
        if (!selectedOverdue.includes(overdueValue)) {
          return false;
        }
      }

      if (selectedTagIds.length > 0) {
        const saleTagIds = new Set(sale.dashboardTags.map((tag) => tag.id));
        if (!selectedTagIds.some((tagId) => saleTagIds.has(tagId))) {
          return false;
        }
      }

      return true;
    });
  }, [search, sales, selectedStatuses, selectedDelay, selectedOverdue, selectedTagIds]);

  const sortedSales = useMemo(() => {
    const directionFactor = sortState.direction === 'asc' ? 1 : -1;

    return [...filteredSales].sort((left, right) => {
      let comparison = 0;

      switch (sortState.field) {
        case 'identifier':
          comparison = compareText(saleDisplayLabel(left), saleDisplayLabel(right));
          break;
        case 'status':
          comparison = STATUS_ORDER[left.status] - STATUS_ORDER[right.status];
          break;
        case 'createdAt':
          comparison = parseTimestamp(left.createdAt) - parseTimestamp(right.createdAt);
          break;
        case 'delay':
          comparison = parseTimestamp(left.deliveryDelayAt) - parseTimestamp(right.deliveryDelayAt);
          break;
        case 'problem':
          comparison = compareText(left.problemReason ?? '', right.problemReason ?? '');
          break;
        case 'tags':
          comparison = compareText(
            left.dashboardTags.map((tag) => tag.name).join(', '),
            right.dashboardTags.map((tag) => tag.name).join(', '),
          );
          break;
        case 'owner':
          comparison = compareText(left.filledBy?.fullName ?? '', right.filledBy?.fullName ?? '');
          break;
      }

      return comparison * directionFactor;
    });
  }, [filteredSales, sortState]);

  const selectedRowIdSet = useMemo(() => new Set(selectedRowIds), [selectedRowIds]);
  const visibleRowIds = useMemo(() => sortedSales.map((sale) => sale.id), [sortedSales]);

  const selectedVisibleCount = useMemo(
    () => visibleRowIds.filter((saleId) => selectedRowIdSet.has(saleId)).length,
    [selectedRowIdSet, visibleRowIds],
  );

  const allRowsSelected = sortedSales.length > 0 && selectedVisibleCount === sortedSales.length;
  const someRowsSelected = selectedVisibleCount > 0 && !allRowsSelected;

  const handleToggleRow = (saleId: string, checked: boolean): void => {
    setSelectedRowIds((current) => {
      if (checked) {
        if (current.includes(saleId)) {
          return current;
        }

        return [...current, saleId];
      }

      return current.filter((currentId) => currentId !== saleId);
    });
  };

  const handleToggleAllRows = (checked: boolean): void => {
    setSelectedRowIds((current) => {
      if (checked) {
        const next = new Set(current);
        for (const saleId of visibleRowIds) {
          next.add(saleId);
        }
        return [...next];
      }

      const visibleLookup = new Set(visibleRowIds);
      return current.filter((saleId) => !visibleLookup.has(saleId));
    });
  };

  const handleSortChange = (field: SalesTableSortField): void => {
    setSortState((current) => {
      if (current.field === field) {
        return { field, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }

      return { field, direction: 'asc' };
    });
  };

  const currentPage = limit > 0 ? Math.floor(skip / limit) : 0;
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(totalCount / limit)) : 1;
  const canGoPreviousPage = currentPage > 0;
  const canGoNextPage = currentPage + 1 < totalPages;
  const pageRangeStart = sortedSales.length > 0 ? skip + 1 : 0;
  const pageRangeEnd = Math.min(skip + sortedSales.length, totalCount);

  const handlePreviousPage = () => {
    if (!canGoPreviousPage) {
      return;
    }
    setPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (!canGoNextPage) {
      return;
    }
    setPage(currentPage + 1);
  };

  const handleRetry = async () => {
    await refetch();
  };

  return (
    <SalesPageErrorBoundary screenName="Sales list" onRetry={handleRetry} retryMessage="Reload list">
      <section className="space-y-5">
        <header>
          <h2 className="text-2xl font-semibold">Sales</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sales list uses live GraphQL data.</p>
        </header>

        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <SalesTaskFilters
              search={search}
              onSearchChange={(value) => {
                setSearch(value);
                setPage(0);
              }}
              statusOptions={statusOptions}
              selectedStatuses={selectedStatuses}
              onStatusesChange={(nextValues) => {
                setSelectedStatuses(nextValues as SaleStatus[]);
                setPage(0);
              }}
              delayOptions={delayOptions}
              selectedDelay={selectedDelay}
              onDelayChange={(nextValues) => {
                setSelectedDelay(nextValues as DelayFilterValue[]);
                setPage(0);
              }}
              overdueOptions={overdueOptions}
              selectedOverdue={selectedOverdue}
              onOverdueChange={(nextValues) => {
                setSelectedOverdue(nextValues as OverdueFilterValue[]);
                setPage(0);
              }}
              tagOptions={tagOptions}
              selectedTagIds={selectedTagIds}
              onTagIdsChange={(nextValues) => {
                setSelectedTagIds(nextValues);
                setPage(0);
              }}
              showReset={hasActiveFilters}
              onReset={clearAllFilters}
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            {salesView === 'table' && selectedVisibleCount > 0 ? (
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {selectedVisibleCount} row(s) selected.
              </p>
            ) : null}
            <div className="rounded-lg border border-border bg-card p-1">
              <SalesViewToggle value={salesView} onChange={setSalesView} />
            </div>
          </div>
        </div>

        <SalesLoadingStates
          loading={Boolean(loading)}
          hasData={sortedSales.length > 0}
          hasError={Boolean(error)}
          errorMessage={error ? `Unable to load sales. ${error.message}` : undefined}
          emptyMessage="No sales found for this filter set."
          onRetry={handleRetry}
        >
          {salesView === 'table' ? (
            <SalesTable
              sales={sortedSales}
              selectedRowIdSet={selectedRowIdSet}
              allRowsSelected={allRowsSelected}
              someRowsSelected={someRowsSelected}
              onToggleRow={handleToggleRow}
              onToggleAllRows={handleToggleAllRows}
              sortState={sortState}
              onSortChange={handleSortChange}
            />
          ) : (
            <BoardDraggableBoard sales={sortedSales} onWarning={setBoardWarning} />
          )}
        </SalesLoadingStates>

        {boardWarning && (
          <p className="rounded-md border border-destructive-soft bg-destructive-soft p-2 text-sm text-destructive-foreground" role="status">
            {boardWarning}
          </p>
        )}
        {totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-sm text-muted-foreground">
              Showing {pageRangeStart}-{pageRangeEnd} of {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handlePreviousPage} disabled={!canGoPreviousPage}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {totalPages > 0 ? `Page ${currentPage + 1} of ${totalPages}` : 'Page 0 of 0'}
              </span>
              <Button type="button" variant="outline" size="sm" onClick={handleNextPage} disabled={!canGoNextPage}>
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </SalesPageErrorBoundary>
  );
};
