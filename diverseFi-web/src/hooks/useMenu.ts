import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  menuService,
  UserMenuPermission,
  GetAllMenusParams,
  CreateMenuRequest,
  UpdateMenuRequest,
  MenuWithPermissions,
} from '@/services/menuService';
import { getErrorMessage } from '@/lib/axios';
import toast from 'react-hot-toast';

// Query keys
export const menuKeys = {
  all: ['menus'] as const,
  lists: () => [...menuKeys.all, 'list'] as const,
  list: (params: GetAllMenusParams) => [...menuKeys.lists(), params] as const,
  tree: () => [...menuKeys.all, 'tree'] as const,
  userMenus: () => [...menuKeys.all, 'user'] as const,
  details: () => [...menuKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...menuKeys.details(), id] as const,
  roleMenus: (roleId: number) => [...menuKeys.all, 'role', roleId] as const,
  userRightsAccess: (userId: number) => [...menuKeys.all, 'rights', userId] as const,
};

// Get menu tree
export function useGetMenuTree() {
  return useQuery({
    queryKey: menuKeys.tree(),
    queryFn: () => menuService.getMenuTree(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// Get current user's accessible menus with permissions
export function useGetUserMenus() {
  return useQuery<MenuWithPermissions[]>({
    queryKey: menuKeys.userMenus(),
    queryFn: () => menuService.getUserMenus(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// Get role menus with permissions
export function useGetRoleMenus(roleId: number | undefined) {
  return useQuery({
    queryKey: menuKeys.roleMenus(roleId || 0),
    queryFn: () => menuService.getRoleMenus(roleId!),
    enabled: !!roleId && roleId > 0,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });
}

// Get user rights access
export function useGetUserRightsAccess(userId: number | undefined) {
  return useQuery({
    queryKey: menuKeys.userRightsAccess(userId || 0),
    queryFn: () => menuService.getUserRightsAccess(userId!),
    enabled: !!userId && userId > 0,
  });
}

// Bulk save user rights access
export function useBulkSaveUserRightsAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, permissions }: { userId: number; permissions: UserMenuPermission[] }) =>
      menuService.bulkSaveUserRightsAccess(userId, permissions),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.userRightsAccess(variables.userId) });
      toast.success('Permissions saved successfully');
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Failed to save permissions'));
    },
  });
}

// Delete all user rights access
export function useDeleteAllUserRightsAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => menuService.deleteAllUserRightsAccess(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.userRightsAccess(userId) });
      toast.success('All custom permissions removed');
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Failed to delete permissions'));
    },
  });
}

// Get all menus with pagination
export function useGetAllMenus(params: GetAllMenusParams) {
  return useQuery({
    queryKey: menuKeys.list(params),
    queryFn: () => menuService.getAllMenus(params),
    placeholderData: (previousData) => previousData,
  });
}

// Get menu by ID
export function useGetMenuById(id: string | number) {
  return useQuery({
    queryKey: menuKeys.detail(id),
    queryFn: () => menuService.getMenuById(id),
    enabled: !!id,
  });
}

// Create menu mutation
export function useCreateMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMenuRequest) => menuService.createMenu(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
      // Note: Toast and redirect handled by the calling component
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Failed to create menu'));
    },
  });
}

// Update menu mutation
export function useUpdateMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateMenuRequest & { id: string | number }) =>
      menuService.updateMenu(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
      // Note: Toast and redirect handled by the calling component
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Failed to update menu'));
    },
  });
}

// Delete menu mutation
export function useDeleteMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => menuService.deleteMenu(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
      toast.success('Menu deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Failed to delete menu'));
    },
  });
}
