'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { EyeIcon, TrashIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

import { DataTable, FilterField } from '@/components/ui/DataTable';
import DeleteModal from '@/components/modals/DeleteModal';
import { useDeleteUser, useGetAllUsers } from '@/hooks/useUser';
import { GetUserResponse } from '@/services/userService';
import { useDebounce } from '@/hooks/useDebounce';
import { FilterCondition } from '@/components/modals/AdvancedFilterModal';
import { usePermission } from '@/hooks/usePermission';
import PrimaryBadge from '@/components/ui/PrimaryBadge';
import { ExportUsersButton, UserImportModal } from '@/components/users';
import { SecondaryButton } from '@/components/ui/buttons';

// Helper function to check if user can be deleted
const canDeleteUser = (user: GetUserResponse): boolean => {
  // Prevent deletion of root user only
  if (user.username === 'root' || user.email === 'root@localhost') {
    return false;
  }
  
  return true;
};

export default function UsersManagementPage() {
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

  // Fetch users data
  const { data, isLoading, error } = useGetAllUsers({
    page,
    pageSize,
    search,
    sortBy,
    sortDesc,
    filters,
  });

  // Delete user mutation
  const deleteUser = useDeleteUser();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Handlers
  const openDeleteModal = (id: number) => {
    setUserToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteUser.mutateAsync(id);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    handleDelete(userToDelete);
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
  const columns = useMemo<ColumnDef<GetUserResponse>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <span className="text-gray-500 dark:text-gray-400">
            {row.original.email}
          </span>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary dark:bg-primary/20">
            {row.original.role?.display_name || row.original.role?.name || 'N/A'}
          </span>
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
        accessorKey: 'updated_at',
        header: 'Updated At',
        cell: ({ row }) => (
          <span className="text-gray-500 dark:text-gray-400">
            {row.original.updated_at
              ? format(new Date(row.original.updated_at), 'yyyy-MM-dd HH:mm')
              : '-'}
          </span>
        ),
      },
      {
        accessorKey: 'is_active',
        header: 'Active',
        cell: ({ row }) => (
          <PrimaryBadge variant={row.original.is_active ? 'success' : 'danger'}>
            {row.original.is_active ? 'Active' : 'Inactive'}
          </PrimaryBadge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const canDelete = canDeleteUser(row.original) && hasDeletePermission;
          const deleteTooltipMessage = !canDeleteUser(row.original)
            ? 'Cannot delete root user'
            : !hasDeletePermission
            ? 'You do not have permission to delete users'
            : 'Delete user';

          const updateTooltipMessage = hasUpdatePermission
            ? 'View/Edit user'
            : 'You do not have permission to edit users';

          return (
            <div className="flex justify-end gap-2">
              {hasUpdatePermission ? (
                <Link
                  href={`/users-management/${row.original.id}`}
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
      key: 'email',
      label: 'Email',
      type: 'text',
    },
    {
      key: 'username',
      label: 'Username',
      type: 'text',
    },
    {
      key: 'created_at',
      label: 'Created At',
      type: 'date',
    },
  ];

  // Calculate page count
  const pageCount = data?.total ? Math.ceil(data.total / pageSize) : 0;

  return (
    <>
      {/* Show error message but don't break the page */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <p className="font-semibold">Error loading users</p>
          <p className="mt-1 text-sm">{error instanceof Error ? error.message : 'Failed to fetch users'}</p>
        </div>
      )}

      {/* Import/Export Buttons */}
      {hasWritePermission && (
        <div className="mb-4 flex justify-end gap-2">
          <ExportUsersButton />
          <SecondaryButton onClick={() => setIsImportModalOpen(true)}>
            <ArrowUpTrayIcon className="h-5 w-5" />
            Importr
          </SecondaryButton>
        </div>
      )}

      <DataTable<GetUserResponse>
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        title="Users Management"
        description="A list of all users in your application including their name, email, and role."
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
        searchPlaceholder="Search users..."
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
        addHref={hasWritePermission ? "/users-management/add" : undefined}
        addButtonText={hasWritePermission ? "Add User" : undefined}
        // Empty state
        emptyState={
          <div className="py-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No users found</p>
            {hasWritePermission && (
              <Link
                href="/users-management/add"
                className="mt-2 inline-block text-sm font-medium text-primary hover:text-primary-dark"
              >
                Add your first user
              </Link>
            )}
          </div>
        }
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />

      <UserImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </>
  );
}
