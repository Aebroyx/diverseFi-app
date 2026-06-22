import axiosInstance, { handleApiError } from '@/lib/axios';

// Search result types
export interface SearchUser {
  id: number;
  name: string;
  email: string;
  username: string;
}

export interface SearchRole {
  id: number;
  name: string;
  display_name: string;
}

export interface SearchMenu {
  id: number;
  name: string;
  path: string;
  icon: string;
}

export interface GlobalSearchResult {
  users: SearchUser[];
  roles: SearchRole[];
  menus: SearchMenu[];
}

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

class SearchService {
  async globalSearch(query: string): Promise<GlobalSearchResult> {
    try {
      const response = await axiosInstance.get<ApiResponse<GlobalSearchResult>>(
        `/search/global?q=${encodeURIComponent(query)}`
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

export const searchService = new SearchService();
