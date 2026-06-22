'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormCard, FormSection, FormRow, FormActions } from '@/components/ui/FormCard';
import Input, { Toggle } from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { MenuPermissionsEditor, MenuPermission } from '@/components/ui/MenuPermissionsEditor';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { useCreateUser } from '@/hooks/useUser';
import { useGetActiveRoles } from '@/hooks/useRole';
import { useGetMenuTree, useGetRoleMenus, useBulkSaveUserRightsAccess } from '@/hooks/useMenu';
import { usePermission } from '@/hooks/usePermission';
import toast from 'react-hot-toast';
import { validatePassword, PASSWORD_REQUIREMENTS } from '@/lib/utils';

export default function AddUserPage() {
  const router = useRouter();
  const { can_write: hasWritePermission, isLoading: permissionsLoading } = usePermission('/users-management');
  const createUser = useCreateUser();
  const bulkSaveRightsAccess = useBulkSaveUserRightsAccess();
  const { data: roles, isLoading: rolesLoading } = useGetActiveRoles();
  const { data: menuTree, isLoading: menusLoading } = useGetMenuTree();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: '',
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get the selected role's ID
  const selectedRole = roles?.find((r) => r.name === formData.role);
  const { data: roleMenus, isLoading: roleMenusLoading } = useGetRoleMenus(selectedRole?.id);

  // Convert roles to select options
  const roleOptions =
    roles?.map((role) => ({
      value: role.name,
      label: role.display_name,
    })) || [];

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

  // Use ref to store permissions to avoid re-renders
  const permissionsRef = useRef<MenuPermission[]>([]);

  const handlePermissionsChange = useCallback((newPermissions: MenuPermission[]) => {
    permissionsRef.current = newPermissions;
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else {
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
    if (!hasWritePermission) {
      toast.error('You do not have permission to create users');
      return;
    }
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Get the role ID from the selected role
      const role = roles?.find((r) => r.name === formData.role);
      if (!role) {
        toast.error('Invalid role selected');
        setIsSubmitting(false);
        return;
      }

      // Create the user first
      const newUser = await createUser.mutateAsync({
        name: formData.name,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        role_id: role.id,
        is_active: formData.is_active,
      });

      // Extract user ID from response
      const userId = newUser?.id;

      // Save ONLY custom permission overrides (not inherited ones)
      if (permissionsRef.current.length > 0 && userId) {
        // Filter to only include permissions with at least one custom override
        const customPermissions = permissionsRef.current.filter((p) => p.isCustomized);

        if (customPermissions.length > 0) {
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
        }
      }

      toast.success('User created successfully');
      router.push('/users-management');
    } catch (error) {
      console.error('Create failed:', error);
      setIsSubmitting(false);
    }
  };

  const isLoading = rolesLoading || menusLoading;

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Loading permissions...</div>
      </div>
    );
  }

  if (!hasWritePermission) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-800 dark:bg-yellow-900/20">
        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400">Permission Denied</h3>
        <p className="mt-2 text-yellow-700 dark:text-yellow-300">
          You do not have permission to create users. Please contact your administrator if you need access.
        </p>
        <Link href="/users-management" className="mt-4 inline-block">
          <SecondaryButton>Back to Users Management</SecondaryButton>
        </Link>
      </div>
    );
  }

  return (
        <form onSubmit={handleSubmit}>
          <FormCard
            title="Create New User"
            description="Add a new user to your application with role-based permissions."
            actions={
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </PrimaryButton>
              </FormActions>
            }
        >
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
                  required
                />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="Password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  helperText={PASSWORD_REQUIREMENTS}
                  autoComplete="new-password"
                  required
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
                  disabled={rolesLoading}
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
            {formData.role && (
              <FormSection
                title="Menu Permissions"
                description="Customize menu access for this user. By default, permissions are inherited from the selected role. Click on any permission to customize it."
              >
                <MenuPermissionsEditor
                  roleMenus={roleMenus || []}
                  allMenus={menuTree || []}
                  isLoading={isLoading || roleMenusLoading}
                  onChange={handlePermissionsChange}
                  disabled={isSubmitting}
                />
              </FormSection>
            )}
          </div>
        </FormCard>
      </form>
  );
}
