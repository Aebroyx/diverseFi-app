import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

interface UseAuthOptions {
  requireAuth?: boolean;
}

export function useAuth({ requireAuth = true }: UseAuthOptions = {}) {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = !!user;

  useEffect(() => {
    // If auth is required and user is not authenticated, redirect to login
    if (requireAuth && !isAuthenticated) {
      router.push('/auth/login');
    }
    
    // If auth is not required and user is authenticated, redirect to home
    if (!requireAuth && isAuthenticated) {
      router.push('/');
    }
  }, [requireAuth, isAuthenticated, router]);

  return {
    isAuthenticated,
    user,
  };
} 