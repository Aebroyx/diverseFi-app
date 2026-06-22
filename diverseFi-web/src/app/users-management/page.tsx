'use client';

import { Navigation } from "@/components/Navigation";
import MasterTable from "@/components/ui/MasterTable";
import { useDeleteUser, useGetAllUsers, useSoftDeleteUser } from "@/hooks/useUser";
import { GetUserResponse } from "@/services/userService";
import { EyeIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DeleteModal from '@/components/modals/DeleteModal';
import { format } from 'date-fns';

export default function UsersManagementPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDesc, setSortDesc] = useState(true);
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Reset to first page when filters change
  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  const { data, isLoading, error } = useGetAllUsers({
    page,
    pageSize,
    search,
    sortBy,
    sortDesc,
    filters,
  });

  // delete user
  const deleteUser = useDeleteUser();
  const softDeleteUser = useSoftDeleteUser();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  const openDeleteModal = (id: number) => {
    setUserToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      // await softDeleteUser.mutateAsync(id);
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

  // Define table columns
  const columns = [
    {
      key: 'name',
      header: 'Name',
      className: 'font-medium text-gray-900 dark:text-gray-100',
    },
    {
      key: 'email',
      header: 'Email',
      className: 'text-gray-500 dark:text-gray-400',
    },
    {
      key: 'role',
      header: 'Role',
      className: 'text-gray-500 dark:text-gray-400',
      render: (user: GetUserResponse) => (
        <span className="capitalize">{user.role}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created At', 
      className: 'text-gray-500 dark:text-gray-400',
      render: (user: GetUserResponse) =>
        user.created_at
          ? format(new Date(user.created_at), 'yyyy-MM-dd HH:mm')
          : '-',
    },
    {
      key: 'updated_at',
      header: 'Updated At',
      className: 'text-gray-500 dark:text-gray-400', 
      render: (user: GetUserResponse) =>
        user.updated_at
          ? format(new Date(user.updated_at), 'yyyy-MM-dd HH:mm')
          : '-',
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (user: GetUserResponse) => (
        <div className="flex justify-end gap-x-2">
          <button
            onClick={() => router.push(`/users-management/${user.id}`)}
            className="text-primary hover:text-primary-dark inline-flex items-center gap-x-1"
          >
            <EyeIcon className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => openDeleteModal(user.id)}
            className="text-red-500 hover:text-red-700 inline-flex items-center gap-x-1"
          >
            <TrashIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  // Define filter fields
  const filterFields = [
    {
      key: 'role',
      label: 'Role',
      type: 'select' as const,
      options: [
        { value: 'admin', label: 'Admin' },
        { value: 'user', label: 'User' },
      ],
    },
    {
      key: 'name',
      label: 'Name',
      type: 'text' as const,
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text' as const,
    },
    {
      key: 'username',
      label: 'Username',
      type: 'text' as const,
    },
  ];

  if (error) {
    return (
      <Navigation>
        <div className="text-red-500 p-4">
          Error: {error instanceof Error ? error.message : 'Failed to fetch users'}
        </div>
      </Navigation>
    );
  }

  return (
    <Navigation>
      <h1 className="text-2xl font-bold">Users Management</h1>
      <MasterTable<GetUserResponse>
        title="Users List"
        description="A list of all the users including their name, email and role."
        columns={columns}
        data={data?.data || []}
        keyExtractor={(user) => user.id}
        isLoading={isLoading}
        onAdd={() => router.push('/users-management/add')}
        addButtonText="Add User"
        emptyState={
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No users found</p>
            <button
              onClick={() => router.push('/users-management/add')}
              className="mt-2 text-sm text-primary hover:text-primary-dark"
            >
              Add your first user
            </button>
          </div>
        }
        // Pagination props
        total={data?.total || 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        // Search props
        searchPlaceholder="Search users..."
        onSearch={setSearch}
        // Filter props
        filterFields={filterFields}
        onFilterChange={handleFilterChange}
        // Sort props
        sortBy={sortBy}
        sortDesc={sortDesc}
        onSortChange={(newSortBy, newSortDesc) => {
          setSortBy(newSortBy);
          setSortDesc(newSortDesc);
        }}
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
    </Navigation>
  );
} 