import { type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes, forwardRef } from 'react';

export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className = '', ...props }, ref) => (
    <div className="sales-table-shell">
      <table
        ref={ref}
        className={`sales-table ${className}`.trim()}
        {...props}
      />
    </div>
  ),
);

Table.displayName = 'Table';

export const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', ...props }, ref) => <thead ref={ref} className={`sales-table-head ${className}`.trim()} {...props} />,
);

TableHeader.displayName = 'TableHeader';

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', ...props }, ref) => <tbody ref={ref} className={`${className}`.trim()} {...props} />,
);

TableBody.displayName = 'TableBody';

export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className = '', ...props }, ref) => <th ref={ref} className={`sales-table-head-cell ${className}`.trim()} {...props} />,
);

TableHead.displayName = 'TableHead';

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className = '', ...props }, ref) => <tr ref={ref} className={`sales-table-row ${className}`.trim()} {...props} />,
);

TableRow.displayName = 'TableRow';

export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className = '', ...props }, ref) => <td ref={ref} className={`sales-table-cell ${className}`.trim()} {...props} />,
);

TableCell.displayName = 'TableCell';
