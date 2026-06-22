'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormCard, FormSection, FormRow, FormActions } from '@/components/ui/FormCard';
import Input, { Toggle } from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { MenuPermissionsEditor, MenuPermission } from '@/components/ui/MenuPermissionsEditor';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { useGetUserById, useUpdateUser } from '@/hooks/useUser';
import { useGetActiveRoles } from '@/hooks/useRole';
import {
  useGetMenuTree,
  useGetRoleMenus,
  useGetUserRightsAccess,
  useBulkSaveUserRightsAccess,
} from '@/hooks/useMenu';
import { usePermission } from '@/hooks/usePermission';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import toast from 'react-hot-toast';
import { validatePassword, PASSWORD_REQUIREMENTS } from '@/lib/utils';

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { can_update: hasUpdatePermission, isLoading: permissionsLoading } = usePermission('/users-management');
  const { data: user, isLoading, error } = useGetUserById(id);
  const { data: roles, isLoading: rolesLoading } = useGetActiveRoles();
  const { data: menuTree, isLoading: menusLoading } = useGetMenuTree();
  const updateUser = useUpdateUser();
  const bulkSaveRightsAccess = useBulkSaveUserRightsAccess();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: '',
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use ref to store permissions to avoid unnecessary re-renders
  const permissionsRef = useRef<MenuPermission[]>([]);

  // Get the selected role's ID for fetching role menus
  const selectedRole = roles?.find((r) => r.name === formData.role);
  const { data: roleMenus, isLoading: roleMenusLoading } = useGetRoleMenus(selectedRole?.id);

  // Get user's existing rights access
  const userId = user?.id ? Number(user.id) : undefined;
  const { data: userRightsAccess, isLoading: rightsLoading } = useGetUserRightsAccess(userId);

  // Convert roles to select options
  const roleOptions =
    roles?.map((role) => ({
      value: role.name,
      label: role.display_name,
    })) || [];

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        username: user.username,
        password: '',
        role: user.role?.name || '',
        is_active: user.is_active,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }));
    if (errors.role) {
      setErrors((prev) => ({ ...prev, role: '' }));
    }
  };

  const handleChangeActive = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_active: checked }));
    if (errors.is_active) {
      setErrors((prev) => ({ ...prev, is_active: '' }));
    }
  };

  const handlePermissionsChange = useCallback((newPermissions: MenuPermission[]) => {
    permissionsRef.current = newPermissions;
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (formData.password) {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors.join('. ');
      }
    }
    if (!formData.role) newErrors.role = 'Role is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasUpdatePermission) {
      toast.error('You do not have permission to update users');
      return;
    }
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Update user info
      await updateUser.mutateAsync({
        id: id,
        name: formData.name,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        role_id: selectedRole?.id || 0,
        is_active: formData.is_active,
      });

      // Save ONLY custom permission overrides (not inherited ones)
      // Filter to only include permissions with at least one custom override
      const customPermissions = permissionsRef.current.filter((p) => p.isCustomized);

      if (userId && customPermissions.length > 0) {
        const permissionsToSave = customPermissions.map((p) => ({
          menu_id: p.menuId,
          can_read: p.canRead,       // nullable: null = inherit, true/false = override
          can_write: p.canWrite,     // nullable: null = inherit, true/false = override
          can_update: p.canUpdate,   // nullable: null = inherit, true/false = override
          can_delete: p.canDelete,   // nullable: null = inherit, true/false = override
        }));

        await bulkSaveRightsAccess.mutateAsync({
          userId,
          permissions: permissionsToSave,
        });
      } else if (userId && customPermissions.length === 0) {
        // If no custom permissions, delete all overrides (user will inherit from role)
        await bulkSaveRightsAccess.mutateAsync({
          userId,
          permissions: [],
        });
      }

      toast.success('User updated successfully');
      router.push('/users-management');
    } catch (error) {
      console.error('Update failed:', error);
      setIsSubmitting(false);
    }
  };

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Loading permissions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        Error: {error instanceof Error ? error.message : 'Failed to fetch user'}
      </div>
    );
  }

  const canEdit = hasUpdatePermission;
  const isDataLoading = isLoading || menusLoading || rolesLoading;
  const isPermissionsLoading = roleMenusLoading || rightsLoading;

  return (
    <>
      <form onSubmit={handleSubmit}>
        <FormCard
          title={isLoading ? 'Loading...' : `Edit User: ${user?.name}`}
          description="Update user information, credentials, and permissions."
          actions={
            canEdit ? (
              <FormActions>
                <Link href="/users-management">
                  <SecondaryButton
                    type="button"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </SecondaryButton>
                </Link>
                <PrimaryButton
                  type="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </PrimaryButton>
              </FormActions>
            ) : undefined
          }
        >
          {isDataLoading ? (
            <div className="space-y-8">
              <div className="space-y-6">
                <Skeleton height={20} width={150} />
                <div className="grid gap-6 sm:grid-cols-2">
                  <Skeleton height={70} />
                  <Skeleton height={70} />
                </div>
              </div>
              <div className="space-y-6">
                <Skeleton height={20} width={150} />
                <div className="grid gap-6 sm:grid-cols-2">
                  <Skeleton height={70} />
                  <Skeleton height={70} />
                </div>
                <Skeleton height={70} />
              </div>
              <div className="space-y-6">
                <Skeleton height={20} width={150} />
                <Skeleton height={200} />
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <FormSection
                title="Personal Information"
                description="Basic information about the user."
              >
                <FormRow columns={2}>
                  <Input
                    id="name"
                    name="name"
                    label="Full Name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    disabled={!canEdit}
                    required
                  />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    label="Email Address"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    disabled={!canEdit}
                    required
                  />
                </FormRow>
              </FormSection>

              <FormSection
                title="Account Details"
                description="Login credentials and role assignment."
              >
                <FormRow columns={2}>
                  <Input
                    id="username"
                    name="username"
                    label="Username"
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={handleChange}
                    error={errors.username}
                    helperText="Must be unique. Used for login."
                    autoComplete="username"
                    disabled={!canEdit}
                    required
                  />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    label="New Password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    helperText={`Leave blank to keep current password. ${PASSWORD_REQUIREMENTS}`}
                    autoComplete="new-password"
                    disabled={!canEdit}
                  />
                </FormRow>

                <FormRow columns={2}>
                  <Select
                    label="Role"
                    name="role"
                    options={roleOptions}
                    value={formData.role}
                    onChange={handleRoleChange}
                    error={errors.role}
                    disabled={!canEdit || rolesLoading}
                    placeholder="Select a role"
                    required
                  />
                  <Toggle
                    label="Active"
                    description="Active users can login and access the application. Inactive users cannot login."
                    checked={formData.is_active}
                    onChange={handleChangeActive}
                  />
                </FormRow>
              </FormSection>

              {/* Menu Permissions Section */}
              {formData.role && canEdit && (
                <FormSection
                  title="Menu Permissions"
                  description="Customize menu access for this user. By default, permissions are inherited from the selected role. Click on any permission to customize it."
                >
                  <MenuPermissionsEditor
                    roleMenus={roleMenus || []}
                    allMenus={menuTree || []}
                    userRightsAccess={userRightsAccess || []}
                    isLoading={isPermissionsLoading}
                    onChange={handlePermissionsChange}
                    disabled={isSubmitting}
                  />
                </FormSection>
              )}

              {!canEdit && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                  You don&apos;t have permission to edit this user.
                </div>
              )}
            </div>
          )}
        </FormCard>
      </form>
    </>
  );
}
