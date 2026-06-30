'use client';

import { forwardRef, useMemo } from 'react';
import ReactSelect, {
  StylesConfig,
  components,
  DropdownIndicatorProps,
  SelectInstance,
  GroupBase,
} from 'react-select';
import { ChevronsUpDown } from 'lucide-react';
import { Label } from '@/components/ui/shadcn/label';
import { useTheme } from '@/components/ThemeProvider';
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

const DropdownIndicator = (props: DropdownIndicatorProps<SelectOption, false>) => (
  <components.DropdownIndicator {...props}>
    <ChevronsUpDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
  </components.DropdownIndicator>
);

function buildSelectStyles(
  isSmall: boolean,
  isDarkMode: boolean,
  hasError: boolean
): StylesConfig<SelectOption, false> {
  const minHeight = isSmall ? '32px' : '40px';
  const controlBg = isDarkMode
    ? 'color-mix(in srgb, var(--input) 30%, transparent)'
    : 'transparent';

  return {
    control: (base, state) => ({
      ...base,
      minHeight,
      borderRadius: 'var(--radius-lg)',
      borderColor: hasError
        ? 'var(--destructive)'
        : state.isFocused
          ? 'var(--ring)'
          : 'var(--border)',
      backgroundColor: hasError
        ? 'color-mix(in srgb, var(--destructive) 10%, var(--background))'
        : controlBg,
      boxShadow: state.isFocused
        ? hasError
          ? '0 0 0 3px color-mix(in srgb, var(--destructive) 20%, transparent)'
          : '0 0 0 3px color-mix(in srgb, var(--ring) 50%, transparent)'
        : 'none',
      '&:hover': {
        borderColor: hasError
          ? 'var(--destructive)'
          : state.isFocused
            ? 'var(--ring)'
            : 'var(--border)',
      },
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
      opacity: state.isDisabled ? 0.5 : 1,
      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    }),
    valueContainer: (base) => ({
      ...base,
      padding: isSmall ? '0 0.625rem' : '0 0.625rem',
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
      color: 'var(--foreground)',
    }),
    placeholder: (base) => ({
      ...base,
      color: 'var(--muted-foreground)',
    }),
    singleValue: (base) => ({
      ...base,
      color: hasError ? 'var(--destructive)' : 'var(--foreground)',
    }),
    menu: (base) => ({
      ...base,
      borderRadius: 'var(--radius-lg)',
      marginTop: '0.25rem',
      border: '1px solid var(--border)',
      backgroundColor: 'var(--popover)',
      boxShadow:
        '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      overflow: 'hidden',
      zIndex: 9999,
    }),
    menuList: (base) => ({
      ...base,
      padding: '0.25rem',
      maxHeight: '240px',
    }),
    option: (base, state) => ({
      ...base,
      padding: isSmall ? '0.375rem 0.5rem' : '0.5rem 0.625rem',
      fontSize: isSmall ? '0.8125rem' : '0.875rem',
      borderRadius: 'calc(var(--radius-lg) - 2px)',
      backgroundColor: state.isSelected
        ? 'color-mix(in srgb, var(--primary) 12%, transparent)'
        : state.isFocused
          ? 'var(--accent)'
          : 'transparent',
      color: state.isSelected ? 'var(--primary)' : 'var(--foreground)',
      fontWeight: state.isSelected ? 500 : 400,
      cursor: 'pointer',
      '&:active': {
        backgroundColor: 'color-mix(in srgb, var(--primary) 18%, transparent)',
      },
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    dropdownIndicator: (base) => ({
      ...base,
      padding: isSmall ? '0.25rem 0.5rem' : '0.375rem 0.5rem',
    }),
    noOptionsMessage: (base) => ({
      ...base,
      padding: '0.5rem 0.75rem',
      color: 'var(--muted-foreground)',
      fontSize: '0.875rem',
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
  };
}

const Select = forwardRef<
  SelectInstance<SelectOption, false, GroupBase<SelectOption>>,
  SelectProps
>(
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
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === 'dark';
    const selectedOption = options.find((option) => option.value === value) || null;
    const selectId = name || label.replace(/\s+/g, '-').toLowerCase();
    const isSmall = size === 'sm';

    const styles = useMemo(
      () => buildSelectStyles(isSmall, isDarkMode, !!error),
      [isSmall, isDarkMode, error]
    );

    return (
      <div className={cn('w-full min-w-0', hideLabel ? '' : 'space-y-2', className)}>
        {!hideLabel && (
          <Label htmlFor={selectId} className="text-sm font-medium">
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </Label>
        )}
        <ReactSelect<SelectOption, false>
          ref={ref}
          inputId={selectId}
          name={name}
          options={options}
          value={selectedOption}
          onChange={(option) => option && onChange(option.value)}
          placeholder={placeholder}
          isDisabled={disabled}
          isClearable={false}
          isSearchable
          styles={styles}
          components={{ DropdownIndicator }}
          classNamePrefix="react-select"
          noOptionsMessage={() => 'No options available'}
          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
          menuPosition="fixed"
          menuPlacement="auto"
        />
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
