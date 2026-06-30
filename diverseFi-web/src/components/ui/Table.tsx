import { ReactNode } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Button } from '@/components/ui/shadcn/button';
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { cn } from '@/lib/utils';

export type Column<T> = {
  header: ReactNode;
  key: keyof T | string;
  render?: (item: T) => ReactNode;
  className?: string;
};

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
    <div className="mt-10 px-4 sm:px-6 lg:px-8">
      {(title || description || onAdd) && (
        <div className="sm:flex sm:items-center">
          {(title || description) && (
            <div className="sm:flex-auto">
              {title && (
                <h1 className="text-base font-semibold text-foreground">{title}</h1>
              )}
              {description && (
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          )}
          {onAdd && (
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
              <Button onClick={onAdd}>{addButtonText}</Button>
            </div>
          )}
        </div>
      )}
      <div className="mt-8 flow-root">
        <ShadcnTable>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.key.toString()}
                  className={cn('pl-4 sm:pl-3', column.className)}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell
                      key={column.key.toString()}
                      className={cn('pl-4 sm:pl-3', column.className)}
                    >
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-4 text-center text-sm text-muted-foreground"
                >
                  {emptyState || 'No data available'}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={keyExtractor(item)}>
                  {columns.map((column) => (
                    <TableCell
                      key={column.key.toString()}
                      className={cn('pl-4 sm:pl-3', column.className)}
                    >
                      {column.render
                        ? column.render(item)
                        : (item[column.key as keyof T] as ReactNode)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </ShadcnTable>
      </div>
    </div>
  );
}
