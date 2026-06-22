import { User } from '@/store/features/authSlice';
import axiosInstance, { handleApiError } from '@/lib/axios';
import { FilterCondition } from '@/components/modals/AdvancedFilterModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  name: string;
}

interface RegisterResponse {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface LoginResponse {
  user: RegisterResponse;
}

interface RoleResponse {
  id: number;
  name: string;
  display_name: string;
  description: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface GetUserResponse {
  id: number;
  username: string;
  email: string;
  name: string;
  role: RoleResponse;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface CreateUserRequest {
  name: string;
  email: string;
  username: string;
  password: string;
  role_id: number;
  is_active: boolean;
}

interface ErrorResponse {
  status: 'error';
  message: string;
  code?: string;
  details?: unknown;
}

interface UpdateUserRequest {
  name: string;
  email: string;
  role_id: number;
  username: string;
  password: string;
  is_active: boolean;
}

interface ResetPasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// Response represents the standard API response structure
interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

// PaginatedResponse represents the pagination response structure
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GetAllUsersParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDesc?: boolean;
  filters?: FilterCondition[];
}

class UserService {
  private async fetchWithError(url: string, options: RequestInit = {}) {
    console.log('Making request to:', url, 'with options:', {
      ...options,
      body: options.body ? JSON.parse(options.body as string) : undefined
    });

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const responseText = await response.text();

    if (!response.ok) {
      let errorResponse: ErrorResponse;
      try {
        errorResponse = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing error response:', e);
        throw new Error('Something went wrong');
      }
      throw new Error(JSON.stringify(errorResponse));
    }

    try {
      return JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing response:', e);
      throw new Error('Invalid response from server');
    }
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return this.fetchWithError(`${API_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.fetchWithError(`${API_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(data),
      credentials: 'include',
    });
  }

  async logout(): Promise<void> {
    // You might want to call a logout endpoint here if you have one
    // For now, we'll just clear the tokens on the client side
  }

  async getCurrentUser(token: string): Promise<User> {
    return this.fetchWithError(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Add new user management methods
  async getAllUsers(params: GetAllUsersParams): Promise<PaginatedResponse<GetUserResponse>> {
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

      const response = await axiosInstance.get<ApiResponse<PaginatedResponse<GetUserResponse>>>(`/users?${queryParams.toString()}`);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async getUserById(id: string | number): Promise<GetUserResponse> {
    try {
      const response = await axiosInstance.get<{ data: GetUserResponse }>(`/user/${id}`);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async createUser(data: CreateUserRequest): Promise<GetUserResponse> {
    try {
      const response = await axiosInstance.post<GetUserResponse>('/user/create', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async updateUser(id: string | number, data: UpdateUserRequest): Promise<GetUserResponse> {
    try {
      const response = await axiosInstance.put<GetUserResponse>(`/user/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async deleteUser(id: string | number): Promise<void> {
    try {
      await axiosInstance.delete(`/user/${id}`);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async softDeleteUser(id: string | number): Promise<void> {
    try {
      await axiosInstance.put(`/user/${id}/soft-delete`);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async resetPassword(id: string | number, data: ResetPasswordRequest): Promise<GetUserResponse> {
    try {
      const response = await axiosInstance.post<ApiResponse<GetUserResponse>>(`/user/reset-password/${id}`, data);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
  
}

export const userService = new UserService();
export type { GetUserResponse, RegisterRequest, RegisterResponse, LoginRequest, TokenResponse, LoginResponse, ResetPasswordRequest };
