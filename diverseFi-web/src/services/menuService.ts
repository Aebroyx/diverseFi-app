import axiosInstance, { handleApiError } from '@/lib/axios';
import { FilterCondition } from '@/components/modals/AdvancedFilterModal';

// Types
export interface MenuResponse {
  id: number;
  name: string;
  path: string;
  icon: string;
  order_index: number;
  parent_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: MenuResponse[];
}

export interface RoleMenuResponse {
  id: number;
  role_id: number;
  menu_id: number;
  can_read: boolean;
  can_write: boolean;
  can_update: boolean;
  can_delete: boolean;
  menu: MenuResponse;
  created_at: string;
  updated_at: string;
}

export interface RightsAccessResponse {
  id: number;
  user_id: number;
  menu_id: number;
  can_read: boolean | null;
  can_write: boolean | null;
  can_update: boolean | null;
  can_delete: boolean | null;
  menu: MenuResponse;
  created_at: string;
  updated_at: string;
}

export interface EffectivePermissions {
  can_read: boolean;
  can_write: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export interface MenuWithPermissions {
  id: number;
  name: string;
  path: string;
  icon: string;
  order_index: number;
  parent_id: number | null;
  is_active: boolean;
  children?: MenuWithPermissions[];
  permissions: EffectivePermissions;
}

export interface UserMenuPermission {
  menu_id: number;
  can_read: boolean | null;
  can_write: boolean | null;
  can_update: boolean | null;
  can_delete: boolean | null;
}

export interface BulkUserRightsAccessRequest {
  permissions: UserMenuPermission[];
}

export interface CreateMenuRequest {
  name: string;
  path: string;
  icon: string;
  order_index: number;
  parent_id: number | null;
  is_active: boolean;
}

export interface UpdateMenuRequest {
  name: string;
  path: string;
  icon: string;
  order_index: number;
  parent_id: number | null;
  is_active: boolean;
}

export interface GetAllMenusParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDesc?: boolean;
  filters?: FilterCondition[];
}

export interface PaginatedResponse<T> {
  data: T[];
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

class MenuService {
  // Get current user's accessible menus with permissions
  async getUserMenus(): Promise<MenuWithPermissions[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<MenuWithPermissions[]>>('/menus/user');
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get all menus as a tree structure
  async getMenuTree(): Promise<MenuResponse[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<MenuResponse[]>>('/menus/tree');
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get menus assigned to a role with permissions
  async getRoleMenus(roleId: number): Promise<RoleMenuResponse[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<RoleMenuResponse[]>>(`/role/${roleId}/menus`);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get user's rights access (permission overrides)
  async getUserRightsAccess(userId: number): Promise<RightsAccessResponse[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<RightsAccessResponse[]>>(`/rights-access/user/${userId}`);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Bulk save user's rights access
  async bulkSaveUserRightsAccess(userId: number, permissions: UserMenuPermission[]): Promise<RightsAccessResponse[]> {
    try {
      const response = await axiosInstance.post<ApiResponse<RightsAccessResponse[]>>(
        `/rights-access/user/${userId}/bulk`,
        { permissions }
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Delete all user's rights access
  async deleteAllUserRightsAccess(userId: number): Promise<void> {
    try {
      await axiosInstance.delete(`/rights-access/user/${userId}`);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get all menus with pagination
  async getAllMenus(params: GetAllMenusParams): Promise<PaginatedResponse<MenuResponse>> {
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

      const response = await axiosInstance.get<ApiResponse<PaginatedResponse<MenuResponse>>>(`/menus?${queryParams.toString()}`);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get menu by ID
  async getMenuById(id: string | number): Promise<MenuResponse> {
    try {
      const response = await axiosInstance.get<ApiResponse<MenuResponse>>(`/menu/${id}`);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Create menu
  async createMenu(data: CreateMenuRequest): Promise<MenuResponse> {
    try {
      const response = await axiosInstance.post<ApiResponse<MenuResponse>>('/menu/create', data);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Update menu
  async updateMenu(id: string | number, data: UpdateMenuRequest): Promise<MenuResponse> {
    try {
      const response = await axiosInstance.put<ApiResponse<MenuResponse>>(`/menu/${id}`, data);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Delete menu
  async deleteMenu(id: string | number): Promise<void> {
    try {
      await axiosInstance.delete(`/menu/${id}`);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

export const menuService = new MenuService();
