import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  emailService,
  EmailLog,
  EmailLogQueryParams,
} from '@/services/emailService';
import { toast } from 'react-hot-toast';

interface PaginatedEmailLogsResponse {
  data: EmailLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Get Email Logs Query with Filtering and Pagination
export function useGetEmailLogs(params?: EmailLogQueryParams) {
  return useQuery<PaginatedEmailLogsResponse, Error>({
    queryKey: ['emailLogs', params],
    queryFn: () => emailService.getEmailLogs(params),
    placeholderData: (previousData) => previousData, // Keep previous data while loading new data
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}

// Get a Specific Email Log by ID
export function useGetEmailLogById(id: number) {
  return useQuery<EmailLog, Error>({
    queryKey: ['emailLog', id],
    queryFn: () => emailService.getEmailLogById(id),
    enabled: !!id, // Only run query if id is provided
    staleTime: 30000,
  });
}

// Send Test Email Mutation
export function useSendTestEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => emailService.sendTestEmail(),
    onSuccess: (data) => {
      // Invalidate email logs query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['emailLogs'] });

      toast.success(
        `Test email sent successfully! ${data.resend_id ? `(ID: ${data.resend_id})` : ''}`
      );
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send test email';
      toast.error(errorMessage);
    },
  });
}
