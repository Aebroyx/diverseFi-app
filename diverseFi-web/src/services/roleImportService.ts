import axiosInstance, { handleApiError } from '@/lib/axios';
import {
  ValidateRoleImportRequest,
  ValidateRoleImportResponse,
  BulkRoleImportRequest,
  BulkRoleImportResponse,
} from '@/types/roleImport';

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

class RoleImportService {
  /**
   * Export roles as Excel file (backend generates the file)
   */
  async exportRoles(): Promise<void> {
    try {
      const response = await axiosInstance.get('/roles/export', {
        responseType: 'blob', // Important: receive file as blob
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `roles-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Download template Excel file for role import
   */
  async downloadTemplate(): Promise<void> {
    try {
      const response = await axiosInstance.get('/roles/template', {
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'roles-import-template.xlsx';
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
  async validateImport(request: ValidateRoleImportRequest): Promise<ValidateRoleImportResponse> {
    try {
      const response = await axiosInstance.post<ApiResponse<ValidateRoleImportResponse>>(
        '/roles/import/validate',
        request
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Execute bulk import of roles
   */
  async bulkImport(request: BulkRoleImportRequest): Promise<BulkRoleImportResponse> {
    try {
      const response = await axiosInstance.post<ApiResponse<BulkRoleImportResponse>>(
        '/roles/import',
        request
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

export const roleImportService = new RoleImportService();
