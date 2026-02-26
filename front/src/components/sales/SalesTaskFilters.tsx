import { useMemo } from 'react';

import { PlusCircle, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type FilterOption = {
  value: string;
  label: string;
  count?: number;
};

type FacetedFilterProps = {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (nextValues: string[]) => void;
  searchPlaceholder: string;
};

type SalesTaskFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  statusOptions: FilterOption[];
  selectedStatuses: string[];
  onStatusesChange: (nextValues: string[]) => void;
  delayOptions: FilterOption[];
  selectedDelay: string[];
  onDelayChange: (nextValues: string[]) => void;
  overdueOptions: FilterOption[];
  selectedOverdue: string[];
  onOverdueChange: (nextValues: string[]) => void;
  tagOptions: FilterOption[];
  selectedTagIds: string[];
  onTagIdsChange: (nextValues: string[]) => void;
  showReset: boolean;
  onReset: () => void;
};

const FacetedFilter = ({
  title,
  options,
  selectedValues,
  onChange,
  searchPlaceholder,
}: FacetedFilterProps) => {
  const selectedLookup = useMemo(() => new Set(selectedValues), [selectedValues]);

  const toggleOption = (value: string): void => {
    if (selectedLookup.has(value)) {
      onChange(selectedValues.filter((selectedValue) => selectedValue !== value));
      return;
    }

    onChange([...selectedValues, value]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-2 border-dashed"
        >
          <PlusCircle className="h-4 w-4" />
          <span>{title}</span>
          {selectedValues.length > 0 ? (
            <Badge variant="secondary" className="rounded-sm px-1 font-normal">
              {selectedValues.length}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value}`}
                  onSelect={() => toggleOption(option.value)}
                >
                  <Checkbox checked={selectedLookup.has(option.value)} className="pointer-events-none mr-2" />
                  <span className="flex-1">{option.label}</span>
                  {typeof option.count === 'number' ? (
                    <span className="text-xs text-muted-foreground">{option.count}</span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
            {selectedValues.length > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onChange([])}
                    className="justify-center text-center"
                  >
                    Reset
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export const SalesTaskFilters = ({
  search,
  onSearchChange,
  statusOptions,
  selectedStatuses,
  onStatusesChange,
  delayOptions,
  selectedDelay,
  onDelayChange,
  overdueOptions,
  selectedOverdue,
  onOverdueChange,
  tagOptions,
  selectedTagIds,
  onTagIdsChange,
  showReset,
  onReset,
}: SalesTaskFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
      <div className="relative w-full max-w-xs">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Filter tasks..."
          className="h-9 pl-8"
        />
      </div>

      <FacetedFilter
        title="Status"
        options={statusOptions}
        selectedValues={selectedStatuses}
        onChange={onStatusesChange}
        searchPlaceholder="Search status..."
      />
      <FacetedFilter
        title="Delay"
        options={delayOptions}
        selectedValues={selectedDelay}
        onChange={onDelayChange}
        searchPlaceholder="Search delay..."
      />
      <FacetedFilter
        title="Overdue"
        options={overdueOptions}
        selectedValues={selectedOverdue}
        onChange={onOverdueChange}
        searchPlaceholder="Search overdue..."
      />
      <FacetedFilter
        title="Tags"
        options={tagOptions}
        selectedValues={selectedTagIds}
        onChange={onTagIdsChange}
        searchPlaceholder="Search tags..."
      />

      {showReset ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9"
          onClick={onReset}
        >
          Reset
        </Button>
      ) : null}
    </div>
  );
};
