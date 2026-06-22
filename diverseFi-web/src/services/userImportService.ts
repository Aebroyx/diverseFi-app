import axiosInstance, { handleApiError } from '@/lib/axios';
import {
  ValidateImportRequest,
  ValidateImportResponse,
  BulkImportRequest,
  BulkImportResponse,
} from '@/types/userImport';

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

class UserImportService {
  /**
   * Export users as Excel file (backend generates the file)
   */
  async exportUsers(): Promise<void> {
    try {
      const response = await axiosInstance.get('/users/export', {
        responseType: 'blob', // Important: receive file as blob
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Download template Excel file for user import
   */
  async downloadTemplate(): Promise<void> {
    try {
      const response = await axiosInstance.get('/users/template', {
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'users-import-template.xlsx';
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
  async validateImport(request: ValidateImportRequest): Promise<ValidateImportResponse> {
    try {
      const response = await axiosInstance.post<ApiResponse<ValidateImportResponse>>(
        '/users/import/validate',
        request
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Execute bulk import of users
   */
  async bulkImport(request: BulkImportRequest): Promise<BulkImportResponse> {
    try {
      const response = await axiosInstance.post<ApiResponse<BulkImportResponse>>(
        '/users/import',
        request
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

export const userImportService = new UserImportService();
