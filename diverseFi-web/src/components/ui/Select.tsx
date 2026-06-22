'use client'

import { forwardRef } from 'react'
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { ChevronUpDownIcon } from '@heroicons/react/16/solid'
import { CheckIcon } from '@heroicons/react/20/solid'

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
  className?: string;
  name?: string;
}

const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ 
    label, 
    options, 
    value, 
    onChange, 
    error, 
    helperText,
    required,
    disabled,
    className = '',
    name,
  }, ref) => {
    const selectedOption = options.find(option => option.value === value) || options[0];
    const listboxId = name || label.replace(/\s+/g, '-').toLowerCase();

    // Match Input's base and error classes
    const baseInputClasses = "mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 dark:bg-gray-700 dark:text-white";
    const inputClasses = error
      ? `${baseInputClasses} border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600`
      : `${baseInputClasses} border-gray-300 focus:border-primary focus:ring-primary dark:border-gray-600`;

    return (
      <div className="space-y-1">
        <label
          htmlFor={listboxId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <Listbox 
          value={selectedOption} 
          onChange={(option) => onChange(option.value)}
          disabled={disabled}
          name={name}
        >
          <div className="relative">
            <ListboxButton 
              ref={ref}
              id={listboxId}
              className={`${inputClasses} text-left pr-10 ${className}`}
              disabled={disabled}
            >
              <span className="block truncate">{selectedOption.label}</span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronUpDownIcon
                  aria-hidden="true"
                  className="h-5 w-5 text-gray-400 dark:text-gray-300"
                />
              </span>
            </ListboxButton>
            <ListboxOptions
              transition
              className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
            >
              {options.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option}
                  className={({ active, selected }) =>
                    `relative cursor-default select-none py-2 pl-3 pr-9 
                    ${active ? 'bg-primary text-white' : 'text-gray-900 dark:text-white'}
                    ${selected ? 'font-semibold' : 'font-normal'}`
                  }
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                        {option.label}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary dark:text-primary-dark">
                          <CheckIcon aria-hidden="true" className="h-5 w-5" />
                        </span>
                      ) : null}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </div>
        </Listbox>
        {(error || helperText) && (
          <p className={`text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
