'use client';

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

import { DataTableToolbar } from './DataTableToolbar';
import { DataTablePagination } from './DataTablePagination';
import { DataTableProps } from './types';

// Re-export types for convenience
export * from './types';
export { DataTableSearch } from './DataTableSearch';
export { DataTableFilters } from './DataTableFilters';
export { DataTablePagination } from './DataTablePagination';
export { DataTableToolbar } from './DataTableToolbar';

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  title,
  description,
  emptyState,
  // Pagination
  page,
  pageSize,
  pageCount,
  total,
  onPageChange,
  onPageSizeChange,
  // Search
  searchPlaceholder,
  onSearch,
  // Sorting
  sortBy,
  sortDesc,
  onSortChange,
  // Filtering
  filterFields,
  filters,
  onFilterChange,
  // Actions
  onAdd,
  addHref,
  addButtonText,
}: DataTableProps<TData>) {
  // Create table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount,
  });

  // Handle column header click for sorting
  const handleSort = (columnId: string) => {
    if (!onSortChange) return;

    if (sortBy === columnId) {
      // Toggle sort direction
      onSortChange(columnId, !sortDesc);
    } else {
      // New column, default to ascending
      onSortChange(columnId, false);
    }
  };

  // Render sort indicator
  const renderSortIndicator = (columnId: string) => {
    if (sortBy !== columnId) return null;

    return (
      <span className="ml-1.5 inline-flex">
        {sortDesc ? (
          <ChevronDownIcon className="h-4 w-4 text-primary" />
        ) : (
          <ChevronUpIcon className="h-4 w-4 text-primary" />
        )}
      </span>
    );
  };

  // Skeleton row count
  const skeletonRows = 5;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <DataTableToolbar
        title={title}
        description={description}
        searchPlaceholder={searchPlaceholder}
        onSearch={onSearch}
        filterFields={filterFields}
        filters={filters}
        onFilterChange={onFilterChange}
        onAdd={onAdd}
        addHref={addHref}
        addButtonText={addButtonText}
      />

      {/* Table Container */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-border-dark dark:bg-card-bg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-border-dark">
            {/* Table Header */}
            <thead className="bg-gray-50 dark:bg-transparent">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = onSortChange && header.column.getCanSort();
                    const columnId = header.column.id;

                    return (
                      <th
                        key={header.id}
                        scope="col"
                        className={`px-4 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 ${
                          canSort ? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-hover-bg' : ''
                        }`}
                        onClick={() => canSort && handleSort(columnId)}
                      >
                        <div className="flex items-center">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          {canSort && renderSortIndicator(columnId)}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-border-dark dark:bg-card-bg">
              {isLoading ? (
                // Skeleton rows
                Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                  <tr
                    key={`skeleton-${rowIndex}`}
                    className="transition-colors hover:bg-gray-100 dark:hover:bg-hover-bg"
                  >
                    {columns.map((_, colIndex) => (
                      <td
                        key={`skeleton-${rowIndex}-${colIndex}`}
                        className="whitespace-nowrap px-4 py-4 text-sm"
                      >
                        <Skeleton height={20} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                // Empty state
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center"
                  >
                    {emptyState || (
                      <div className="text-gray-500 dark:text-gray-400">
                        <p className="text-sm">No data available</p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                // Data rows
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-gray-100 dark:hover:bg-hover-bg"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="whitespace-nowrap px-4 py-4 text-sm text-gray-900 dark:text-gray-100"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          pageCount={pageCount}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </div>
  );
}

// Default export for convenience
export default DataTable;
