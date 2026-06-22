import { useMutation, useQueryClient } from '@tanstack/react-query';
import { menuImportService } from '@/services/menuImportService';
import { getErrorMessage } from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  ValidateMenuImportRequest,
  BulkMenuImportRequest,
} from '@/types/menuImport';

/**
 * Hook for exporting menus (downloads Excel file)
 */
export function useExportMenus() {
  return useMutation({
    mutationFn: () => menuImportService.exportMenus(),
    onSuccess: () => {
      toast.success('Menus exported successfully');
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Failed to export menus'));
    },
  });
}

/**
 * Hook for downloading import template (downloads Excel file)
 */
export function useDownloadMenuTemplate() {
  return useMutation({
    mutationFn: () => menuImportService.downloadTemplate(),
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
export function useValidateMenuImport() {
  return useMutation({
    mutationFn: (request: ValidateMenuImportRequest) => menuImportService.validateImport(request),
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Failed to validate import data'));
    },
  });
}

/**
 * Hook for bulk importing menus
 */
export function useBulkMenuImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BulkMenuImportRequest) => menuImportService.bulkImport(request),
    onSuccess: (data) => {
      // Invalidate menus query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['menus'] });

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
      toast.error(getErrorMessage(error, 'Failed to import menus'));
    },
  });
}
