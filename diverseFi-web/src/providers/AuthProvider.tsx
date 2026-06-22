'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/store/features/authSlice';
import { useQuery } from '@tanstack/react-query';
import { User } from '@/store/features/authSlice';

async function getCurrentUser(): Promise<User> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Not authenticated');
  }

  return response.json();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();

  const { data, isError } = useQuery({
    queryKey: ['me'],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    gcTime: Infinity,
  });

  // Update Redux store when query state changes - use useEffect to avoid state updates during render
  useEffect(() => {
    if (isError) {
      dispatch(setCredentials({ user: null }));
    } else if (data) {
      dispatch(setCredentials({ user: data }));
    }
  }, [data, isError, dispatch]);

  return <>{children}</>;
} 