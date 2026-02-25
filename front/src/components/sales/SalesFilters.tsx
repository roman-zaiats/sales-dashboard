import type { SaleStatus } from '@/generated/graphql';

type SalesFiltersProps = {
  search: string;
  status?: SaleStatus;
  hasDelay?: boolean;
  overdueOnly?: boolean;
  tagIds: string[];
  onSearchChange: (value: string) => void;
  onStatusChange: (status?: SaleStatus) => void;
  onHasDelayChange: (value?: boolean) => void;
  onOverdueOnlyChange: (value?: boolean) => void;
  onTagsChange: (tagIds: string[]) => void;
  isHasDelayDisabled?: boolean;
};

export const SalesFilters = ({
  search,
  status,
  hasDelay,
  overdueOnly,
  tagIds,
  onSearchChange,
  onStatusChange,
  onHasDelayChange,
  onOverdueOnlyChange,
  onTagsChange,
  isHasDelayDisabled,
}: SalesFiltersProps) => {
  const clearAllFilters = () => {
    onSearchChange('');
    onStatusChange(undefined);
    onHasDelayChange(undefined);
    onOverdueOnlyChange(undefined);
    onTagsChange([]);
  };

  return (
    <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3 lg:grid-cols-6">
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Search
        <input
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-sky-200 transition focus:ring-2"
          value={search}
          onChange={event => onSearchChange(event.target.value)}
          placeholder="Search by listing, event, email, or external ID"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Status
        <select
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-sky-200 transition focus:ring-2"
          value={status ?? 'ALL'}
          onChange={event =>
            onStatusChange(event.target.value === 'ALL' ? undefined : (event.target.value as SaleStatus))
          }
        >
          <option value="ALL">All</option>
          <option value="RECEIVED">Received</option>
          <option value="COMPLETED">Completed</option>
          <option value="DELAYED">Delayed</option>
          <option value="PROBLEM">Problem</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Delay
        <select
          className={`rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-sky-200 transition focus:ring-2 ${
            isHasDelayDisabled ? 'cursor-not-allowed opacity-70' : ''
          }`}
          value={hasDelay === undefined ? 'ALL' : String(hasDelay)}
          onChange={event => {
            const value = event.target.value;
            if (value === 'ALL') {
              onHasDelayChange(undefined);
              return;
            }
            onHasDelayChange(value === 'true');
          }}
          disabled={Boolean(isHasDelayDisabled)}
        >
          <option value="ALL">All</option>
          <option value="true">Has delay</option>
          <option value="false">No delay</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Overdue only
        <select
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-sky-200 transition focus:ring-2"
          value={overdueOnly === undefined ? 'ALL' : String(overdueOnly)}
          onChange={event => {
            const value = event.target.value;
            if (value === 'ALL') {
              onOverdueOnlyChange(undefined);
              return;
            }
            onOverdueOnlyChange(value === 'true');
          }}
        >
          <option value="ALL">All</option>
          <option value="true">Only overdue</option>
          <option value="false">Include not overdue</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2 lg:col-span-1">
        Tag IDs (comma-separated)
        <input
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-sky-200 transition focus:ring-2"
          value={tagIds.join(',')}
          onChange={event =>
            onTagsChange(
              event.target.value
                .split(',')
                .map(value => value.trim())
                .filter(Boolean),
            )
          }
          placeholder="e.g. tagId1, tagId2"
        />
      </label>

      <button
        className="self-end rounded-md border border-slate-200 bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        type="button"
        onClick={clearAllFilters}
      >
        Clear filters
      </button>
    </div>
  );
};
