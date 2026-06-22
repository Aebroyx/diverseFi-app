'use client';

import { useState, useCallback } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { DataTableSearchProps } from './types';

export function DataTableSearch({
  placeholder = 'Search...',
  onSearch
}: DataTableSearchProps) {
  const [value, setValue] = useState('');

  // Trigger search when value changes (debounce is handled by parent)
  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
    onSearch(newValue);
  }, [onSearch]);

  const handleClear = useCallback(() => {
    setValue('');
    onSearch('');
  }, [onSearch]);

  return (
    <div className="relative w-full sm:w-72">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <MagnifyingGlassIcon
          className="h-5 w-5 text-gray-400 dark:text-gray-500"
          aria-hidden="true"
        />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-border-dark dark:bg-input-bg dark:text-white dark:placeholder:text-gray-500 dark:focus:border-primary dark:focus:ring-primary"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
