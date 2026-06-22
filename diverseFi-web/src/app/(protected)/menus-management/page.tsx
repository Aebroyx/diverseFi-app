'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { PencilIcon, TrashIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

import { DataTable, FilterField } from '@/components/ui/DataTable';
import { ExportMenusButton, MenuImportModal } from '@/components/menus';
import { SecondaryButton } from '@/components/ui/buttons';
import DeleteModal from '@/components/modals/DeleteModal';
import { useDeleteMenu, useGetAllMenus } from '@/hooks/useMenu';
import { MenuResponse } from '@/services/menuService';
import { useDebounce } from '@/hooks/useDebounce';
import { FilterCondition } from '@/components/modals/AdvancedFilterModal';
import { usePermission } from '@/hooks/usePermission';
import PrimaryBadge from '@/components/ui/PrimaryBadge';

// Business logic: Prevent deletion of core/system menus
const canDeleteMenu = (menu: MenuResponse): boolean => {
  // Prevent deletion of core/system menus
  const protectedPaths = ['/dashboard', '/users-management', '/roles-management', '/menus-management'];
  return !protectedPaths.includes(menu.path);
};

export default function MenusManagementPage() {
  // Check permissions for this page
  const { can_write: hasWritePermission, can_update: hasUpdatePermission, can_delete: hasDeletePermission } = usePermission();
  // Table state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('order_index');
  const [sortDesc, setSortDesc] = useState(false);
  const [filters, setFilters] = useState<FilterCondition[]>([]);

  // Debounce search
  const search = useDebounce(searchInput, 300);

  // Fetch menus data
  const { data, isLoading, error } = useGetAllMenus({
    page,
    pageSize,
    search,
    sortBy,
    sortDesc,
    filters,
  });

  // Delete menu mutation
  const deleteMenu = useDeleteMenu();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<number | null>(null);

  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Handlers
  const openDeleteModal = (id: number) => {
    setMenuToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMenu.mutateAsync(id);
      setIsDeleteModalOpen(false);
      setMenuToDelete(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleConfirmDelete = () => {
    if (!menuToDelete) return;
    handleDelete(menuToDelete);
  };

  const handleSearch = (value: string) => {
    setSearchInput(value);
    setPage(1); // Reset to first page on search
  };

  const handleFilterChange = (newFilters: FilterCondition[]) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  const handleSortChange = (newSortBy: string, newSortDesc: boolean) => {
    setSortBy(newSortBy);
    setSortDesc(newSortDesc);
  };

  // Define table columns using TanStack Table format
  const columns = useMemo<ColumnDef<MenuResponse>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Menu Name',
        cell: ({ row }) => (
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: 'path',
        header: 'Path',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
            {row.original.path}
          </span>
        ),
      },
      {
        accessorKey: 'icon',
        header: 'Icon',
        cell: ({ row }) => (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {row.original.icon}
          </span>
        ),
      },
      {
        accessorKey: 'order_index',
        header: 'Order',
        cell: ({ row }) => (
          <span className="text-gray-500 dark:text-gray-400">
            {row.original.order_index}
          </span>
        ),
      },
      {
        accessorKey: 'parent_id',
        header: 'Parent',
        cell: ({ row }) => (
          <span className="text-gray-500 dark:text-gray-400">
            {row.original.parent_id ? `ID: ${row.original.parent_id}` : 'Root'}
          </span>
        ),
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => (
          <PrimaryBadge variant={row.original.is_active ? 'success' : 'neutral'} icon="none">
            {row.original.is_active ? 'Active' : 'Inactive'}
          </PrimaryBadge>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Created At',
        cell: ({ row }) => (
          <span className="text-gray-500 dark:text-gray-400">
            {row.original.created_at
              ? format(new Date(row.original.created_at), 'yyyy-MM-dd HH:mm')
              : '-'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const canDelete = canDeleteMenu(row.original) && hasDeletePermission;
          const deleteTooltipMessage = !canDeleteMenu(row.original)
            ? 'Cannot delete system menu'
            : !hasDeletePermission
            ? 'You do not have permission to delete menus'
            : 'Delete menu';

          const updateTooltipMessage = hasUpdatePermission
            ? 'Edit menu'
            : 'You do not have permission to edit menus';

          return (
            <div className="flex justify-end gap-2">
              {hasUpdatePermission ? (
                <Link
                  href={`/menus-management/${row.original.id}`}
                  className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-primary"
                  title={updateTooltipMessage}
                >
                  <PencilIcon className="h-5 w-5" />
                </Link>
              ) : (
                <button
                  disabled
                  className="cursor-not-allowed rounded-lg p-2 text-gray-300 dark:text-gray-600"
                  title={updateTooltipMessage}
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
              )}
              {canDelete ? (
                <button
                  onClick={() => openDeleteModal(row.original.id)}
                  className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  title={deleteTooltipMessage}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              ) : (
                <button
                  disabled
                  className="cursor-not-allowed rounded-lg p-2 text-gray-300 dark:text-gray-600"
                  title={deleteTooltipMessage}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [hasUpdatePermission, hasDeletePermission]
  );

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
    },
    {
      key: 'path',
      label: 'Path',
      type: 'text',
    },
    {
      key: 'is_active',
      label: 'Status',
      type: 'boolean',
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
      ],
    },
    {
      key: 'created_at',
      label: 'Created At',
      type: 'date',
    },
  ];

  // Calculate page count
  const pageCount = data?.total ? Math.ceil(data.total / pageSize) : 0;

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        Error: {error instanceof Error ? error.message : 'Failed to fetch menus'}
      </div>
    );
  }

  return (
    <>
      {/* Import/Export Buttons */}
      {hasWritePermission && (
        <div className="mb-4 flex justify-end gap-2">
          <ExportMenusButton />
          <SecondaryButton onClick={() => setIsImportModalOpen(true)}>
            <ArrowUpTrayIcon className="h-5 w-5" />
            Import
          </SecondaryButton>
        </div>
      )}

      <DataTable<MenuResponse>
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        title="Menu Management"
        description="Manage navigation menus and their permissions across your application."
        // Pagination
        page={page}
        pageSize={pageSize}
        pageCount={pageCount}
        total={data?.total || 0}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        // Search
        searchPlaceholder="Search menus..."
        onSearch={handleSearch}
        // Sorting
        sortBy={sortBy}
        sortDesc={sortDesc}
        onSortChange={handleSortChange}
        // Filtering
        filterFields={filterFields}
        filters={filters}
        onFilterChange={handleFilterChange}
        // Actions
        addHref={hasWritePermission ? "/menus-management/add" : undefined}
        addButtonText={hasWritePermission ? "Add Menu" : undefined}
        // Empty state
        emptyState={
          <div className="py-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No menus found
            </p>
            {hasWritePermission && (
              <Link
                href="/menus-management/add"
                className="mt-2 inline-block text-sm font-medium text-primary hover:text-primary-dark"
              >
                Add your first menu
              </Link>
            )}
          </div>
        }
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setMenuToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Menu"
        description="Are you sure you want to delete this menu? This action cannot be undone and will affect navigation permissions."
        confirmText="Delete"
        cancelText="Cancel"
      />

      <MenuImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </>
  );
}
