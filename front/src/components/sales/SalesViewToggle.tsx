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
    <fieldset className="flex gap-4 px-3 py-2 text-sm font-medium text-slate-700">
      <legend className="sr-only">View</legend>
      <label className="inline-flex items-center gap-2">
        <input
          className="h-4 w-4 text-sky-600"
          type="radio"
          value="table"
          checked={value === 'table'}
          onChange={handleChange}
        />
        Table
      </label>
      <label className="inline-flex items-center gap-2">
        <input
          className="h-4 w-4 text-sky-600"
          type="radio"
          value="board"
          checked={value === 'board'}
          onChange={handleChange}
        />
        Board
      </label>
    </fieldset>
  );
};
