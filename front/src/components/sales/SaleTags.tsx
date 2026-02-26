import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Sale } from '@/generated/graphql';

type SaleTagsProps = {
  sale: Sale;
  onAddTag: (tagName: string) => Promise<unknown>;
  onRemoveTag: (tagName: string) => Promise<unknown>;
  isSubmitting: boolean;
  disabled?: boolean;
};

export const SaleTags = ({ sale, onAddTag, onRemoveTag, isSubmitting, disabled }: SaleTagsProps) => {
  const [newTag, setNewTag] = useState('');

  const submitTag = async () => {
    const normalized = newTag.trim();
    if (!normalized) {
      return;
    }

    if (sale.dashboardTags.some(tag => tag.name.toLowerCase() === normalized.toLowerCase())) {
      setNewTag('');
      return;
    }

    await onAddTag(normalized);
    setNewTag('');
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h4 className="text-sm font-semibold">Tags</h4>

      <div className="mt-3 flex flex-wrap gap-2">
        {sale.dashboardTags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tags added.</p>
        ) : (
          sale.dashboardTags.map(tag => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-sm text-secondary-foreground"
            >
              {tag.name}
              <button
                type="button"
                className="text-muted-foreground transition hover:text-destructive"
                onClick={() => void onRemoveTag(tag.name)}
                disabled={isSubmitting || disabled}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Input
          className="min-w-48 flex-1"
          placeholder="Add a tag"
          value={newTag}
          onChange={event => setNewTag(event.target.value)}
          disabled={isSubmitting || disabled}
        />
        <Button
          type="button"
          variant="secondary"
          size="default"
          onClick={() => void submitTag()}
          disabled={isSubmitting || disabled || !newTag.trim()}
        >
          Add tag
        </Button>
      </div>
    </section>
  );
};
