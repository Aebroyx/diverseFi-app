import { ColumnDef } from '@tanstack/react-table';
import { ReactNode } from 'react';
import { FilterCondition, FilterFieldOption } from '@/components/modals/AdvancedFilterModal';

// Filter field type for defining filterable columns
export type FilterField = FilterFieldOption;

// Active filter type (for backward compatibility)
export type ActiveFilter = {
  field: string;
  value: string;
  label?: string;
};

// Re-export for convenience
export type { FilterCondition, FilterFieldOption };

// DataTable props with generic type
export interface DataTableProps<TData> {
  // Core data
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading?: boolean;

  // Display options
  title?: string;
  description?: string;
  emptyState?: ReactNode;

  // Pagination (server-side)
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;

  // Search
  searchPlaceholder?: string;
  onSearch: (value: string) => void;

  // Sorting (server-side)
  sortBy?: string;
  sortDesc?: boolean;
  onSortChange?: (sortBy: string, sortDesc: boolean) => void;

  // Filtering
  filterFields?: FilterField[];
  filters?: FilterCondition[];
  onFilterChange?: (filters: FilterCondition[]) => void;

  // Actions
  onAdd?: () => void;
  addHref?: string;
  addButtonText?: string;
}

// Pagination props
export interface DataTablePaginationProps {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

// Search props
export interface DataTableSearchProps {
  placeholder?: string;
  onSearch: (value: string) => void;
}

// Filters props
export interface DataTableFiltersProps {
  filterFields: FilterField[];
  filters: FilterCondition[];
  onFilterChange: (filters: FilterCondition[]) => void;
}

// Toolbar props
export interface DataTableToolbarProps {
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  onSearch: (value: string) => void;
  filterFields?: FilterField[];
  filters?: FilterCondition[];
  onFilterChange?: (filters: FilterCondition[]) => void;
  onAdd?: () => void;
  addHref?: string;
  addButtonText?: string;
}
