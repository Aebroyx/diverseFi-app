'use client';

import { useState } from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { SecondaryButton } from '@/components/ui/buttons';
import { DataTableFiltersProps } from './types';
import AdvancedFilterModal from '@/components/modals/AdvancedFilterModal';

export function DataTableFilters({
  filterFields,
  filters = [],
  onFilterChange
}: DataTableFiltersProps) {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Ensure filters is always an array
  const safeFilters = Array.isArray(filters) ? filters : [];
  const activeFiltersCount = safeFilters.length;

  const handleRemoveFilter = (id: string) => {
    const newFilters = safeFilters.filter(f => f.id !== id);
    onFilterChange(newFilters);
  };

  const handleClearAll = () => {
    onFilterChange([]);
  };

  const getFieldLabel = (key: string): string => {
    const field = filterFields.find(f => f.key === key);
    return field?.label || key;
  };

  const getOperatorLabel = (operator: string): string => {
    const operatorLabels: Record<string, string> = {
      equals: '=',
      notEquals: '≠',
      contains: 'contains',
      notContains: 'not contains',
      startsWith: 'starts with',
      endsWith: 'ends with',
      greaterThan: '>',
      lessThan: '<',
      greaterThanOrEqual: '≥',
      lessThanOrEqual: '≤',
      is: 'is',
      isNot: 'is not',
      isEmpty: 'is empty',
      isNotEmpty: 'is not empty',
    };
    return operatorLabels[operator] || operator;
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Filter Button - Always First */}
        <SecondaryButton
          onClick={() => setIsFilterModalOpen(true)}
          className="inline-flex items-center gap-2"
        >
          <FunnelIcon className="h-4 w-4" />
          <span>Filter</span>
          {activeFiltersCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              {activeFiltersCount}
            </span>
          )}
        </SecondaryButton>

        {/* Active Filter Pills - To the Right of Button */}
        {safeFilters.map((filter) => (
          <span
            key={filter.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary dark:bg-primary/20"
          >
            <span className="text-gray-600 dark:text-gray-400">
              {getFieldLabel(filter.field)}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              {getOperatorLabel(filter.operator)}
            </span>
            {filter.value && <span>{filter.value}</span>}
            <button
              type="button"
              onClick={() => handleRemoveFilter(filter.id)}
              className="ml-1 rounded-full p-0.5 hover:bg-primary/20 dark:hover:bg-primary/30"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}

        {/* Clear All Button */}
        {activeFiltersCount > 1 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Advanced Filter Modal */}
      <AdvancedFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={onFilterChange}
        fields={filterFields}
        initialConditions={safeFilters}
      />
    </>
  );
}
