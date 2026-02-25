import { type ChangeEvent } from 'react';

type SalesView = 'table' | 'board';

type SalesViewToggleProps = {
  value: SalesView;
  onChange: (value: SalesView) => void;
};

export const SalesViewToggle = ({ value, onChange }: SalesViewToggleProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value as SalesView);
  };

  return (
    <fieldset className="inline-flex rounded-md border border-input bg-background p-1">
      <legend className="sr-only">View</legend>
      <label className="inline-flex cursor-pointer">
        <input
          className="peer sr-only"
          type="radio"
          value="table"
          checked={value === 'table'}
          onChange={handleChange}
        />
        <span
          className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition ${
            value === 'table'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          Table
        </span>
      </label>
      <label className="inline-flex cursor-pointer">
        <input
          className="peer sr-only"
          type="radio"
          value="board"
          checked={value === 'board'}
          onChange={handleChange}
        />
        <span
          className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition ${
            value === 'board'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          Board
        </span>
      </label>
    </fieldset>
  );
};
