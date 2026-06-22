'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { EyeIcon, TrashIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

import { DataTable, FilterField } from '@/components/ui/DataTable';
import { ExportRolesButton, RoleImportModal } from '@/components/roles';
import { SecondaryButton } from '@/components/ui/buttons';
import DeleteModal from '@/components/modals/DeleteModal';
import { useGetAllRoles, useDeleteRole } from '@/hooks/useRole';
import { RoleResponse } from '@/services/roleService';
import { useDebounce } from '@/hooks/useDebounce';
import { FilterCondition } from '@/components/modals/AdvancedFilterModal';
import { usePermission } from '@/hooks/usePermission';
import PrimaryBadge from '@/components/ui/PrimaryBadge';

// Helper function to check if role can be deleted
const canDeleteRole = (role: RoleResponse): boolean => {
  // Prevent deletion of protected roles
  const protectedRoles = ['root', 'admin', 'user'];
  if (role.name && protectedRoles.includes(role.name.toLowerCase())) {
    return false;
  }
  
  return true;
};

export default function RolesManagementPage() {
  // Check permissions for this page
  const { can_write: hasWritePermission, can_update: hasUpdatePermission, can_delete: hasDeletePermission } = usePermission();

  // Table state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDesc, setSortDesc] = useState(true);
  const [filters, setFilters] = useState<FilterCondition[]>([]);

  // Debounce search
  const search = useDebounce(searchInput, 300);

  // Fetch roles data
  const { data, isLoading, error } = useGetAllRoles({
    page,
    pageSize,
    search,
    sortBy,
    sortDesc,
    filters,
  });

  // Delete role mutation
  const deleteRole = useDeleteRole();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);

  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Handlers
  const openDeleteModal = (id: number) => {
    setRoleToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteRole.mutateAsync(id);
      setIsDeleteModalOpen(false);
      setRoleToDelete(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleConfirmDelete = () => {
    if (!roleToDelete) return;
    handleDelete(roleToDelete);
  };

  const handleSearch = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  const handleFilterChange = (newFilters: FilterCondition[]) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleSortChange = (newSortBy: string, newSortDesc: boolean) => {
    setSortBy(newSortBy);
    setSortDesc(newSortDesc);
  };

  // Define table columns
  const columns = useMemo<ColumnDef<RoleResponse>[]>(
    () => [
      {
        accessorKey: 'display_name',
        header: 'Role Name',
        cell: ({ row }) => (
          <div>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {row.original.display_name}
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {row.original.name}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <span className="text-gray-500 dark:text-gray-400 line-clamp-2">
            {row.original.description || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'is_default',
        header: 'Default',
        cell: ({ row }) => (
          row.original.is_default ? (
            <PrimaryBadge variant="info">
              Default
            </PrimaryBadge>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">-</span>
          )
        ),
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => (
          <PrimaryBadge variant={row.original.is_active ? 'success' : 'danger'}>
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
          const canDelete = canDeleteRole(row.original) && !row.original.is_default && hasDeletePermission;
          const deleteTooltipText = !canDeleteRole(row.original)
            ? 'Cannot delete protected role'
            : row.original.is_default
              ? 'Cannot delete default role'
              : !hasDeletePermission
                ? 'You do not have permission to delete roles'
                : 'Delete role';

          const updateTooltipMessage = hasUpdatePermission
            ? 'Edit role'
            : 'You do not have permission to edit roles';

          return (
            <div className="flex justify-end gap-2">
              {hasUpdatePermission ? (
                <Link
                  href={`/roles-management/${row.original.id}`}
                  className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-primary"
                  title={updateTooltipMessage}
                >
                  <EyeIcon className="h-5 w-5" />
                </Link>
              ) : (
                <button
                  disabled
                  className="cursor-not-allowed rounded-lg p-2 text-gray-300 dark:text-gray-600"
                  title={updateTooltipMessage}
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
              )}
              {canDelete ? (
                <button
                  onClick={() => openDeleteModal(row.original.id)}
                  className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  title={deleteTooltipText}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              ) : (
                <button
                  disabled
                  className="cursor-not-allowed rounded-lg p-2 text-gray-300 dark:text-gray-600"
                  title={deleteTooltipText}
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
      label: 'Role Name',
      type: 'text',
    },
    {
      key: 'display_name',
      label: 'Display Name',
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
      key: 'is_default',
      label: 'Default Role',
      type: 'boolean',
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
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
        Error: {error instanceof Error ? error.message : 'Failed to fetch roles'}
      </div>
    );
  }

  return (
    <>
      {/* Import/Export Buttons */}
      {hasWritePermission && (
        <div className="mb-4 flex justify-end gap-2">
          <ExportRolesButton />
          <SecondaryButton onClick={() => setIsImportModalOpen(true)}>
            <ArrowUpTrayIcon className="h-5 w-5" />
            Import
          </SecondaryButton>
        </div>
      )}

      <DataTable<RoleResponse>
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        title="Roles Management"
        description="Manage user roles and permissions in your application."
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
        searchPlaceholder="Search roles..."
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
        addHref={hasWritePermission ? "/roles-management/add" : undefined}
        addButtonText={hasWritePermission ? "Add Role" : undefined}
        // Empty state
        emptyState={
          <div className="py-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No roles found
            </p>
            {hasWritePermission && (
              <Link
                href="/roles-management/add"
                className="mt-2 inline-block text-sm font-medium text-primary hover:text-primary-dark"
              >
                Create your first role
              </Link>
            )}
          </div>
        }
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setRoleToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Role"
        description="Are you sure you want to delete this role? Users with this role will need to be reassigned."
        confirmText="Delete"
        cancelText="Cancel"
      />

      <RoleImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </>
  );
}
