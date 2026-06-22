'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormCard, FormSection, FormRow, FormActions } from '@/components/ui/FormCard';
import Input, { Textarea, Toggle } from '@/components/ui/Input';
import { RoleMenuPermissionsEditor, RoleMenuPermission } from '@/components/ui/RoleMenuPermissionsEditor';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { useGetRoleById, useUpdateRole, useBulkAssignMenusToRole } from '@/hooks/useRole';
import { useGetMenuTree, useGetRoleMenus } from '@/hooks/useMenu';
import { usePermission } from '@/hooks/usePermission';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import toast from 'react-hot-toast';

export default function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { can_update: hasUpdatePermission, isLoading: permissionsLoading } = usePermission('/roles-management');
  const { data: role, isLoading, error } = useGetRoleById(id);
  const { data: menuTree, isLoading: menusLoading } = useGetMenuTree();
  const { data: roleMenus, isLoading: roleMenusLoading } = useGetRoleMenus(role?.id);
  const updateRole = useUpdateRole();
  const bulkAssignMenus = useBulkAssignMenusToRole();

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

  // Populate form when role data loads
  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        display_name: role.display_name,
        description: role.description || '',
        is_active: role.is_active,
      });
    }
  }, [role]);

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
    if (!hasUpdatePermission) {
      toast.error('You do not have permission to update roles');
      return;
    }
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Update role info
      await updateRole.mutateAsync({
        id: id,
        ...formData,
      });

      // Save menu permissions (all selected menus)
      const selectedMenus = permissionsRef.current.filter((p) => p.isSelected);
      const menusToAssign = selectedMenus.map((p) => ({
        menu_id: p.menuId,
        can_read: p.canRead,
        can_write: p.canWrite,
        can_update: p.canUpdate,
        can_delete: p.canDelete,
      }));

      // Always save permissions (even if empty - this clears unselected menus)
      if (role?.id) {
        await bulkAssignMenus.mutateAsync({
          roleId: role.id,
          permissions: menusToAssign,
        });
      }

      toast.success('Role updated successfully');
      router.push('/roles-management');
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
        Error: {error instanceof Error ? error.message : 'Failed to fetch role'}
      </div>
    );
  }

  const canEdit = hasUpdatePermission;

  return (
    <form onSubmit={handleSubmit}>
        <FormCard
          title={isLoading ? 'Loading...' : `Edit Role: ${role?.display_name}`}
          description="Update role information and settings."
          actions={
            canEdit ? (
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
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </PrimaryButton>
              </FormActions>
            ) : undefined
          }
        >
          {isLoading ? (
            <div className="space-y-8">
              <div className="space-y-6">
                <Skeleton height={20} width={150} />
                <div className="grid gap-6 sm:grid-cols-2">
                  <Skeleton height={70} />
                  <Skeleton height={70} />
                </div>
                <Skeleton height={100} />
              </div>
            </div>
          ) : (
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
                    disabled={!canEdit || role?.is_default}
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
                    disabled={!canEdit}
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
                  disabled={!canEdit}
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
                  disabled={!canEdit || role?.is_default}
                />

                {role?.is_default && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                    This is the default role. Some settings cannot be changed.
                  </div>
                )}
              </FormSection>

              <FormSection
                title="Menu Permissions"
                description="Select which menus this role can access and set their permissions."
              >
                <RoleMenuPermissionsEditor
                  allMenus={menuTree || []}
                  roleMenus={roleMenus || []}
                  isLoading={menusLoading || roleMenusLoading}
                  onChange={handlePermissionsChange}
                  disabled={isSubmitting || !canEdit}
                />
              </FormSection>

              {!canEdit && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                  You don&apos;t have permission to edit this role.
                </div>
              )}
            </div>
          )}
        </FormCard>
      </form>
  );
}
