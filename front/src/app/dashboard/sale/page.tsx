import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { SaleComments } from '@/components/sales/SaleComments';
import { SalesPageErrorBoundary } from '@/components/sales/SalesPageErrorBoundary';
import { FilledBySelector } from '@/components/sales/FilledBySelector';
import { SaleEditableFields } from '@/components/sales/SaleEditableFields';
import { SalesLoadingStates } from '@/components/sales/SalesLoadingStates';
import { SaleTags } from '@/components/sales/SaleTags';
import { detectSaleUpdateStaleness, SALE_STALE_EDIT_WARNING, useSaleDetailMutations } from '@/store/sales/sale-detail.mutations';
import { useSaleDetailStore } from '@/store/sales/sale-detail.store';
import { type SaleStatus, useSaleByIdQuery } from '@/generated/graphql';
import { saleDisplayLabel } from '@/lib/sales/sales-utils';

const formatDate = (value?: string | null): string => {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return '—';
  }

  return parsed.toLocaleString();
};

const formatPayload = (payload: unknown): string => {
  try {
    const rendered = JSON.stringify(payload, null, 2);

    return rendered === undefined ? '—' : rendered;
  } catch {
    return '—';
  }
};

export const SaleDetailPage = () => {
  const { id } = useParams<'id'>();

  const query = useSaleByIdQuery({
    variables: {
      id: id ?? '',
    },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });

  const {
    updateStatus,
    updateDelay,
    updateProblem,
    loading: mutationsLoading,
  } = useSaleDetailMutations();

  const [saveMessage, setSaveMessage] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [baselineUpdatedAt, setBaselineUpdatedAt] = useState<string | null>(null);

  const store = useSaleDetailStore();

  const sale = query.data?.saleById ?? null;
  const isBusy = isSubmitting || mutationsLoading || store.usersLoading;

  useEffect(() => {
    if (!id || !sale) {
      setBaselineUpdatedAt(null);
      return;
    }

    setBaselineUpdatedAt(sale.updatedAt);
  }, [id, sale]);

  const refreshSale = async () => {
    const response = await query.refetch();
    if (response.data?.saleById?.updatedAt) {
      setBaselineUpdatedAt(response.data.saleById.updatedAt);
    }
  };

  const handleOperationalSubmit = async (next: {
    status: SaleStatus;
    deliveryDelayAt: string | null;
    problemReason: string | null;
  }) => {
    if (!sale) {
      return;
    }

    setIsSubmitting(true);
    setSaveMessage('');
    setEditMessage('');

    try {
      if (detectSaleUpdateStaleness(sale.updatedAt, baselineUpdatedAt)) {
        setEditMessage(SALE_STALE_EDIT_WARNING);
        return;
      }

      if (
        next.status === sale.status &&
        (next.deliveryDelayAt ?? null) === (sale.deliveryDelayAt ?? null) &&
        next.problemReason === (sale.problemReason ?? null)
      ) {
        setSaveMessage('No changes to save.');
        return;
      }

      let changed = false;

      if (next.status !== sale.status) {
        await updateStatus(sale.id, next.status, baselineUpdatedAt);
        changed = true;
      }

      if (next.deliveryDelayAt !== sale.deliveryDelayAt) {
        await updateDelay(sale.id, next.deliveryDelayAt, baselineUpdatedAt);
        changed = true;
      }

      if (next.problemReason !== (sale.problemReason ?? null)) {
        await updateProblem(sale.id, next.problemReason, baselineUpdatedAt);
        changed = true;
      }

      if (changed) {
        await refreshSale();
        setSaveMessage('Sale saved successfully.');
      } else {
        setSaveMessage('No changes to save.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save operational updates. Please retry.';
      setEditMessage(message === SALE_STALE_EDIT_WARNING ? message : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagAdd = async (tagName: string) => {
    if (!sale) {
      return;
    }

    setIsSubmitting(true);
    setSaveMessage('');
    setEditMessage('');
    try {
      await store.addTag(sale.id, tagName);
      await refreshSale();
      setSaveMessage('Tag added.');
    } catch (error) {
      setEditMessage(error instanceof Error ? error.message : 'Unable to add tag. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagRemove = async (tagName: string) => {
    if (!sale) {
      return;
    }

    setIsSubmitting(true);
    setSaveMessage('');
    setEditMessage('');
    try {
      await store.removeTag(sale.id, tagName);
      await refreshSale();
      setSaveMessage('Tag removed.');
    } catch (error) {
      setEditMessage(error instanceof Error ? error.message : 'Unable to remove tag. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentAdd = async (comment: string) => {
    if (!sale) {
      return;
    }

    setIsSubmitting(true);
    setSaveMessage('');
    setEditMessage('');
    try {
      await store.addComment(sale.id, comment);
      await refreshSale();
      setSaveMessage('Comment added.');
    } catch (error) {
      setEditMessage(error instanceof Error ? error.message : 'Unable to add comment. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOwnerAssign = async (userId: string) => {
    if (!sale) {
      return;
    }

    setIsSubmitting(true);
    setSaveMessage('');
    setEditMessage('');
    try {
      await store.assignOwner(sale.id, userId);
      await refreshSale();
      setSaveMessage('Owner assigned.');
    } catch (error) {
      setEditMessage(error instanceof Error ? error.message : 'Unable to assign owner. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!id) {
    return (
      <SalesPageErrorBoundary screenName="Sale details" onRetry={() => {}}>
        <section>
          <h2 className="mb-4 text-2xl font-bold text-slate-900">Sale Details</h2>
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800" role="alert">
            Missing sale identifier in route.
          </p>
        </section>
      </SalesPageErrorBoundary>
    );
  }

  return (
    <SalesPageErrorBoundary
      screenName="Sale details"
      onRetry={() => void query.refetch()}
      retryMessage="Retrying with latest sale details."
    >
      <section className="space-y-5">
        <Link
          to="/dashboard/sales"
          className="inline-flex text-sm font-semibold text-sky-700 transition hover:text-sky-900 hover:underline"
        >
          ← Back to Sales
        </Link>

        <header>
          <h2 className="text-2xl font-bold text-slate-900">Sale Details</h2>
        </header>

        <SalesLoadingStates
          loading={query.loading}
          hasData={Boolean(sale)}
          hasError={Boolean(query.error)}
          errorMessage={query.error ? `Unable to load sale details. ${query.error.message}` : undefined}
          emptyMessage="Sale not found."
          onRetry={() => void query.refetch()}
        >
          {sale ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{sale.externalSaleId}</h3>
                  <p className="mt-1 text-sm text-slate-500">{saleDisplayLabel(sale)}</p>
                </div>
                <div className="text-sm text-slate-600">
                  <p>Created: {formatDate(sale.createdAt)}</p>
                  <p>Updated: {formatDate(sale.updatedAt)}</p>
                </div>
              </div>

              {saveMessage ? (
                <p className="mb-3 rounded-md border border-slate-100 bg-slate-50 p-2 text-sm text-slate-700">{saveMessage}</p>
              ) : null}
              {editMessage ? (
                <p className="mb-3 rounded-md border border-rose-100 bg-rose-50 p-2 text-sm text-rose-700">{editMessage}</p>
              ) : null}

              <ul className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                <li><strong className="text-slate-500">Status:</strong> {sale.status}</li>
                <li><strong className="text-slate-500">Problem:</strong> {sale.problemReason || '—'}</li>
                <li><strong className="text-slate-500">Delay At:</strong> {formatDate(sale.deliveryDelayAt)}</li>
                <li><strong className="text-slate-500">Owner:</strong> {sale.filledBy?.fullName || '—'}</li>
              </ul>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <SaleEditableFields sale={sale} isSubmitting={isBusy} onSubmit={handleOperationalSubmit} />

                <div className="space-y-4">
                  <FilledBySelector
                    sale={sale}
                    users={store.users}
                    onAssignOwner={handleOwnerAssign}
                    isSubmitting={isBusy}
                    disabled={store.users.length === 0}
                  />
                  <SaleTags
                    sale={sale}
                    onAddTag={handleTagAdd}
                    onRemoveTag={handleTagRemove}
                    isSubmitting={isBusy}
                    disabled={isBusy}
                  />
                </div>
              </div>

              <h4 className="mt-6 mb-2 text-base font-semibold text-slate-800">Source Payload</h4>
              <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                {formatPayload(sale.sourcePayload)}
              </pre>

              <div className="mt-6">
                <SaleComments comments={sale.comments} onAddComment={handleCommentAdd} isSubmitting={isBusy} />
              </div>
            </div>
          ) : null}
        </SalesLoadingStates>
      </section>
    </SalesPageErrorBoundary>
  );
};
