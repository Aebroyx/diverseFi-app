import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userImportService } from '@/services/userImportService';
import { getErrorMessage } from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  ValidateImportRequest,
  BulkImportRequest,
} from '@/types/userImport';

/**
 * Hook for exporting users (downloads Excel file)
 */
export function useExportUsers() {
  return useMutation({
    mutationFn: () => userImportService.exportUsers(),
    onSuccess: () => {
      toast.success('Users exported successfully');
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Failed to export users'));
    },
  });
}

/**
 * Hook for downloading import template (downloads Excel file)
 */
export function useDownloadTemplate() {
  return useMutation({
    mutationFn: () => userImportService.downloadTemplate(),
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
export function useValidateImport() {
  return useMutation({
    mutationFn: (request: ValidateImportRequest) => userImportService.validateImport(request),
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Failed to validate import data'));
    },
  });
}

/**
 * Hook for bulk importing users
 */
export function useBulkImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BulkImportRequest) => userImportService.bulkImport(request),
    onSuccess: (data) => {
      // Invalidate users query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['users'] });

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
      toast.error(getErrorMessage(error, 'Failed to import users'));
    },
  });
}
