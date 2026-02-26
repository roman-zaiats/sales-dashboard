import { type ReactNode, useState } from 'react';

type SalesLoadingStatesProps = {
  loading: boolean;
  hasData: boolean;
  hasError: boolean;
  errorMessage?: string;
  emptyMessage: string;
  onRetry: () => void | Promise<unknown>;
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
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (isRetrying) {
      return;
    }

    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  if (hasError) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
        <p>{errorMessage ?? 'Request failed. Please retry.'}</p>
        <button
          className="mt-3 inline-flex h-9 items-center rounded-md bg-rose-600 px-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
          type="button"
          onClick={() => {
            void handleRetry();
          }}
          disabled={isRetrying}
        >
          {isRetrying ? 'Retrying...' : 'Retry'}
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
