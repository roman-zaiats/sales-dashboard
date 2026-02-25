import type { Sale } from '@/generated/graphql';

type UserForAssignment = {
  id: string;
  authSub: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
};

type FilledBySelectorProps = {
  sale: Sale;
  users: UserForAssignment[];
  onAssignOwner: (userId: string) => Promise<unknown>;
  isSubmitting: boolean;
  disabled?: boolean;
};

export const FilledBySelector = ({
  sale,
  users,
  onAssignOwner,
  isSubmitting,
  disabled,
}: FilledBySelectorProps) => {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="text-base font-semibold text-slate-900">Owner</h4>
      <div className="mt-3 flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Assign filled-by
          <select
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-sky-200 transition focus:ring-2"
            value={sale.filledBy?.id ?? ''}
            onChange={event =>
              event.target.value ? void onAssignOwner(event.target.value) : Promise.resolve()
            }
            disabled={isSubmitting || disabled || users.length === 0}
          >
            <option value="">Unassigned</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.fullName}
              </option>
            ))}
          </select>
        </label>
        {users.length === 0 ? (
          <p className="text-xs text-amber-700">No users are available for assignment.</p>
        ) : null}
        {sale.filledBy ? (
          <p className="text-sm text-slate-500">Current owner: {sale.filledBy.fullName}</p>
        ) : (
          <p className="text-sm text-slate-500">Current owner: —</p>
        )}
      </div>
    </section>
  );
};

