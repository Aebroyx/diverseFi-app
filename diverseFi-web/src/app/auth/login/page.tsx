'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/store/features/authSlice';
import { userService } from '@/services/userService';
import { PrimaryButton } from '@/components/ui/buttons';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/axios';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth({ requireAuth: false }); // This page doesn't require auth
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  // If user is already authenticated, the hook will handle the redirect
  if (isAuthenticated) {
    return null; // or a loading spinner
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await userService.login(formData);

      // Update Redux state with user data only (tokens are in cookies)
      dispatch(setCredentials({
        user: response.user as any
      }));
      
      // Show success message
      toast.success('Login successful!');
      
      // Redirect to home page
      router.push('/');
    } catch (err) {
      // Show error message
      toast.error(getErrorMessage(err as Error, 'Failed to login'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h1 className="text-center text-3xl font-bold tracking-tight text-primary">
            DiverseFi
          </h1>
          <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-foreground">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground">
                Username
              </label>
              <div className="mt-2">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-border-dark dark:bg-input-bg dark:text-white"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                {/* <div className="text-sm">
                  <Link href="/auth/forgot-password" className="font-semibold text-primary hover:text-primary-dark">
                    Forgot password?
                  </Link>
                </div> */}
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-border-dark dark:bg-input-bg dark:text-white"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div>
              <PrimaryButton
                type="submit"
                loading={isLoading}
                disabled={isLoading}
                fullWidth
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </PrimaryButton>
            </div>
          </form>

          <p className="mt-10 text-center text-sm text-foreground">
            Not a member?{' '}
            <Link href="/auth/register" className="font-semibold text-primary hover:text-primary-dark">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}