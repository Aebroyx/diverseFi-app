'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { RoleMenuResponse, RightsAccessResponse, MenuResponse } from '@/services/menuService';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Permission type for external use
export interface MenuPermission {
  menuId: number;
  menuName: string;
  menuPath: string;
  canRead: boolean | null;
  canWrite: boolean | null;
  canUpdate: boolean | null;
  canDelete: boolean | null;
  isCustomized: boolean;
  // Effective values (resolved from role if null)
  effectiveCanRead: boolean;
  effectiveCanWrite: boolean;
  effectiveCanUpdate: boolean;
  effectiveCanDelete: boolean;
}

// Internal permission state
interface PermissionState {
  menuId: number;
  menuName: string;
  menuPath: string;
  // Role defaults
  roleCanRead: boolean;
  roleCanWrite: boolean;
  roleCanUpdate: boolean;
  roleCanDelete: boolean;
  // User overrides (null = inherit from role)
  canRead: boolean | null;
  canWrite: boolean | null;
  canUpdate: boolean | null;
  canDelete: boolean | null;
}

interface MenuPermissionsEditorProps {
  roleMenus: RoleMenuResponse[];
  allMenus: MenuResponse[];
  userRightsAccess?: RightsAccessResponse[];
  isLoading?: boolean;
  onChange: (permissions: MenuPermission[]) => void;
  disabled?: boolean;
}

type PermissionKey = 'canRead' | 'canWrite' | 'canUpdate' | 'canDelete';

const PERMISSION_LABELS: Record<PermissionKey, string> = {
  canRead: 'Read',
  canWrite: 'Write',
  canUpdate: 'Update',
  canDelete: 'Delete',
};

// Flatten menus for display
function flattenMenus(menus: MenuResponse[], parentPath = ''): { id: number; name: string; path: string; displayName: string }[] {
  const result: { id: number; name: string; path: string; displayName: string }[] = [];
  menus.forEach((menu) => {
    const displayName = parentPath ? `${parentPath} / ${menu.name}` : menu.name;
    result.push({ id: menu.id, name: menu.name, path: menu.path, displayName });
    if (menu.children && menu.children.length > 0) {
      result.push(...flattenMenus(menu.children, displayName));
    }
  });
  return result;
}

// Build initial permissions from props
function buildInitialPermissions(
  roleMenus: RoleMenuResponse[],
  allMenus: MenuResponse[],
  userRightsAccess: RightsAccessResponse[]
): PermissionState[] {
  const rolePermissionMap = new Map<number, RoleMenuResponse>();
  roleMenus.forEach((rm) => rolePermissionMap.set(rm.menu_id, rm));

  const userRightsMap = new Map<number, RightsAccessResponse>();
  userRightsAccess.forEach((ra) => userRightsMap.set(ra.menu_id, ra));

  const flatMenus = flattenMenus(allMenus);

  return flatMenus.map((menu): PermissionState => {
    const rolePerms = rolePermissionMap.get(menu.id);
    const userRights = userRightsMap.get(menu.id);

    return {
      menuId: menu.id,
      menuName: menu.displayName,
      menuPath: menu.path,
      roleCanRead: rolePerms?.can_read ?? false,
      roleCanWrite: rolePerms?.can_write ?? false,
      roleCanUpdate: rolePerms?.can_update ?? false,
      roleCanDelete: rolePerms?.can_delete ?? false,
      canRead: userRights?.can_read ?? null,
      canWrite: userRights?.can_write ?? null,
      canUpdate: userRights?.can_update ?? null,
      canDelete: userRights?.can_delete ?? null,
    };
  });
}

// Convert internal state to external format
function toExternalFormat(permissions: PermissionState[]): MenuPermission[] {
  return permissions.map((p) => ({
    menuId: p.menuId,
    menuName: p.menuName,
    menuPath: p.menuPath,
    canRead: p.canRead,
    canWrite: p.canWrite,
    canUpdate: p.canUpdate,
    canDelete: p.canDelete,
    isCustomized: p.canRead !== null || p.canWrite !== null || p.canUpdate !== null || p.canDelete !== null,
    // Effective values (resolve null to role defaults)
    effectiveCanRead: p.canRead !== null ? p.canRead : p.roleCanRead,
    effectiveCanWrite: p.canWrite !== null ? p.canWrite : p.roleCanWrite,
    effectiveCanUpdate: p.canUpdate !== null ? p.canUpdate : p.roleCanUpdate,
    effectiveCanDelete: p.canDelete !== null ? p.canDelete : p.roleCanDelete,
  }));
}

export function MenuPermissionsEditor({
  roleMenus,
  allMenus,
  userRightsAccess = [],
  isLoading = false,
  onChange,
  disabled = false,
}: MenuPermissionsEditorProps) {
  const [permissions, setPermissions] = useState<PermissionState[]>([]);
  const isInitializedRef = useRef(false);

  // Create stable keys for comparison to avoid infinite loops
  const allMenusKey = allMenus.map((m) => m.id).join(',');
  const roleMenusKey = roleMenus
    .map((rm) => `${rm.menu_id}-${rm.can_read}-${rm.can_write}-${rm.can_update}-${rm.can_delete}`)
    .join(',');
  const userRightsKey = userRightsAccess
    .map((ra) => `${ra.menu_id}-${ra.can_read}-${ra.can_write}-${ra.can_update}-${ra.can_delete}`)
    .join(',');

  const prevKeysRef = useRef({ allMenusKey: '', roleMenusKey: '', userRightsKey: '' });

  // Initialize permissions when data changes
  useEffect(() => {
    // Check if keys actually changed
    const keysChanged =
      prevKeysRef.current.allMenusKey !== allMenusKey ||
      prevKeysRef.current.roleMenusKey !== roleMenusKey ||
      prevKeysRef.current.userRightsKey !== userRightsKey;

    if (keysChanged || !isInitializedRef.current) {
      prevKeysRef.current = { allMenusKey, roleMenusKey, userRightsKey };
      const newPermissions = buildInitialPermissions(roleMenus, allMenus, userRightsAccess);
      setPermissions(newPermissions);

      // IMPORTANT: Notify parent of initial permissions so they're available when form submits
      const external = toExternalFormat(newPermissions);
      onChange(external);

      isInitializedRef.current = true;
    }
  }, [allMenusKey, roleMenusKey, userRightsKey, roleMenus, allMenus, userRightsAccess, onChange]);

  // Get effective permission value
  const getEffectiveValue = (perm: PermissionState, key: PermissionKey): boolean => {
    const userValue = perm[key];
    if (userValue !== null) return userValue;
    const roleKey = `role${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof PermissionState;
    return perm[roleKey] as boolean;
  };

  // Check if permission is inherited
  const isInherited = (perm: PermissionState, key: PermissionKey): boolean => {
    return perm[key] === null;
  };

  // Toggle a single permission (cycles: inherit -> true -> false -> inherit)
  const togglePermission = (menuId: number, key: PermissionKey) => {
    if (disabled) return;

    setPermissions((prev) => {
      const updated = prev.map((perm) => {
        if (perm.menuId !== menuId) return perm;

        const roleKey = `role${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof PermissionState;
        const roleValue = perm[roleKey] as boolean;
        const currentValue = perm[key];

        let newValue: boolean | null;
        if (currentValue === null) {
          // Currently inheriting, set to opposite of role
          newValue = !roleValue;
        } else if (currentValue === true) {
          newValue = false;
        } else {
          // currentValue === false, go back to inherit
          newValue = null;
        }

        return { ...perm, [key]: newValue };
      });

      // Notify parent of changes
      onChange(toExternalFormat(updated));
      return updated;
    });
  };

  // Reset a menu to role defaults
  const resetToRoleDefaults = (menuId: number) => {
    if (disabled) return;

    setPermissions((prev) => {
      const updated = prev.map((perm) => {
        if (perm.menuId !== menuId) return perm;
        return {
          ...perm,
          canRead: null,
          canWrite: null,
          canUpdate: null,
          canDelete: null,
        };
      });

      onChange(toExternalFormat(updated));
      return updated;
    });
  };

  // Reset all to role defaults
  const resetAllToRoleDefaults = () => {
    if (disabled) return;

    setPermissions((prev) => {
      const updated = prev.map((perm) => ({
        ...perm,
        canRead: null,
        canWrite: null,
        canUpdate: null,
        canDelete: null,
      }));

      onChange(toExternalFormat(updated));
      return updated;
    });
  };

  // Check if a permission is customized
  const isCustomized = (perm: PermissionState): boolean => {
    return perm.canRead !== null || perm.canWrite !== null || perm.canUpdate !== null || perm.canDelete !== null;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton height={40} />
        <Skeleton height={60} count={5} className="mb-2" />
      </div>
    );
  }

  if (permissions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center dark:border-border-dark dark:bg-card-bg/50">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No menus available. Please assign menus to the selected role first.
        </p>
      </div>
    );
  }

  const customizedCount = permissions.filter(isCustomized).length;

  return (
    <div className="space-y-4">
      {/* Header with reset button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {customizedCount > 0 ? (
            <span className="text-amber-600 dark:text-amber-400">
              {customizedCount} menu(s) with custom permissions
            </span>
          ) : (
            <span>All permissions inherited from role</span>
          )}
        </div>
        {customizedCount > 0 && !disabled && (
          <button
            type="button"
            onClick={resetAllToRoleDefaults}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Reset all to role defaults
          </button>
        )}
      </div>

      {/* Permissions table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-border-dark">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-border-dark">
            <thead className="bg-gray-50 dark:bg-transparent">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Menu
                </th>
                {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                  <th
                    key={key}
                    className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {label}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-border-dark dark:bg-input-bg">
              {permissions.map((perm) => {
                const customized = isCustomized(perm);
                return (
                  <tr
                    key={perm.menuId}
                    className={customized ? 'bg-amber-50 dark:bg-hover-bg' : ''}
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {perm.menuName}
                        </span>
                        {customized && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{perm.menuPath}</div>
                    </td>
                    {(Object.keys(PERMISSION_LABELS) as PermissionKey[]).map((key) => {
                      const effectiveValue = getEffectiveValue(perm, key);
                      const inherited = isInherited(perm, key);
                      const roleKey = `role${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof PermissionState;
                      const roleValue = perm[roleKey] as boolean;

                      return (
                        <td key={key} className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => togglePermission(perm.menuId, key)}
                            disabled={disabled}
                            className={`
                              inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 transition-all
                              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'}
                              ${
                                effectiveValue
                                  ? inherited
                                    ? 'border-green-300 bg-green-50 text-green-600 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400'
                                    : 'border-green-500 bg-green-100 text-green-700 ring-2 ring-green-500/30 dark:border-green-500 dark:bg-green-900/40 dark:text-green-300'
                                  : inherited
                                    ? 'border-gray-200 bg-gray-50 text-gray-400 dark:border-border-dark dark:bg-card-bg dark:text-gray-500'
                                    : 'border-red-400 bg-red-50 text-red-500 ring-2 ring-red-500/30 dark:border-red-600 dark:bg-red-900/20 dark:text-red-400'
                              }
                            `}
                            title={
                              inherited
                                ? `Inherited from role (${roleValue ? 'allowed' : 'denied'}) - Click to customize`
                                : `Custom: ${effectiveValue ? 'allowed' : 'denied'} - Click to change`
                            }
                          >
                            {effectiveValue ? (
                              <CheckIcon className="h-4 w-4" />
                            ) : (
                              <XMarkIcon className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      {customized && !disabled && (
                        <button
                          type="button"
                          onClick={() => resetToRoleDefaults(perm.menuId)}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-hover-bg dark:hover:text-gray-200"
                          title="Reset to role defaults"
                        >
                          <ArrowPathIcon className="h-3.5 w-3.5" />
                          Reset
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-input-bg dark:text-gray-400">
        <div className="font-medium">Legend:</div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded border-2 border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20">
            <CheckIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
          </span>
          <span>Allowed (inherited)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded border-2 border-green-500 bg-green-100 ring-2 ring-green-500/30 dark:border-green-500 dark:bg-green-900/40">
            <CheckIcon className="h-3 w-3 text-green-700 dark:text-green-300" />
          </span>
          <span>Allowed (custom)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded border-2 border-gray-200 bg-gray-50 dark:border-border-dark dark:bg-card-bg">
            <XMarkIcon className="h-3 w-3 text-gray-400 dark:text-gray-500" />
          </span>
          <span>Denied (inherited)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded border-2 border-red-400 bg-red-50 ring-2 ring-red-500/30 dark:border-red-600 dark:bg-red-900/20">
            <XMarkIcon className="h-3 w-3 text-red-500 dark:text-red-400" />
          </span>
          <span>Denied (custom)</span>
        </div>
      </div>

      {/* Instructions */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Click on any permission button to cycle through: <strong>Inherit</strong> → <strong>Allow</strong> → <strong>Deny</strong> → <strong>Inherit</strong>
      </p>
    </div>
  );
}

export default MenuPermissionsEditor;
