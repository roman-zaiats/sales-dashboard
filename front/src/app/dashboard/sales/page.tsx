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

  return (
    <SalesPageErrorBoundary screenName="Sales list" onRetry={() => void refetch()} retryMessage="Reload list">
      <section className="space-y-5">
        <header>
          <h2 className="text-2xl font-bold text-slate-900">Sales</h2>
          <p className="mt-1 text-sm text-slate-600">Sales list scaffold now uses live GraphQL data.</p>
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

        <div className="rounded-lg border border-slate-200 bg-white p-1">
          <SalesViewToggle value={salesView} onChange={setSalesView} />
        </div>

        <SalesLoadingStates
          loading={Boolean(loading)}
          hasData={sales.length > 0}
          hasError={Boolean(error)}
          errorMessage={error ? `Unable to load sales. ${error.message}` : undefined}
          emptyMessage="No sales found for this filter set."
          onRetry={() => void refetch()}
        >
          {salesView === 'table' ? (
            <SalesTable sales={sales} />
          ) : (
            <BoardDraggableBoard sales={sales} onWarning={setBoardWarning} />
          )}
        </SalesLoadingStates>
        {boardWarning && (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-sm text-amber-700" role="status">
            {boardWarning}
          </p>
        )}

        <p className="text-sm text-slate-600" aria-live="polite">
          Showing {sales.length} of {totalCount} sales.
        </p>
      </section>
    </SalesPageErrorBoundary>
  );
};
