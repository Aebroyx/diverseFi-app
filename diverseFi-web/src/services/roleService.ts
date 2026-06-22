import axiosInstance, { handleApiError } from '@/lib/axios';
import { FilterCondition } from '@/components/modals/AdvancedFilterModal';

// Types
export interface RoleResponse {
  id: number;
  name: string;
  display_name: string;
  description: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRoleRequest {
  name: string;
  display_name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateRoleRequest {
  name?: string;
  display_name?: string;
  description?: string;
  is_active?: boolean;
}

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GetAllRolesParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDesc?: boolean;
  filters?: FilterCondition[];
}

export interface RoleMenuPermission {
  menu_id: number;
  can_read: boolean;
  can_write: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export interface BulkAssignMenusRequest {
  menus: RoleMenuPermission[];
}

class RoleService {
  async getAllRoles(params: GetAllRolesParams): Promise<PaginatedResponse<RoleResponse>> {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortDesc !== undefined) queryParams.append('sortDesc', params.sortDesc.toString());
      
      // Handle advanced filter conditions
      if (params.filters && params.filters.length > 0) {
        // Send filters as JSON string in query params
        queryParams.append('filters', JSON.stringify(params.filters));
      }

      const response = await axiosInstance.get<ApiResponse<PaginatedResponse<RoleResponse>>>(`/roles?${queryParams.toString()}`);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async getActiveRoles(): Promise<RoleResponse[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<RoleResponse[]>>('/roles/active');
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async getRoleById(id: string | number): Promise<RoleResponse> {
    try {
      const response = await axiosInstance.get<ApiResponse<RoleResponse>>(`/role/${id}`);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async createRole(data: CreateRoleRequest): Promise<RoleResponse> {
    try {
      const response = await axiosInstance.post<ApiResponse<RoleResponse>>('/role/create', data);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async updateRole(id: string | number, data: UpdateRoleRequest): Promise<RoleResponse> {
    try {
      const response = await axiosInstance.put<ApiResponse<RoleResponse>>(`/role/${id}`, data);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async deleteRole(id: string | number): Promise<void> {
    try {
      await axiosInstance.delete(`/role/${id}`);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Bulk assign menus to a role
  async bulkAssignMenusToRole(roleId: number, permissions: RoleMenuPermission[]): Promise<void> {
    try {
      await axiosInstance.post(`/role/${roleId}/menus`, { menus: permissions });
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

export const roleService = new RoleService();
