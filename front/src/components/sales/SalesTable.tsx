import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { Sale } from '@/generated/graphql';
import { saleDisplayLabel } from '@/lib/sales/sales-utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export type SalesTableSortField =
  | 'identifier'
  | 'status'
  | 'createdAt'
  | 'delay'
  | 'problem'
  | 'tags'
  | 'owner';

export type SalesTableSortState = {
  field: SalesTableSortField;
  direction: 'asc' | 'desc';
};

type SalesTableProps = {
  sales: Sale[];
  selectedRowIdSet: Set<string>;
  allRowsSelected: boolean;
  someRowsSelected: boolean;
  onToggleRow: (saleId: string, checked: boolean) => void;
  onToggleAllRows: (checked: boolean) => void;
  sortState: SalesTableSortState;
  onSortChange: (field: SalesTableSortField) => void;
};

type SortHeaderProps = {
  label: string;
  field: SalesTableSortField;
  sortState: SalesTableSortState;
  onSortChange: (field: SalesTableSortField) => void;
  className?: string;
};

const formatDelay = (date: string | null | undefined): string => {
  if (!date) {
    return '—';
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.valueOf())) {
    return '—';
  }

  return parsed.toLocaleString();
};

const SortHeader = ({ label, field, sortState, onSortChange, className }: SortHeaderProps) => {
  const sortIcon =
    sortState.field !== field ? (
      <ArrowUpDown className="h-4 w-4" />
    ) : sortState.direction === 'asc' ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );

  return (
    <TableHead className={className}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onSortChange(field)}
        className="-ml-2 h-8 px-2 text-muted-foreground hover:text-foreground"
      >
        <span>{label}</span>
        {sortIcon}
      </Button>
    </TableHead>
  );
};

export const SalesTable = ({
  sales,
  selectedRowIdSet,
  allRowsSelected,
  someRowsSelected,
  onToggleRow,
  onToggleAllRows,
  sortState,
  onSortChange,
}: SalesTableProps) => {
  return (
    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                aria-label="Select all rows"
                checked={allRowsSelected ? true : someRowsSelected ? 'indeterminate' : false}
                onCheckedChange={(checked) => onToggleAllRows(checked === true)}
              />
            </TableHead>
            <SortHeader label="Identifier" field="identifier" sortState={sortState} onSortChange={onSortChange} />
            <SortHeader label="Status" field="status" sortState={sortState} onSortChange={onSortChange} />
            <SortHeader label="Created" field="createdAt" sortState={sortState} onSortChange={onSortChange} />
            <SortHeader label="Delay" field="delay" sortState={sortState} onSortChange={onSortChange} />
            <SortHeader label="Problem" field="problem" sortState={sortState} onSortChange={onSortChange} />
            <SortHeader label="Tags" field="tags" sortState={sortState} onSortChange={onSortChange} />
            <SortHeader label="Owner" field="owner" sortState={sortState} onSortChange={onSortChange} />
            <TableHead>Open</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-muted-foreground">
                No sales were returned for the current filters.
              </TableCell>
            </TableRow>
          ) : (
            sales.map((sale) => {
              const isSelected = selectedRowIdSet.has(sale.id);

              return (
                <TableRow key={sale.id} data-state={isSelected ? 'selected' : undefined}>
                  <TableCell>
                    <Checkbox
                      aria-label={`Select ${saleDisplayLabel(sale)}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => onToggleRow(sale.id, checked === true)}
                    />
                  </TableCell>
                  <TableCell>{saleDisplayLabel(sale)}</TableCell>
                  <TableCell>{sale.status}</TableCell>
                  <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{formatDelay(sale.deliveryDelayAt)}</TableCell>
                  <TableCell>{sale.problemReason || '—'}</TableCell>
                  <TableCell>{sale.dashboardTags.map((tag) => tag.name).join(', ') || '—'}</TableCell>
                  <TableCell>{sale.filledBy?.fullName || '—'}</TableCell>
                  <TableCell>
                    <Link className="text-primary hover:text-foreground" to={`/dashboard/sale/${sale.id}`}>
                      Open
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
