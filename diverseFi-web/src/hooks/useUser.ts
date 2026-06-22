import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService, GetUserResponse, GetAllUsersParams, PaginatedResponse, ResetPasswordRequest } from '@/services/userService';
import { getErrorMessage } from '@/lib/axios';
import toast from 'react-hot-toast';

// Create User Mutation
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; email: string; username: string; password: string; role_id: number; is_active: boolean }) =>
      userService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // Note: Toast and redirect handled by the calling component
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Failed to create user'));
    },
  });
}

// Get User by ID Query
export function useGetUserById(id: string) {
  return useQuery<GetUserResponse, Error>({
    queryKey: ['user', id],
    queryFn: () => userService.getUserById(id),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

// Get All Users Query
export function useGetAllUsers(params: GetAllUsersParams) {
  return useQuery<PaginatedResponse<GetUserResponse>, Error>({
    queryKey: ['users', params],
    queryFn: () => userService.getAllUsers(params),
    placeholderData: (previousData) => previousData, // Keep previous data while loading new data
  });
}

// Update User Mutation
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      id: string;
      name: string;
      email: string;
      username: string;
      password: string;
      role_id: number;
      is_active: boolean;
    }) =>
      userService.updateUser(data.id, {
        name: data.name,
        email: data.email,
        role_id: data.role_id,
        username: data.username,
        password: data.password || '',
        is_active: data.is_active,
      }),
    onSuccess: (updatedUser) => {
      // Invalidate both queries to force a refetch
      queryClient.invalidateQueries({ queryKey: ['user', updatedUser.id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // Note: Toast and redirect handled by the calling component
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Failed to update user'));
    },
  });
}

// Delete User Mutation
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Failed to delete user'));
    },
  });
}

// Soft Delete User Mutation
export function useSoftDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => userService.softDeleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User soft deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Failed to soft delete user'));
    },
  });
}

// Reset Password Mutation
export function useResetPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string | number } & ResetPasswordRequest) =>
      userService.resetPassword(data.id, {
        current_password: data.current_password,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      }),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['user', updatedUser.id] });
      toast.success('Password reset successfully');
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Failed to reset password'));
    },
  });
}
