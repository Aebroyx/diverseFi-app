import { useQuery } from '@tanstack/react-query';
import {
  auditService,
  AuditLog,
  AuditLogQueryParams,
} from '@/services/auditService';

interface PaginatedAuditLogsResponse {
  data: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Get Audit Logs Query with Filtering and Pagination
export function useGetAuditLogs(params?: AuditLogQueryParams) {
  return useQuery<PaginatedAuditLogsResponse, Error>({
    queryKey: ['auditLogs', params],
    queryFn: () => auditService.getAuditLogs(params),
    placeholderData: (previousData) => previousData, // Keep previous data while loading new data
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}

// Get Audit Logs for a Specific User
export function useGetUserAuditLogs(
  userId: number,
  page: number = 1,
  limit: number = 20
) {
  return useQuery<PaginatedAuditLogsResponse, Error>({
    queryKey: ['auditLogs', 'user', userId, page, limit],
    queryFn: () => auditService.getUserAuditLogs(userId, page, limit),
    enabled: !!userId, // Only run query if userId is provided
    staleTime: 30000,
  });
}

// Get Audit Logs for a Specific Resource
export function useGetResourceAuditLogs(
  resourceType: string,
  resourceId: string,
  page: number = 1,
  limit: number = 20
) {
  return useQuery<PaginatedAuditLogsResponse, Error>({
    queryKey: ['auditLogs', 'resource', resourceType, resourceId, page, limit],
    queryFn: () =>
      auditService.getResourceAuditLogs(resourceType, resourceId, page, limit),
    enabled: !!(resourceType && resourceId), // Only run if both are provided
    staleTime: 30000,
  });
}
