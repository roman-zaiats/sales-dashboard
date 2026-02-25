import { SalesFilters } from '@/components/sales/SalesFilters';
import { SalesPageErrorBoundary } from '@/components/sales/SalesPageErrorBoundary';
import { SalesLoadingStates } from '@/components/sales/SalesLoadingStates';
import { DelayedSalesTable } from '@/components/sales/DelayedSalesTable';
import { useDelayedSalesListStore } from '@/store/sales/sales-delayed-list.store';

export const DelayedSalesPage = () => {
  const {
    sales,
    loading,
    error,
    refetch,
    filter,
    search,
    totalCount,
    setSearchTerm,
    setStatus,
    setOverdueOnly,
    setTagIds,
  } = useDelayedSalesListStore();

  return (
    <SalesPageErrorBoundary screenName="Delayed sales" onRetry={() => void refetch()} retryMessage="Reload delayed list">
      <section className="space-y-5">
        <header>
          <h2 className="text-2xl font-semibold">Delayed Sales</h2>
          <p className="mt-1 text-sm text-muted-foreground">Delayed sales are shown first by earliest delivery delay.</p>
        </header>

        <SalesFilters
          search={search}
          status={filter.status}
          hasDelay={true}
          overdueOnly={filter.overdueOnly}
          tagIds={filter.tagIds ?? []}
          onSearchChange={setSearchTerm}
          onStatusChange={setStatus}
          onHasDelayChange={() => undefined}
          onOverdueOnlyChange={setOverdueOnly}
          onTagsChange={setTagIds}
          isHasDelayDisabled
        />

        <SalesLoadingStates
          loading={Boolean(loading)}
          hasData={sales.length > 0}
          hasError={Boolean(error)}
          errorMessage={error ? `Unable to load delayed sales. ${error.message}` : undefined}
          emptyMessage="No delayed sales were returned for the current filters."
          onRetry={() => void refetch()}
        >
          <DelayedSalesTable sales={sales} />
        </SalesLoadingStates>

        <p className="text-sm text-muted-foreground" aria-live="polite">
          Showing {sales.length} of {totalCount} delayed sales.
        </p>
      </section>
    </SalesPageErrorBoundary>
  );
};
