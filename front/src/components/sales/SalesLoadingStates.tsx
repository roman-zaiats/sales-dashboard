import { type ReactNode } from 'react';

type SalesLoadingStatesProps = {
  loading: boolean;
  hasData: boolean;
  hasError: boolean;
  errorMessage?: string;
  emptyMessage: string;
  onRetry: () => void;
  children: ReactNode;
};

export const SalesLoadingStates = ({
  loading,
  hasData,
  hasError,
  errorMessage,
  emptyMessage,
  onRetry,
  children,
}: SalesLoadingStatesProps) => {
  if (hasError) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
        <p>{errorMessage ?? 'Request failed. Please retry.'}</p>
        <button
          className="mt-3 rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
          type="button"
          onClick={onRetry}
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading && !hasData) {
    return <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">Loading sales data…</div>;
  }

  if (!hasData) {
    return <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">{emptyMessage}</div>;
  }

  return <>{children}</>;
};
