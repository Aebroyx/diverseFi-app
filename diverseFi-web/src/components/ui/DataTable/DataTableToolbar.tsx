'use client';

import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';
import { PrimaryButton } from '@/components/ui/buttons';
import { DataTableSearch } from './DataTableSearch';
import { DataTableFilters } from './DataTableFilters';
import { DataTableToolbarProps } from './types';

export function DataTableToolbar({
  title,
  description,
  searchPlaceholder,
  onSearch,
  filterFields = [],
  filters = [],
  onFilterChange,
  onAdd,
  addHref,
  addButtonText = 'Add'
}: DataTableToolbarProps) {
  const hasFilters = filterFields.length > 0;

  return (
    <div className="space-y-4">
      {/* Title and Description */}
      {(title || description) && (
        <div>
          {title && (
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Controls Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left side - Search and Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <DataTableSearch
            placeholder={searchPlaceholder}
            onSearch={onSearch}
          />

          {hasFilters && onFilterChange && (
            <DataTableFilters
              filterFields={filterFields}
              filters={filters}
              onFilterChange={onFilterChange}
            />
          )}
        </div>

        {/* Right side - Add Button */}
        {addHref ? (
          <Link href={addHref}>
            <PrimaryButton type="button">
              <PlusIcon className="h-5 w-5" />
              {addButtonText}
            </PrimaryButton>
          </Link>
        ) : onAdd ? (
          <PrimaryButton
            type="button"
            onClick={onAdd}
          >
            <PlusIcon className="h-5 w-5" />
            {addButtonText}
          </PrimaryButton>
        ) : null}
      </div>
    </div>
  );
}
