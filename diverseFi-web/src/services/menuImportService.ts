import axiosInstance, { handleApiError } from '@/lib/axios';
import {
  ValidateMenuImportRequest,
  ValidateMenuImportResponse,
  BulkMenuImportRequest,
  BulkMenuImportResponse,
} from '@/types/menuImport';

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

class MenuImportService {
  /**
   * Export menus as Excel file (backend generates the file)
   */
  async exportMenus(): Promise<void> {
    try {
      const response = await axiosInstance.get('/menus/export', {
        responseType: 'blob', // Important: receive file as blob
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `menus-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Download template Excel file for menu import
   */
  async downloadTemplate(): Promise<void> {
    try {
      const response = await axiosInstance.get('/menus/template', {
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'menus-import-template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Validate import data before actually importing
   */
  async validateImport(request: ValidateMenuImportRequest): Promise<ValidateMenuImportResponse> {
    try {
      const response = await axiosInstance.post<ApiResponse<ValidateMenuImportResponse>>(
        '/menus/import/validate',
        request
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Execute bulk import of menus
   */
  async bulkImport(request: BulkMenuImportRequest): Promise<BulkMenuImportResponse> {
    try {
      const response = await axiosInstance.post<ApiResponse<BulkMenuImportResponse>>(
        '/menus/import',
        request
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

export const menuImportService = new MenuImportService();
