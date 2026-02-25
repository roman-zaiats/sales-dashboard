import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { type Sale, type SaleStatus } from '@/generated/graphql';

type SaleEditableFieldsProps = {
  sale: Sale;
  onSubmit: (next: {
    status: SaleStatus;
    deliveryDelayAt: string | null;
    problemReason: string | null;
  }) => Promise<void>;
  isSubmitting: boolean;
  disabled?: boolean;
};

const toDateTimeLocalValue = (value: string | null | undefined): string => {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return '';
  }

  const year = String(parsed.getFullYear());
  const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
  const day = `${parsed.getDate()}`.padStart(2, '0');
  const hour = `${parsed.getHours()}`.padStart(2, '0');
  const minute = `${parsed.getMinutes()}`.padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}`;
};

const toIsoTimestamp = (value: string): string | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return null;
  }

  return parsed.toISOString();
};

export const SaleEditableFields = ({
  sale,
  onSubmit,
  isSubmitting,
  disabled,
}: SaleEditableFieldsProps) => {
  const [status, setStatus] = useState<SaleStatus>(sale.status);
  const [deliveryDelayAt, setDeliveryDelayAt] = useState<string>(toDateTimeLocalValue(sale.deliveryDelayAt));
  const [problemReason, setProblemReason] = useState<string>(sale.problemReason ?? '');

  useEffect(() => {
    setStatus(sale.status);
    setDeliveryDelayAt(toDateTimeLocalValue(sale.deliveryDelayAt));
    setProblemReason(sale.problemReason ?? '');
  }, [sale.id, sale.status, sale.deliveryDelayAt, sale.problemReason]);

  const canSubmit = useMemo(() => {
    return (
      !isSubmitting &&
      !disabled &&
      (status !== sale.status ||
        toDateTimeLocalValue(sale.deliveryDelayAt) !== deliveryDelayAt ||
        problemReason !== (sale.problemReason ?? ''))
    );
  }, [status, deliveryDelayAt, problemReason, isSubmitting, disabled, sale]);

  const onSubmitInternal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    await onSubmit({
      status,
      deliveryDelayAt: toIsoTimestamp(deliveryDelayAt),
      problemReason: problemReason.trim() ? problemReason.trim() : null,
    });
  };

  return (
    <form className="mt-5 rounded-xl border border-border bg-card p-4 shadow-sm" onSubmit={onSubmitInternal}>
      <h4 className="text-sm font-semibold">Edit operational fields</h4>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-muted-foreground">
          Status
          <Select
            value={status}
            onChange={event => setStatus(event.target.value as SaleStatus)}
            disabled={isSubmitting || disabled}
          >
            <option value="RECEIVED">RECEIVED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="DELAYED">DELAYED</option>
            <option value="PROBLEM">PROBLEM</option>
          </Select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-muted-foreground">
          Delivery delay
          <Input
            type="datetime-local"
            value={deliveryDelayAt}
            onChange={event => setDeliveryDelayAt(event.target.value)}
            disabled={isSubmitting || disabled}
          />
          <span className="text-xs text-muted-foreground">Use blank value to clear the delay.</span>
        </label>

        <label className="md:col-span-2 flex flex-col gap-1 text-sm text-muted-foreground">
          Problem reason
          <textarea
            className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={problemReason}
            onChange={event => setProblemReason(event.target.value)}
            rows={4}
            disabled={isSubmitting || disabled}
          />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button type="submit" variant="default" size="md" disabled={!canSubmit}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
        <span className="text-sm text-muted-foreground">{canSubmit ? 'Changes detected' : 'No changes to save'}</span>
      </div>
    </form>
  );
};
