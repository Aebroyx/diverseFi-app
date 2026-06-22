import axiosInstance, { handleApiError } from '@/lib/axios';

export interface AuditLog {
  id: number;
  user_id?: number;
  username: string;
  action: string;
  resource_type: string;
  resource_id: string;
  old_values?: string;
  new_values?: string;
  ip_address: string;
  user_agent: string;
  correlation_id: string;
  timestamp: string;
}

export interface AuditLogQueryParams {
  user_id?: number;
  username?: string;
  action?: string;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  correlation_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

interface PaginatedAuditLogsResponse {
  data: AuditLog[];
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

export const auditService = {
  /**
   * Get audit logs with optional filtering and pagination
   */
  async getAuditLogs(
    params?: AuditLogQueryParams
  ): Promise<PaginatedAuditLogsResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }

      const url = `/audit/logs${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;
      const response = await axiosInstance.get<
        ApiResponse<PaginatedAuditLogsResponse>
      >(url);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(
    userId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedAuditLogsResponse> {
    try {
      const response = await axiosInstance.get<
        ApiResponse<PaginatedAuditLogsResponse>
      >(`/audit/logs/user/${userId}?page=${page}&limit=${limit}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Get audit logs for a specific resource
   */
  async getResourceAuditLogs(
    resourceType: string,
    resourceId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedAuditLogsResponse> {
    try {
      const response = await axiosInstance.get<
        ApiResponse<PaginatedAuditLogsResponse>
      >(
        `/audit/logs/${resourceType}/${resourceId}?page=${page}&limit=${limit}`
      );
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};
