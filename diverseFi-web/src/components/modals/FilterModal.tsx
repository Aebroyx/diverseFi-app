'use client';

import { useState } from 'react';
import { Filter, Plus, X } from 'lucide-react';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { Button } from '@/components/ui/shadcn/button';
import { Input as ShadcnInput } from '@/components/ui/shadcn/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/shadcn/popover';
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { Badge } from '@/components/ui/shadcn/badge';
import { cn } from '@/lib/utils';

interface FilterItem {
  field: string;
  value: string;
}

interface FieldOption {
  label: string;
  value: string;
  type: 'select' | 'text' | 'date';
  options?: { value: string; label: string }[];
}

interface FilterModalProps {
  onApply: (filters: FilterItem[]) => void;
  fields: FieldOption[];
  buttonClassName?: string;
}

const FilterModal: React.FC<FilterModalProps> = ({ onApply, fields, buttonClassName }) => {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FilterItem[]>([]);
  const [selectedField, setSelectedField] = useState('');
  const [filterValue, setFilterValue] = useState('');

  const handleAddFilter = () => {
    if (!selectedField || !filterValue) return;
    const newFilters = [...filters, { field: selectedField, value: filterValue }];
    setFilters(newFilters);
    setFilterValue('');
    setSelectedField('');
    onApply(newFilters);
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = filters.filter((_, idx) => idx !== index);
    setFilters(newFilters);
    onApply(newFilters);
  };

  const handleReset = () => {
    setFilters([]);
    setFilterValue('');
    setSelectedField('');
    onApply([]);
  };

  const selectedFieldType = fields.find((f) => f.value === selectedField)?.type || 'text';
  const availableFields = fields.filter((field) => !filters.some((f) => f.field === field.value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" className={cn('gap-2', buttonClassName)} />
        }
      >
        <Filter className="h-4 w-4" />
        Filter
        {filters.length > 0 && (
          <Badge variant="default" className="ml-1 rounded-full px-2 py-0">
            {filters.length}
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[350px] p-4 md:w-[500px] lg:w-[540px]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center text-lg font-medium">
            <Filter className="mr-2 h-5 w-5" />
            Filter
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <ShadcnSelect
            value={selectedField || undefined}
            onValueChange={(value) => setSelectedField(value ?? '')}
          >
            <SelectTrigger className="w-full sm:w-1/2">
              <SelectValue placeholder="Select Field" />
            </SelectTrigger>
            <SelectContent>
              {availableFields.map((field) => (
                <SelectItem key={field.value} value={field.value}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </ShadcnSelect>

          {selectedFieldType === 'select' ? (
            <ShadcnSelect
              value={filterValue || undefined}
              onValueChange={(value) => setFilterValue(value ?? '')}
            >
              <SelectTrigger className="w-full sm:w-2/3">
                <SelectValue placeholder="Select Value" />
              </SelectTrigger>
              <SelectContent>
                {fields
                  .find((f) => f.value === selectedField)
                  ?.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </ShadcnSelect>
          ) : selectedFieldType === 'date' ? (
            <ShadcnInput
              type="date"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="w-full sm:w-2/3"
            />
          ) : (
            <ShadcnInput
              type="text"
              placeholder="Filter Value"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="w-full sm:w-2/3"
            />
          )}

          <PrimaryButton onClick={handleAddFilter} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add
          </PrimaryButton>
        </div>

        <ul className="my-6 h-36 space-y-2 overflow-y-auto">
          {filters.map((f, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between border-b border-border pb-1"
            >
              <div className="text-foreground">
                <span className="font-medium">
                  {fields.find((field) => field.value === f.field)?.label || f.field}
                </span>{' '}
                - <span className="italic text-primary">{f.value}</span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleRemoveFilter(idx)}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}

          {filters.length === 0 && (
            <li className="text-center italic text-muted-foreground">No filters applied.</li>
          )}
        </ul>

        {filters.length > 0 && (
          <div className="text-center">
            <SecondaryButton onClick={handleReset} variant="danger">
              Clear All
            </SecondaryButton>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default FilterModal;
