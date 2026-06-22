import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService, GetUserResponse, GetAllUsersParams, PaginatedResponse } from '@/services/userService';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// Create User Mutation
export function useCreateUser() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: { name: string; email: string; username: string; password: string; role: string }) => 
      userService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
      router.push('/users-management');
    },
    onError: (error: Error) => {
      try {
        const errorResponse = JSON.parse(error.message);
        if (errorResponse.status === 'error' && errorResponse.message) {
          toast.error(errorResponse.message);
        } else {
          toast.error('Failed to create user');
        }
      } catch {
        toast.error('Failed to create user');
      }
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
  const router = useRouter();
  
  return useMutation({
    mutationFn: (data: { id: string; name: string; email: string; username: string; password: string; role: string }) => 
      userService.updateUser(data.id, {
        name: data.name,
        email: data.email,
        role: data.role,
        username: data.username,
        password: data.password || '',
      }),
    onSuccess: (updatedUser) => {
      // Invalidate both queries to force a refetch
      queryClient.invalidateQueries({ queryKey: ['user', updatedUser.id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      toast.success('User updated successfully');
      router.push('/users-management');
    },
    onError: (error: Error) => {
        try {
            const errorResponse = JSON.parse(error.message);
            if (errorResponse.status === 'error' && errorResponse.message) {
            toast.error(errorResponse.message);
            } else {
            toast.error('Failed to update user');
            }
        } catch {
            toast.error('Failed to update user');
        }
        },
    });
}

// Delete User Mutation
export function useDeleteUser() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (id: number) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: (error: Error) => {
      try {
        const errorResponse = JSON.parse(error.message);
        if (errorResponse.status === 'error' && errorResponse.message) {
          toast.error(errorResponse.message);
        } else {
          toast.error('Failed to delete user');
        }
      } catch {
        toast.error('Failed to delete user');
      }
    },
  });
}

// Soft Delete User Mutation
export function useSoftDeleteUser() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (id: number) => userService.softDeleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User soft deleted successfully');
    },
    onError: (error: Error) => {
      try {
        const errorResponse = JSON.parse(error.message);
        if (errorResponse.status === 'error' && errorResponse.message) {
          toast.error(errorResponse.message);
        } else {
          toast.error('Failed to soft delete user');
        }
      } catch {
        toast.error('Failed to soft delete user');
      }
    },
  });
}
