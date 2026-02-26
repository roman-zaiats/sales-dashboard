import { useState } from 'react';

import { BoardDraggableBoard } from '@/components/sales/BoardDraggableBoard';
import { SalesPageErrorBoundary } from '@/components/sales/SalesPageErrorBoundary';
import { SalesFilters } from '@/components/sales/SalesFilters';
import { SalesLoadingStates } from '@/components/sales/SalesLoadingStates';
import { SalesTable } from '@/components/sales/SalesTable';
import { SalesViewToggle } from '@/components/sales/SalesViewToggle';
import { useSalesListStore } from '@/store/sales/sales-list.store';

type SalesView = 'table' | 'board';

export const SalesPage = () => {
  const {
    sales,
    loading,
    error,
    refetch,
    totalCount,
    search,
    filter,
    setSearchTerm,
    setStatus,
    setHasDelay,
    setOverdueOnly,
    setTagIds,
  } = useSalesListStore();
  const [salesView, setSalesView] = useState<SalesView>('table');
  const [boardWarning, setBoardWarning] = useState<string | null>(null);
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

        <SalesFilters
          search={search}
          status={filter.status}
          hasDelay={filter.hasDelay}
          overdueOnly={filter.overdueOnly}
          tagIds={filter.tagIds ?? []}
          onSearchChange={setSearchTerm}
          onStatusChange={setStatus}
          onHasDelayChange={setHasDelay}
          onOverdueOnlyChange={setOverdueOnly}
          onTagsChange={setTagIds}
        />

        <div className="rounded-lg border border-border bg-card p-1">
          <SalesViewToggle value={salesView} onChange={setSalesView} />
        </div>

        <SalesLoadingStates
          loading={Boolean(loading)}
          hasData={sales.length > 0}
          hasError={Boolean(error)}
          errorMessage={error ? `Unable to load sales. ${error.message}` : undefined}
          emptyMessage="No sales found for this filter set."
          onRetry={handleRetry}
        >
          {salesView === 'table' ? (
            <SalesTable sales={sales} />
          ) : (
            <BoardDraggableBoard sales={sales} onWarning={setBoardWarning} />
          )}
        </SalesLoadingStates>
        {boardWarning && (
          <p className="rounded-md border border-destructive-soft bg-destructive-soft p-2 text-sm text-destructive-foreground" role="status">
            {boardWarning}
          </p>
        )}

        <p className="text-sm text-muted-foreground" aria-live="polite">
          Showing {sales.length} of {totalCount} sales.
        </p>
      </section>
    </SalesPageErrorBoundary>
  );
};
