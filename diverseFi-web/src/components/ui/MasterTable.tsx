'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import AdvancedFilterModal, { FilterCondition, FilterFieldOption } from '@/components/modals/AdvancedFilterModal';

// Define the base column type
type Column<T> = {
  header: ReactNode;
  key: keyof T | string;
  render?: (item: T) => ReactNode;
  className?: string;
  sortable?: boolean;
};

// Define filter field type (keeping for backward compatibility)
type FilterField = FilterFieldOption;

// Define the master table props with generic type
type MasterTableProps<T> = {
  title?: string;
  description?: string;
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  onAdd?: () => void;
  addButtonText?: string;
  isLoading?: boolean;
  emptyState?: ReactNode;
  // Pagination props
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  // Search props
  searchPlaceholder?: string;
  onSearch: (search: string) => void;
  // Filter props
  filterFields?: FilterField[];
  onFilterChange: (filters: FilterCondition[]) => void;
  // Sort props
  sortBy: string;
  sortDesc: boolean;
  onSortChange: (sortBy: string, sortDesc: boolean) => void;
};

export default function MasterTable<T>({
  title,
  description,
  columns,
  data,
  keyExtractor,
  onAdd,
  addButtonText = 'Add',
  isLoading = false,
  emptyState,
  // Pagination props
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  // Search props
  searchPlaceholder = 'Search...',
  onSearch,
  // Filter props
  filterFields = [],
  onFilterChange,
  // Sort props
  sortBy,
  sortDesc,
  onSortChange,
}: MasterTableProps<T>) {
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDarkMode(root.classList.contains('dark'));
    update();

    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    onSearch(value);
  };

  // Handle filter changes from modal
  const handleFilterApply = (filterConditions: FilterCondition[]) => {
    setFilters(filterConditions);
    onFilterChange(filterConditions);
  };

  // Calculate pagination values
  const totalPages = Math.ceil(total / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="px-4 sm:px-6 lg:px-8 mt-10">
      {/* Header Section */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          {title && (
            <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h1>
          )}
          {description && (
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              {description}
            </p>
          )}
        </div>
        {onAdd && (
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <PrimaryButton
              type="button"
              onClick={onAdd}
            >
              {addButtonText}
            </PrimaryButton>
          </div>
        )}
      </div>

      {/* Search and Filters Section */}
      <div className="mt-4 flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-1/4">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="mt-1 block w-full rounded-md border px-3 py-2 pl-10 shadow-sm focus:outline-primary focus:ring-1 dark:bg-input-bg dark:text-white dark:border-border-dark"
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 mt-1 h-[calc(100%-0.5rem)]">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
        </div>

        {/* Filter Button */}
        {filterFields.length > 0 && (
          <div ref={filterButtonRef} className="sm:w-auto">
            <SecondaryButton
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              className="mt-1"
            >
              <FunnelIcon className="h-5 w-5" />
              Filter
              {filters.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">
                  {filters.length}
                </span>
              )}
            </SecondaryButton>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      <AdvancedFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleFilterApply}
        fields={filterFields}
        initialConditions={filters}
      />

      {/* Table Section */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-border-dark">
              <thead className="bg-gray-50 dark:bg-transparent">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key.toString()}
                      scope="col"
                      className={`py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 sm:pl-3 ${
                        column.className || ''
                      }`}
                    >
                      {column.sortable !== false ? (
                        <button
                          onClick={() => onSortChange(column.key.toString(), sortBy === column.key ? !sortDesc : false)}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          {column.header}
                          {sortBy === column.key && (
                            <span className="text-primary">
                              {sortDesc ? '↓' : '↑'}
                            </span>
                          )}
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-border-dark bg-white dark:bg-card-bg">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="even:bg-gray-50 dark:even:bg-hover-bg/50">
                      {columns.map((column) => (
                        <td
                          key={column.key.toString()}
                          className={`py-4 pr-3 pl-4 text-sm whitespace-nowrap sm:pl-3 ${
                            column.className || ''
                          }`}
                        >
                          <Skeleton
                            baseColor={isDarkMode ? 'transparent' : undefined}
                            highlightColor={isDarkMode ? 'rgba(255,255,255,0.06)' : undefined}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      {emptyState || 'No data available'}
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr
                      key={keyExtractor(item)}
                      className="even:bg-gray-50 dark:even:bg-hover-bg/50"
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key.toString()}
                          className={`py-4 pr-3 pl-4 text-sm whitespace-nowrap sm:pl-3 ${
                            column.className || ''
                          }`}
                        >
                          {column.render
                            ? column.render(item)
                            : (item[column.key as keyof T] as ReactNode)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination Section */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-200 dark:border-border-dark bg-white dark:bg-card-bg px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 dark:border-border-dark bg-white dark:bg-card-bg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50/5 dark:hover:bg-hover-bg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-border-dark bg-white dark:bg-card-bg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50/5 dark:hover:bg-hover-bg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing <span className="font-medium">{startItem}</span> to{' '}
              <span className="font-medium">{endItem}</span> of{' '}
              <span className="font-medium">{total}</span> results
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <label htmlFor="pageSize" className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                Rows per page:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-100 dark:bg-card-bg ring-1 ring-inset ring-gray-300 dark:ring-border-dark focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6"
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-border-dark hover:bg-gray-50/5 dark:hover:bg-hover-bg focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    pageNum === page
                      ? 'z-10 bg-primary text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                      : 'text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-border-dark hover:bg-gray-50/5 dark:hover:bg-hover-bg focus:z-20 focus:outline-offset-0'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-border-dark hover:bg-gray-50/5 dark:hover:bg-hover-bg focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
} 