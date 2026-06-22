import axiosInstance, { handleApiError } from '@/lib/axios';

export interface EmailLog {
  id: number;
  template_id?: number;
  template_name: string;
  from: string;
  to: string[] | string; // Can be array or JSON string
  cc?: string[] | string;
  bcc?: string[] | string;
  subject: string;
  status: string; // "pending", "sent", "failed"
  resend_id?: string;
  error_message?: string;
  sent_by_user_id?: number;
  sent_by_username: string;
  ip_address: string;
  sent_at?: string;
  created_at: string;
}

export interface EmailLogQueryParams {
  template_id?: number;
  template_name?: string;
  status?: string;
  to?: string;
  sent_by_user_id?: number;
  sent_by_username?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  pageSize?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

interface PaginatedEmailLogsResponse {
  data: EmailLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

interface SendTestEmailResponse {
  id: number;
  resend_id?: string;
  status: string;
  message: string;
}

export const emailService = {
  /**
   * Get email logs with optional filtering and pagination
   */
  async getEmailLogs(
    params?: EmailLogQueryParams
  ): Promise<PaginatedEmailLogsResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }

      const url = `/email/logs${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;
      const response = await axiosInstance.get<
        ApiResponse<PaginatedEmailLogsResponse>
      >(url);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Get a specific email log by ID
   */
  async getEmailLogById(id: number): Promise<EmailLog> {
    try {
      const response = await axiosInstance.get<ApiResponse<EmailLog>>(
        `/email/log/${id}`
      );
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Send a test email to the configured test email address
   */
  async sendTestEmail(): Promise<SendTestEmailResponse> {
    try {
      const response = await axiosInstance.post<
        ApiResponse<SendTestEmailResponse>
      >('/email/send-test');
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};
