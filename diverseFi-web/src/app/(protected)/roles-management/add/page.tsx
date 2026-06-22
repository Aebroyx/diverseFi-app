'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormCard, FormSection, FormRow, FormActions } from '@/components/ui/FormCard';
import Input, { Textarea, Toggle } from '@/components/ui/Input';
import { RoleMenuPermissionsEditor, RoleMenuPermission } from '@/components/ui/RoleMenuPermissionsEditor';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { useCreateRole, useBulkAssignMenusToRole } from '@/hooks/useRole';
import { useGetMenuTree } from '@/hooks/useMenu';
import { usePermission } from '@/hooks/usePermission';
import toast from 'react-hot-toast';

export default function AddRolePage() {
  const router = useRouter();
  const { can_write: hasWritePermission, isLoading: permissionsLoading } = usePermission('/roles-management');
  const createRole = useCreateRole();
  const bulkAssignMenus = useBulkAssignMenusToRole();
  const { data: menuTree, isLoading: menusLoading } = useGetMenuTree();
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use ref to store permissions to avoid re-renders
  const permissionsRef = useRef<RoleMenuPermission[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleToggle = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_active: checked }));
  };

  const handlePermissionsChange = useCallback((newPermissions: RoleMenuPermission[]) => {
    permissionsRef.current = newPermissions;
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Role identifier is required';
    } else if (!/^[a-z_]+$/.test(formData.name)) {
      newErrors.name = 'Only lowercase letters and underscores allowed';
    }
    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Display name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasWritePermission) {
      toast.error('You do not have permission to create roles');
      return;
    }
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Create the role first
      const newRole = await createRole.mutateAsync(formData);

      // If there are selected menus, assign them
      const selectedMenus = permissionsRef.current.filter((p) => p.isSelected);
      if (selectedMenus.length > 0 && newRole?.id) {
        const menusToAssign = selectedMenus.map((p) => ({
          menu_id: p.menuId,
          can_read: p.canRead,
          can_write: p.canWrite,
          can_update: p.canUpdate,
          can_delete: p.canDelete,
        }));

        await bulkAssignMenus.mutateAsync({
          roleId: newRole.id,
          permissions: menusToAssign,
        });
      }

      toast.success('Role created successfully');
      router.push('/roles-management');
    } catch (error) {
      console.error('Create failed:', error);
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

  if (!hasWritePermission) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-800 dark:bg-yellow-900/20">
        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400">Permission Denied</h3>
        <p className="mt-2 text-yellow-700 dark:text-yellow-300">
          You do not have permission to create roles. Please contact your administrator if you need access.
        </p>
        <Link href="/roles-management" className="mt-4 inline-block">
          <SecondaryButton>Back to Roles Management</SecondaryButton>
        </Link>
      </div>
    );
  }

  return (
        <form onSubmit={handleSubmit}>
          <FormCard
            title="Create New Role"
            description="Add a new role to manage user permissions in your application."
            actions={
              <FormActions>
                <Link href="/roles-management">
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
                  {isSubmitting ? 'Creating...' : 'Create Role'}
                </PrimaryButton>
              </FormActions>
            }
        >
          <div className="space-y-8">
            <FormSection
              title="Role Information"
              description="Basic information about the role."
            >
              <FormRow columns={2}>
                <Input
                  id="name"
                  name="name"
                  label="Role Identifier"
                  placeholder="e.g., admin, manager, viewer"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  helperText="Lowercase letters and underscores only. Used internally."
                  required
                />
                <Input
                  id="display_name"
                  name="display_name"
                  label="Display Name"
                  placeholder="e.g., Administrator, Manager"
                  value={formData.display_name}
                  onChange={handleChange}
                  error={errors.display_name}
                  helperText="Human-readable name shown to users."
                  required
                />
              </FormRow>

              <Textarea
                id="description"
                name="description"
                label="Description"
                placeholder="Describe what this role can do..."
                value={formData.description}
                onChange={handleChange}
                rows={3}
                helperText="Optional description of the role's permissions and purpose."
              />
            </FormSection>

            <FormSection
              title="Settings"
              description="Configure role behavior."
            >
              <Toggle
                label="Active"
                description="Active roles can be assigned to users. Inactive roles are hidden."
                checked={formData.is_active}
                onChange={handleToggle}
              />
            </FormSection>

            <FormSection
              title="Menu Permissions"
              description="Select which menus this role can access and set their permissions."
            >
              <RoleMenuPermissionsEditor
                allMenus={menuTree || []}
                isLoading={menusLoading}
                onChange={handlePermissionsChange}
                disabled={isSubmitting}
              />
            </FormSection>
          </div>
        </FormCard>
      </form>
  );
}
