'use client';

import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

import { DataTable } from '@/components/ui/DataTable';
import { useGetAuditLogs } from '@/hooks/useAuditLogs';
import { AuditLog } from '@/services/auditService';
import { useDebounce } from '@/hooks/useDebounce';
import Input from '@/components/ui/Input';
import Select, { type SelectOption } from '@/components/ui/Select';
import SecondaryBadge, { SecondaryBadgeVariant } from '@/components/ui/SecondaryBadge';

// Helper to format action with color badges
const getActionBadge = (action: string) => {
  const variantMap: Record<string, SecondaryBadgeVariant> = {
    CREATE: 'green',
    UPDATE: 'blue',
    DELETE: 'red',
    LOGIN_SUCCESS: 'purple',
    LOGIN_FAILED: 'orange',
    LOGOUT: 'gray',
  };

  const variant = variantMap[action] || 'gray';

  return (
    <SecondaryBadge variant={variant}>
      {action}
    </SecondaryBadge>
  );
};

export default function AuditLogsPage() {
  // Table state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortDesc, setSortDesc] = useState(true);

  // Additional filters
  const [actionFilter, setActionFilter] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Debounce search
  const search = useDebounce(searchInput, 300);

  // Build query params
  const queryParams = useMemo(() => {
    const params: {
      page: number;
      limit: number;
      username?: string;
      action?: string;
      resource_type?: string;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
      start_date?: string;
      end_date?: string;
    } = {
      page,
      limit: pageSize,
      sort_by: sortBy,
      sort_order: sortDesc ? 'desc' : 'asc',
    };

    if (search) params.username = search;
    if (actionFilter) params.action = actionFilter;
    if (resourceTypeFilter) params.resource_type = resourceTypeFilter;
    if (startDate) params.start_date = new Date(startDate).toISOString();
    if (endDate) params.end_date = new Date(endDate).toISOString();

    return params;
  }, [page, pageSize, search, actionFilter, resourceTypeFilter, sortBy, sortDesc, startDate, endDate]);

  // Fetch audit logs
  const { data, isLoading, error } = useGetAuditLogs(queryParams);

  // Handlers
  const handleSearch = (value: string) => {
    setSearchInput(value);
    setPage(1); // Reset to first page on search
  };

  const handleSortChange = (newSortBy: string, newSortDesc: boolean) => {
    setSortBy(newSortBy);
    setSortDesc(newSortDesc);
  };

  // Define table columns
  const columns = useMemo<ColumnDef<AuditLog>[]>(
    () => [
      {
        accessorKey: 'timestamp',
        header: 'Timestamp',
        cell: ({ row }) => (
          <span className="text-sm text-gray-900 dark:text-gray-100">
            {format(new Date(row.original.timestamp), 'MMM dd, yyyy HH:mm:ss')}
          </span>
        ),
      },
      {
        accessorKey: 'username',
        header: 'User',
        cell: ({ row }) => (
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {row.original.username || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ row }) => getActionBadge(row.original.action),
      },
      {
        accessorKey: 'resource_type',
        header: 'Resource Type',
        cell: ({ row }) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {row.original.resource_type || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'resource_id',
        header: 'Resource ID',
        cell: ({ row }) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {row.original.resource_id || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'ip_address',
        header: 'IP Address',
        cell: ({ row }) => (
          <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">
            {row.original.ip_address}
          </span>
        ),
      },
    ],
    []
  );

  // Filter fields for the DataTable component
  const filterFields: any[] = [];

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">Error loading audit logs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Track all system activities and user actions
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Select
            label="Action"
            name="auditAction"
            value={actionFilter}
            onChange={(value) => {
              setActionFilter(value);
              setPage(1);
            }}
            options={
              [
                { value: '', label: 'All Actions' },
                { value: 'CREATE', label: 'Create' },
                { value: 'UPDATE', label: 'Update' },
                { value: 'DELETE', label: 'Delete' },
                { value: 'LOGIN_SUCCESS', label: 'Login Success' },
                { value: 'LOGIN_FAILED', label: 'Login Failed' },
                { value: 'LOGOUT', label: 'Logout' },
              ] as SelectOption[]
            }
            className="w-full"
          />
        </div>

        <div>
          <Input
            id="auditResourceType"
            label="Resource Type"
            value={resourceTypeFilter}
            onChange={(e) => {
              setResourceTypeFilter(e.target.value);
              setPage(1);
            }}
            placeholder="e.g., users, roles"
          />
        </div>

        <div>
          <Input
            id="auditStartDate"
            label="Start Date"
            type="datetime-local"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div>
          <Input
            id="auditEndDate"
            label="End Date"
            type="datetime-local"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        pageCount={data?.totalPages || 0}
        page={page}
        pageSize={pageSize}
        total={data?.total || 0}
        isLoading={isLoading}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        onSearch={handleSearch}
        sortBy={sortBy}
        sortDesc={sortDesc}
        onSortChange={handleSortChange}
        searchPlaceholder="Search by username..."
        filterFields={filterFields}
      />
    </div>
  );
}
