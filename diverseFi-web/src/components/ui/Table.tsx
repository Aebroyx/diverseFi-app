import { ReactNode } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Define the base column type
export type Column<T> = {
  header: ReactNode;
  key: keyof T | string;
  render?: (item: T) => ReactNode;
  className?: string;
};

// Define the table props with generic type
export type TableProps<T> = {
  title?: string;
  description?: string;
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  onAdd?: () => void;
  addButtonText?: string;
  isLoading?: boolean;
  emptyState?: ReactNode;
};

export default function Table<T>({
  title,
  description,
  columns,
  data,
  keyExtractor,
  onAdd,
  addButtonText = 'Add',
  isLoading = false,
  emptyState,
}: TableProps<T>) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 mt-10">
      {(title || description || onAdd) && (
        <div className="sm:flex sm:items-center">
          {(title || description) && (
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
          )}
          {onAdd && (
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                type="button"
                onClick={onAdd}
                className="block rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {addButtonText}
              </button>
            </div>
          )}
        </div>
      )}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key.toString()}
                      scope="col"
                      className={`py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 sm:pl-3 ${
                        column.className || ''
                      }`}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="even:bg-gray-50 dark:even:bg-gray-700/50">
                      {columns.map((column) => (
                        <td
                          key={column.key.toString()}
                          className={`py-4 pr-3 pl-4 text-sm whitespace-nowrap sm:pl-3 ${
                            column.className || ''
                          }`}
                        >
                          <Skeleton />
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
                      className="even:bg-gray-50 dark:even:bg-gray-700/50"
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
    </div>
  );
}
  