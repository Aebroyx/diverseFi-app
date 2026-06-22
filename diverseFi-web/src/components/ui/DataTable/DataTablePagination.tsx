'use client';

import { ChevronLeftIcon, ChevronRightIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';
import { DataTablePaginationProps } from './types';
import Select, { type SelectOption } from '../Select';

const PAGE_SIZES = [5, 10, 20, 50, 100];

export function DataTablePagination({
  page,
  pageSize,
  pageCount,
  total,
  onPageChange,
  onPageSizeChange
}: DataTablePaginationProps) {
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsisStart = page > 3;
    const showEllipsisEnd = page < pageCount - 2;

    if (pageCount <= 7) {
      // Show all pages if 7 or less
      for (let i = 1; i <= pageCount; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (showEllipsisStart) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, page - 1);
      const end = Math.min(pageCount - 1, page + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (showEllipsisEnd) {
        pages.push('...');
      }

      // Always show last page
      if (!pages.includes(pageCount)) {
        pages.push(pageCount);
      }
    }

    return pages;
  };

  return (
    <div className="flex flex-col gap-4 border-t border-gray-200 bg-white px-4 py-4 dark:border-border-dark dark:bg-card-bg sm:flex-row sm:items-center sm:justify-between sm:px-6">
      {/* Left side - Showing results */}
      <div className="text-sm text-gray-700 dark:text-gray-300">
        Showing <span className="font-semibold text-gray-900 dark:text-white">{startItem}</span> to{' '}
        <span className="font-semibold text-gray-900 dark:text-white">{endItem}</span> of{' '}
        <span className="font-semibold text-gray-900 dark:text-white">{total}</span> results
      </div>

      {/* Right side - Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700 dark:text-gray-300">
            Rows per page:
          </label>
          <Select
            label="Rows per page"
            hideLabel
            name="pageSize"
            options={PAGE_SIZES.map(
              (size): SelectOption => ({ value: String(size), label: String(size) })
            )}
            value={String(pageSize)}
            onChange={(value) => onPageSizeChange(Number(value))}
            size="sm"
            className="min-w-[5.5rem]"
          />
        </div>

        {/* Page navigation */}
        <nav className="flex items-center gap-1" aria-label="Pagination">
          {/* First page button */}
          <button
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 transition-colors hover:bg-gray-50/5 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-dark dark:bg-card-bg dark:text-gray-400 dark:hover:bg-hover-bg dark:hover:text-gray-200"
            aria-label="First page"
          >
            <ChevronDoubleLeftIcon className="h-4 w-4" />
          </button>

          {/* Previous page button */}
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 transition-colors hover:bg-gray-50/5 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-dark dark:bg-card-bg dark:text-gray-400 dark:hover:bg-hover-bg dark:hover:text-gray-200"
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>

          {/* Page numbers */}
          <div className="hidden items-center gap-1 sm:flex">
            {getPageNumbers().map((pageNum, idx) =>
              pageNum === '...' ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex h-9 w-9 items-center justify-center text-gray-500 dark:text-gray-400"
                >
                  ...
                </span>
              ) : (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum as number)}
                  className={`inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors ${
                    pageNum === page
                      ? 'bg-primary text-white shadow-sm'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50/5 dark:border-border-dark dark:bg-card-bg dark:text-gray-300 dark:hover:bg-hover-bg'
                  }`}
                >
                  {pageNum}
                </button>
              )
            )}
          </div>

          {/* Mobile page indicator */}
          <span className="flex items-center gap-1 px-2 text-sm text-gray-700 dark:text-gray-300 sm:hidden">
            Page <span className="font-semibold">{page}</span> of{' '}
            <span className="font-semibold">{pageCount}</span>
          </span>

          {/* Next page button */}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === pageCount || pageCount === 0}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 transition-colors hover:bg-gray-50/5 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-dark dark:bg-card-bg dark:text-gray-400 dark:hover:bg-hover-bg dark:hover:text-gray-200"
            aria-label="Next page"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>

          {/* Last page button */}
          <button
            onClick={() => onPageChange(pageCount)}
            disabled={page === pageCount || pageCount === 0}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 transition-colors hover:bg-gray-50/5 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-dark dark:bg-card-bg dark:text-gray-400 dark:hover:bg-hover-bg dark:hover:text-gray-200"
            aria-label="Last page"
          >
            <ChevronDoubleRightIcon className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </div>
  );
}
