import { useState } from 'react';

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

    if (sale.tags.some(tag => tag.name.toLowerCase() === normalized.toLowerCase())) {
      setNewTag('');
      return;
    }

    await onAddTag(normalized);
    setNewTag('');
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="text-base font-semibold text-slate-900">Tags</h4>

      <div className="mt-3 flex flex-wrap gap-2">
        {sale.tags.length === 0 ? (
          <p className="text-sm text-slate-500">No tags added.</p>
        ) : (
          sale.tags.map(tag => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
            >
              {tag.name}
              <button
                type="button"
                className="text-slate-500 transition hover:text-rose-600"
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
        <input
          className="min-w-48 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-sky-200 transition focus:ring-2"
          placeholder="Add a tag"
          value={newTag}
          onChange={event => setNewTag(event.target.value)}
          disabled={isSubmitting || disabled}
        />
        <button
          type="button"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          onClick={() => void submitTag()}
          disabled={isSubmitting || disabled || !newTag.trim()}
        >
          Add tag
        </button>
      </div>
    </section>
  );
};

