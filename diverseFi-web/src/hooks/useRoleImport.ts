import { useMutation, useQueryClient } from '@tanstack/react-query';
import { roleImportService } from '@/services/roleImportService';
import { getErrorMessage } from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  ValidateRoleImportRequest,
  BulkRoleImportRequest,
} from '@/types/roleImport';

/**
 * Hook for exporting roles (downloads Excel file)
 */
export function useExportRoles() {
  return useMutation({
    mutationFn: () => roleImportService.exportRoles(),
    onSuccess: () => {
      toast.success('Roles exported successfully');
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Failed to export roles'));
    },
  });
}

/**
 * Hook for downloading import template (downloads Excel file)
 */
export function useDownloadRoleTemplate() {
  return useMutation({
    mutationFn: () => roleImportService.downloadTemplate(),
    onSuccess: () => {
      toast.success('Template downloaded successfully');
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Failed to download template'));
    },
  });
}

/**
 * Hook for validating import data
 */
export function useValidateRoleImport() {
  return useMutation({
    mutationFn: (request: ValidateRoleImportRequest) => roleImportService.validateImport(request),
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Failed to validate import data'));
    },
  });
}

/**
 * Hook for bulk importing roles
 */
export function useBulkRoleImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BulkRoleImportRequest) => roleImportService.bulkImport(request),
    onSuccess: (data) => {
      // Invalidate roles query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['roles'] });

      // Show success message with summary
      const { created, updated, skipped, failed } = data;
      const messages: string[] = [];
      if (created > 0) messages.push(`${created} created`);
      if (updated > 0) messages.push(`${updated} updated`);
      if (skipped > 0) messages.push(`${skipped} skipped`);
      if (failed > 0) messages.push(`${failed} failed`);

      toast.success(`Import completed: ${messages.join(', ')}`);
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Failed to import roles'));
    },
  });
}
