'use client';

import { Navigation } from "@/components/Navigation";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { ArrowLeftIcon, PencilIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import toast from 'react-hot-toast';
import { useGetUserById, useUpdateUser } from "@/hooks/useUser";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

const roleOptions = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
];

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function UserDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    username: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const updateUser = useUpdateUser();

  // fetch user by id
  const { data: user, isLoading, error } = useGetUserById(params.id);

  // Initialize form data when user data is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        username: user.username,
        password: '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    
    try {
      await updateUser.mutateAsync({
        id: params.id,
        ...formData,
      });
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value
    }));
    if (fieldErrors.role) {
      setFieldErrors(prev => ({
        ...prev,
        role: ''
      }));
    }
  };

  if (isLoading) {
    return (
      <Navigation>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Navigation>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Navigation>
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push('/users-management')}
          className="inline-flex items-center gap-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
          Back to Users List
        </button>

      </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-12">
            <div className="border-b border-gray-900/10 pb-12">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit User</h1>
              <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <Input
                    label="Name"
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    error={fieldErrors.name}
                    autoComplete="name"
                  />
                </div>

                <div className="sm:col-span-4">
                  <Input
                    label="Email address"
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    error={fieldErrors.email}
                    autoComplete="email"
                  />
                </div>

                <div className="sm:col-span-4">
                  <Input
                    label="Username"
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    error={fieldErrors.username}
                    helperText="Username must be unique"
                  />
                </div>

                <div className="sm:col-span-4">
                  <Input
                    label="Password"
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={fieldErrors.password}
                    helperText="Leave blank to keep current password"
                  />
                </div>

                <div className="sm:col-span-3">
                  <Select
                    label="Role"
                    name="role"
                    options={roleOptions}
                    value={formData.role}
                    onChange={handleRoleChange}
                    error={fieldErrors.role}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          {
            (currentUser?.role === 'root' || currentUser?.role === 'admin') && (
                <div className="mt-6 flex items-center justify-end gap-x-4">
                    <button
                        type="button"
                        onClick={() => router.push('/users-management')}
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                    type="submit"
                    disabled={updateUser.isPending}
                    className="inline-flex items-center gap-x-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed dark:bg-primary dark:hover:bg-primary-dark"
                    >
                    {updateUser.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            )
          }
        </form>
    </Navigation>
  );
} 