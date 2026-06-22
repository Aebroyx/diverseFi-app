'use client';

import { forwardRef } from 'react';
import ReactSelect, { StylesConfig, components, DropdownIndicatorProps, SelectInstance, GroupBase } from 'react-select';
import { ChevronUpDownIcon } from '@heroicons/react/16/solid';
import { useTheme } from '../ThemeProvider';

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

// Custom dropdown indicator with Heroicon
const DropdownIndicator = (props: DropdownIndicatorProps<SelectOption, false>) => {
  return (
    <components.DropdownIndicator {...props}>
      <ChevronUpDownIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
    </components.DropdownIndicator>
  );
};

const Select = forwardRef<SelectInstance<SelectOption, false, GroupBase<SelectOption>>, SelectProps>(
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
    const selectedOption = options.find((option) => option.value === value) || null;
    const selectId = name || label.replace(/\s+/g, '-').toLowerCase();

    const isSmall = size === 'sm';

    // Custom styles for react-select to match your design system
    const customStyles: StylesConfig<SelectOption, false> = {
      control: (base, state) => ({
        ...base,
        minHeight: isSmall ? '30px' : '38px',
        borderRadius: '0.375rem', // rounded-md
        borderColor: error
          ? 'rgb(252 165 165)' // red-300
          : state.isFocused
          ? 'var(--color-primary, rgb(99 102 241))' // primary color
          : 'rgb(209 213 219)', // gray-300
        backgroundColor: error
          ? 'rgb(254 242 242)' // red-50
          : 'white',
        boxShadow: state.isFocused
          ? error
            ? '0 0 0 1px rgba(239, 68, 68, 0.2)' // red ring (1px)
            : '0 0 0 1px rgba(99, 102, 241, 0.2)' // primary ring (1px)
          : '0 1px 2px 0 rgb(0 0 0 / 0.05)', // shadow-sm
        '&:hover': {
          borderColor: error
            ? 'rgb(252 165 165)'
            : state.isFocused
            ? 'var(--color-primary, rgb(99 102 241))'
            : 'rgb(209 213 219)',
        },
        cursor: state.isDisabled ? 'not-allowed' : 'pointer',
        opacity: state.isDisabled ? 0.6 : 1,
      }),
      valueContainer: (base) => ({
        ...base,
        padding: isSmall ? '0.25rem 0.5rem' : '0.5rem 0.75rem', // py-1 px-2 : py-2 px-3
      }),
      input: (base) => ({
        ...base,
        margin: 0,
        padding: 0,
        color: 'rgb(17 24 39)', // gray-900
      }),
      placeholder: (base) => ({
        ...base,
        color: 'rgb(156 163 175)', // gray-400
      }),
      singleValue: (base) => ({
        ...base,
        color: error ? 'rgb(127 29 29)' : 'rgb(17 24 39)', // red-900 : gray-900
      }),
      menu: (base) => ({
        ...base,
        borderRadius: '0.375rem', // rounded-md
        marginTop: '0.25rem',
        border: '1px solid rgb(229 231 235)', // gray-200
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        overflow: 'hidden',
        zIndex: 9999,
      }),
      menuList: (base) => ({
        ...base,
        padding: '0.25rem 0',
        maxHeight: '240px',
      }),
      option: (base, state) => ({
        ...base,
        padding: isSmall ? '0.5rem 0.75rem' : '0.625rem 1rem',
        fontSize: isSmall ? '0.8125rem' : '0.875rem',
        backgroundColor: state.isSelected
          ? 'rgba(99, 102, 241, 0.05)'
          : state.isFocused
          ? 'rgba(99, 102, 241, 0.1)'
          : 'white',
        color: state.isSelected || state.isFocused
          ? 'var(--color-primary, rgb(99 102 241))'
          : 'rgb(17 24 39)',
        fontWeight: state.isSelected ? 500 : 400,
        cursor: 'pointer',
        '&:active': {
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
        },
      }),
      indicatorSeparator: () => ({
        display: 'none',
      }),
      dropdownIndicator: (base) => ({
        ...base,
        padding: isSmall ? '0.25rem' : '0.5rem',
        color: 'rgb(156 163 175)',
      }),
      noOptionsMessage: (base) => ({
        ...base,
        padding: '0.5rem 1rem',
        color: 'rgb(107 114 128)', // gray-500
        fontSize: '0.875rem',
      }),
      menuPortal: (base) => ({
        ...base,
        zIndex: 9999,
      }),
    };

    // Dark mode styles
    const darkModeStyles: StylesConfig<SelectOption, false> = {
      control: (base, state) => ({
        ...base,
        minHeight: isSmall ? '30px' : '38px',
        borderRadius: '0.375rem', // rounded-md
        borderColor: error
          ? 'rgb(185 28 28)' // red-700
          : state.isFocused
          ? 'var(--color-primary, rgb(99 102 241))'
          : '#3f4147', // border-dark
        backgroundColor: error
          ? 'rgba(127, 29, 29, 0.1)' // red-900/10
          : '#1e1f22', // input-bg
        boxShadow: state.isFocused
          ? error
            ? '0 0 0 1px rgba(239, 68, 68, 0.2)' // red ring (1px)
            : '0 0 0 1px rgba(99, 102, 241, 0.2)' // primary ring (1px)
          : '0 1px 2px 0 rgb(0 0 0 / 0.05)', // shadow-sm
        '&:hover': {
          borderColor: error
            ? 'rgb(185 28 28)'
            : state.isFocused
            ? 'var(--color-primary, rgb(99 102 241))'
            : '#3f4147',
        },
        cursor: state.isDisabled ? 'not-allowed' : 'pointer',
        opacity: state.isDisabled ? 0.6 : 1,
      }),
      valueContainer: (base) => ({
        ...base,
        padding: isSmall ? '0.25rem 0.5rem' : '0.5rem 0.75rem', // py-1 px-2 : py-2 px-3
      }),
      input: (base) => ({
        ...base,
        margin: 0,
        padding: 0,
        color: 'white',
      }),
      placeholder: (base) => ({
        ...base,
        color: 'rgb(107 114 128)', // gray-500
      }),
      singleValue: (base) => ({
        ...base,
        color: error ? 'rgb(248 113 113)' : 'white', // red-400 : white
      }),
      menu: (base) => ({
        ...base,
        borderRadius: '0.375rem', // rounded-md
        marginTop: '0.25rem',
        border: '1px solid #3f4147', // border-dark
        backgroundColor: '#313338', // card-bg
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        overflow: 'hidden',
        zIndex: 9999,
      }),
      menuList: (base) => ({
        ...base,
        padding: '0.25rem 0',
        maxHeight: '240px',
      }),
      option: (base, state) => ({
        ...base,
        padding: isSmall ? '0.5rem 0.75rem' : '0.625rem 1rem',
        fontSize: isSmall ? '0.8125rem' : '0.875rem',
        backgroundColor: state.isSelected
          ? 'rgba(99, 102, 241, 0.05)'
          : state.isFocused
          ? 'rgba(99, 102, 241, 0.2)'
          : '#313338',
        color: state.isSelected || state.isFocused
          ? 'var(--color-primary, rgb(99 102 241))'
          : 'white',
        fontWeight: state.isSelected ? 500 : 400,
        cursor: 'pointer',
        '&:active': {
          backgroundColor: 'rgba(99, 102, 241, 0.25)',
        },
      }),
      indicatorSeparator: () => ({
        display: 'none',
      }),
      dropdownIndicator: (base) => ({
        ...base,
        padding: isSmall ? '0.25rem' : '0.5rem',
        color: 'rgb(107 114 128)',
      }),
      noOptionsMessage: (base) => ({
        ...base,
        padding: '0.5rem 1rem',
        color: 'rgb(156 163 175)', // gray-400
        fontSize: '0.875rem',
      }),
      menuPortal: (base) => ({
        ...base,
        zIndex: 9999,
      }),
    };

    // Use theme from ThemeProvider
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';

    return (
      <div className={hideLabel ? '' : 'space-y-2'}>
        {!hideLabel && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-foreground"
          >
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
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
          isSearchable={true}
          styles={isDarkMode ? darkModeStyles : customStyles}
          components={{ DropdownIndicator }}
          className={className}
          classNamePrefix="react-select"
          noOptionsMessage={() => 'No options available'}
          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
          menuPosition="fixed"
        />
        {(error || helperText) && (
          <p
            className={`text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
