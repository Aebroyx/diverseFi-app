'use client';

import { forwardRef } from 'react';
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { Label } from '@/components/ui/shadcn/label';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  name?: string;
  hideLabel?: boolean;
  size?: 'sm' | 'md';
}

const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      label,
      options,
      value,
      onChange,
      error,
      helperText,
      required,
      disabled,
      placeholder = 'Select an option',
      className = '',
      name,
      hideLabel = false,
      size = 'md',
    },
    ref
  ) => {
    const selectId = name || label.replace(/\s+/g, '-').toLowerCase();

    return (
      <div className={cn(hideLabel ? '' : 'space-y-2', className)}>
        {!hideLabel && (
          <Label htmlFor={selectId} className="text-sm font-medium">
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </Label>
        )}
        <ShadcnSelect
          value={value || undefined}
          onValueChange={(nextValue) => nextValue && onChange(nextValue)}
          disabled={disabled}
        >
          <SelectTrigger
            ref={ref}
            id={selectId}
            name={name}
            size={size === 'sm' ? 'sm' : 'default'}
            aria-invalid={!!error}
            className="w-full"
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </ShadcnSelect>
        {(error || helperText) && (
          <p className={cn('text-sm', error ? 'text-destructive' : 'text-muted-foreground')}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
