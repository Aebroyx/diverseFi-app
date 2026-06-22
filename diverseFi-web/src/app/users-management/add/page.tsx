'use client';

import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useCreateUser } from "@/hooks/useUser";
import toast from 'react-hot-toast';

const roleOptions = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
];

export default function AddUserPage() {
  const router = useRouter();
  const createUser = useCreateUser();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    username: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    await createUser.mutateAsync(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear field error when user starts typing
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

  return (
    <Navigation>
      <div className="mb-6">
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Add New User</h1>

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
                  required
                  value={formData.password}
                  onChange={handleChange}
                  error={fieldErrors.password}
                  helperText="Password must be at least 8 characters long"
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
            disabled={createUser.isPending}
            className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed dark:bg-primary dark:hover:bg-primary-dark"
          >
            {createUser.isPending ? 'Creating...' : 'Submit'}
          </button>
        </div>
      </form>
    </Navigation>
  );
}
