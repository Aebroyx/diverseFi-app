'use client';

import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

import { DataTable } from '@/components/ui/DataTable';
import { useGetEmailLogs, useSendTestEmail } from '@/hooks/useEmailLogs';
import { EmailLog } from '@/services/emailService';
import { useDebounce } from '@/hooks/useDebounce';
import Input from '@/components/ui/Input';
import Select, { type SelectOption } from '@/components/ui/Select';
import SecondaryBadge, { SecondaryBadgeVariant } from '@/components/ui/SecondaryBadge';
import { PrimaryButton } from '@/components/ui/buttons';

// Helper to format status with color badges
const getStatusBadge = (status: string) => {
  const variantMap: Record<string, SecondaryBadgeVariant> = {
    sent: 'green',
    pending: 'blue',
    failed: 'red',
  };

  const variant = variantMap[status.toLowerCase()] || 'gray';

  return (
    <SecondaryBadge variant={variant}>
      {status.toUpperCase()}
    </SecondaryBadge>
  );
};

export default function EmailLogsPage() {
  // Table state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDesc, setSortDesc] = useState(true);

  // Additional filters
  const [statusFilter, setStatusFilter] = useState('');
  const [templateNameFilter, setTemplateNameFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Debounce search
  const search = useDebounce(searchInput, 300);

  // Send test email mutation
  const { mutate: sendTestEmail, isPending: isSendingTest } = useSendTestEmail();

  // Build query params
  const queryParams = useMemo(() => {
    const params: {
      page: number;
      pageSize: number;
      to?: string;
      status?: string;
      template_name?: string;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
      start_date?: string;
      end_date?: string;
    } = {
      page,
      pageSize: pageSize,
      sort_by: sortBy,
      sort_order: sortDesc ? 'desc' : 'asc',
    };

    if (search) params.to = search;
    if (statusFilter) params.status = statusFilter;
    if (templateNameFilter) params.template_name = templateNameFilter;
    if (startDate) params.start_date = new Date(startDate).toISOString();
    if (endDate) params.end_date = new Date(endDate).toISOString();

    return params;
  }, [page, pageSize, search, statusFilter, templateNameFilter, sortBy, sortDesc, startDate, endDate]);

  // Fetch email logs
  const { data, isLoading, error } = useGetEmailLogs(queryParams);

  // Handlers
  const handleSearch = (value: string) => {
    setSearchInput(value);
    setPage(1); // Reset to first page on search
  };

  const handleSortChange = (newSortBy: string, newSortDesc: boolean) => {
    setSortBy(newSortBy);
    setSortDesc(newSortDesc);
  };

  const handleSendTestEmail = () => {
    sendTestEmail();
  };

  // Define table columns
  const columns = useMemo<ColumnDef<EmailLog>[]>(
    () => [
      {
        accessorKey: 'created_at',
        header: 'Sent At',
        cell: ({ row }) => (
          <span className="text-sm text-gray-900 dark:text-gray-100">
            {row.original.sent_at
              ? format(new Date(row.original.sent_at), 'MMM dd, yyyy HH:mm:ss')
              : format(new Date(row.original.created_at), 'MMM dd, yyyy HH:mm:ss')}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        accessorKey: 'to',
        header: 'Recipients',
        cell: ({ row }) => {
          const recipients = typeof row.original.to === 'string'
            ? JSON.parse(row.original.to)
            : row.original.to;
          return (
            <div className="max-w-xs">
              <span className="text-sm text-gray-900 dark:text-gray-100 truncate block">
                {Array.isArray(recipients) ? recipients.join(', ') : recipients}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'subject',
        header: 'Subject',
        cell: ({ row }) => (
          <div className="max-w-md">
            <span className="text-sm text-gray-900 dark:text-gray-100 truncate block">
              {row.original.subject}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'template_name',
        header: 'Template',
        cell: ({ row }) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {row.original.template_name || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'sent_by_username',
        header: 'Sent By',
        cell: ({ row }) => (
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {row.original.sent_by_username || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'resend_id',
        header: 'Resend ID',
        cell: ({ row }) => (
          <span className="text-xs text-gray-700 dark:text-gray-300 font-mono">
            {row.original.resend_id ? (
              <span className="truncate block max-w-[100px]" title={row.original.resend_id}>
                {row.original.resend_id}
              </span>
            ) : (
              '—'
            )}
          </span>
        ),
      },
      {
        accessorKey: 'error_message',
        header: 'Error',
        cell: ({ row }) => (
          <div className="max-w-xs">
            {row.original.error_message ? (
              <span className="text-xs text-red-600 dark:text-red-400 truncate block" title={row.original.error_message}>
                {row.original.error_message}
              </span>
            ) : (
              <span className="text-sm text-gray-500">—</span>
            )}
          </div>
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
          <p className="text-red-800 dark:text-red-200">Error loading email logs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Logs</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Track all sent emails and their delivery status
          </p>
        </div>
        <PrimaryButton
          onClick={handleSendTestEmail}
          disabled={isSendingTest}
          className="flex items-center gap-2"
        >
          {isSendingTest ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send Test Email
            </>
          )}
        </PrimaryButton>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Select
            label="Status"
            name="emailStatus"
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            options={
              [
                { value: '', label: 'All Statuses' },
                { value: 'sent', label: 'Sent' },
                { value: 'pending', label: 'Pending' },
                { value: 'failed', label: 'Failed' },
              ] as SelectOption[]
            }
            className="w-full"
          />
        </div>

        <div>
          <Input
            id="emailTemplateName"
            label="Template Name"
            value={templateNameFilter}
            onChange={(e) => {
              setTemplateNameFilter(e.target.value);
              setPage(1);
            }}
            placeholder="e.g., welcome_email"
          />
        </div>

        <div>
          <Input
            id="emailStartDate"
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
            id="emailEndDate"
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
        searchPlaceholder="Search by recipient email..."
        filterFields={filterFields}
      />
    </div>
  );
}
