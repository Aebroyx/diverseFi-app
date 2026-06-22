'use client';

import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { RowError } from '@/types/userImport';

interface ImportValidationErrorsProps {
  errors: RowError[];
  maxErrors?: number;
}

export default function ImportValidationErrors({ errors, maxErrors = 50 }: ImportValidationErrorsProps) {
  // Group errors by row number
  const errorsByRow = errors.reduce(
    (acc, error) => {
      if (!acc[error.row_number]) {
        acc[error.row_number] = [];
      }
      acc[error.row_number].push(error);
      return acc;
    },
    {} as Record<number, RowError[]>
  );

  const rowNumbers = Object.keys(errorsByRow)
    .map(Number)
    .sort((a, b) => a - b);
  const displayRows = rowNumbers.slice(0, maxErrors);
  const hiddenCount = rowNumbers.length - displayRows.length;

  return (
    <div className="max-h-80 overflow-y-auto rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
      <div className="sticky top-0 flex items-center gap-2 border-b border-red-200 bg-red-100 px-4 py-3 dark:border-red-800 dark:bg-red-900/30">
        <ExclamationCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
        <span className="text-sm font-medium text-red-800 dark:text-red-300">
          {errors.length} validation error{errors.length !== 1 ? 's' : ''} found
        </span>
      </div>

      <div className="divide-y divide-red-200 dark:divide-red-800">
        {displayRows.map((rowNum) => (
          <div key={rowNum} className="px-4 py-3">
            <div className="mb-2 text-sm font-semibold text-red-700 dark:text-red-300">
              Row {rowNum}
            </div>
            <ul className="space-y-1">
              {errorsByRow[rowNum].map((error, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                  <span className="shrink-0 font-medium capitalize">{error.field}:</span>
                  <span>
                    {error.message}
                    {error.value && (
                      <span className="ml-1 italic text-red-500 dark:text-red-500">
                        (value: &quot;{error.value}&quot;)
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {hiddenCount > 0 && (
        <div className="border-t border-red-200 bg-red-100 px-4 py-3 text-center text-sm text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
          ...and {hiddenCount} more row{hiddenCount > 1 ? 's' : ''} with errors
        </div>
      )}
    </div>
  );
}
