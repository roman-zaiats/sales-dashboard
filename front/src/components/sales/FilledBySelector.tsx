import type { Sale } from '@/generated/graphql';
import { Select } from '@/components/ui/select';

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
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h4 className="text-sm font-semibold">Owner</h4>
      <div className="mt-3 flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-sm text-muted-foreground">
          Assign filled-by
          <Select
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
          </Select>
        </label>
        {users.length === 0 ? (
          <p className="text-xs text-muted-foreground">No users are available for assignment.</p>
        ) : null}
        {sale.filledBy ? (
          <p className="text-sm text-muted-foreground">Current owner: {sale.filledBy.fullName}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Current owner: —</p>
        )}
      </div>
    </section>
  );
};
