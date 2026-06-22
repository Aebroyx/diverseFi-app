'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { MenuResponse, RoleMenuResponse } from '@/services/menuService';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export interface RoleMenuPermission {
  menuId: number;
  menuName: string;
  menuPath: string;
  canRead: boolean;
  canWrite: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  isSelected: boolean;
}

interface RoleMenuPermissionsEditorProps {
  allMenus: MenuResponse[];
  roleMenus?: RoleMenuResponse[];
  isLoading?: boolean;
  onChange: (permissions: RoleMenuPermission[]) => void;
  disabled?: boolean;
}

type PermissionKey = 'canRead' | 'canWrite' | 'canUpdate' | 'canDelete';

// Flatten menu tree for display (outside component to avoid useEffect dependency)
const flattenMenus = (
  menus: MenuResponse[],
  roleMenus: RoleMenuResponse[],
  level = 0
): RoleMenuPermission[] => {
  let result: RoleMenuPermission[] = [];
  menus.forEach((menu) => {
    // Find existing role menu if editing
    const existingRoleMenu = roleMenus.find((rm) => rm.menu_id === menu.id);

    result.push({
      menuId: menu.id,
      menuName: '  '.repeat(level) + (level > 0 ? '└─ ' : '') + menu.name,
      menuPath: menu.path,
      canRead: existingRoleMenu?.can_read ?? false,
      canWrite: existingRoleMenu?.can_write ?? false,
      canUpdate: existingRoleMenu?.can_update ?? false,
      canDelete: existingRoleMenu?.can_delete ?? false,
      isSelected: !!existingRoleMenu,
    });

    if (menu.children && menu.children.length > 0) {
      result = result.concat(flattenMenus(menu.children, roleMenus, level + 1));
    }
  });
  return result;
};

export function RoleMenuPermissionsEditor({
  allMenus,
  roleMenus = [],
  isLoading = false,
  onChange,
  disabled = false,
}: RoleMenuPermissionsEditorProps) {
  const [permissions, setPermissions] = useState<RoleMenuPermission[]>([]);
  const isInitializedRef = useRef(false);

  // Create stable keys for comparison
  const allMenusKey = allMenus.map((m) => m.id).join(',');
  const roleMenusKey = roleMenus.map((rm) => `${rm.menu_id}-${rm.can_read}-${rm.can_write}-${rm.can_update}-${rm.can_delete}`).join(',');
  const prevKeysRef = useRef({ allMenusKey: '', roleMenusKey: '' });

  // Initialize permissions when props change
  useEffect(() => {
    const keysChanged =
      prevKeysRef.current.allMenusKey !== allMenusKey ||
      prevKeysRef.current.roleMenusKey !== roleMenusKey;

    if (keysChanged || !isInitializedRef.current) {
      prevKeysRef.current = { allMenusKey, roleMenusKey };
      const newPermissions = flattenMenus(allMenus, roleMenus);
      setPermissions(newPermissions);
      isInitializedRef.current = true;
    }
  }, [allMenusKey, roleMenusKey, allMenus, roleMenus]);

  // Toggle permission for a specific menu
  const togglePermission = (menuId: number, key: PermissionKey) => {
    if (disabled) return;

    setPermissions((prev) => {
      const updated = prev.map((p) => {
        if (p.menuId === menuId) {
          const newValue = !p[key];
          return {
            ...p,
            [key]: newValue,
            // If turning on any permission, also select the menu
            isSelected: newValue || p.canRead || p.canWrite || p.canUpdate || p.canDelete,
          };
        }
        return p;
      });

      // Notify parent of changes
      onChange(updated);
      return updated;
    });
  };

  // Toggle menu selection
  const toggleMenuSelection = (menuId: number) => {
    if (disabled) return;

    setPermissions((prev) => {
      const updated = prev.map((p) => {
        if (p.menuId === menuId) {
          const newIsSelected = !p.isSelected;
          return {
            ...p,
            isSelected: newIsSelected,
            // If deselecting, clear all permissions
            canRead: newIsSelected ? p.canRead : false,
            canWrite: newIsSelected ? p.canWrite : false,
            canUpdate: newIsSelected ? p.canUpdate : false,
            canDelete: newIsSelected ? p.canDelete : false,
          };
        }
        return p;
      });

      // Notify parent of changes
      onChange(updated);
      return updated;
    });
  };

  // Select all menus
  const selectAll = () => {
    if (disabled) return;

    setPermissions((prev) => {
      const updated = prev.map((p) => ({
        ...p,
        isSelected: true,
        canRead: true,
      }));
      onChange(updated);
      return updated;
    });
  };

  // Deselect all menus
  const deselectAll = () => {
    if (disabled) return;

    setPermissions((prev) => {
      const updated = prev.map((p) => ({
        ...p,
        isSelected: false,
        canRead: false,
        canWrite: false,
        canUpdate: false,
        canDelete: false,
      }));
      onChange(updated);
      return updated;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton height={40} />
        <Skeleton height={200} />
      </div>
    );
  }

  const selectedCount = permissions.filter((p) => p.isSelected).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {selectedCount} of {permissions.length} menus selected
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            disabled={disabled}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-dark dark:bg-card-bg dark:text-gray-300 dark:hover:bg-hover-bg"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={deselectAll}
            disabled={disabled}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-dark dark:bg-card-bg dark:text-gray-300 dark:hover:bg-hover-bg"
          >
            Deselect All
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-border-dark dark:bg-card-bg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-transparent">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Menu
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Path
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Select
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Read
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Write
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Update
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Delete
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-card-bg">
              {permissions.map((perm) => (
                <tr
                  key={perm.menuId}
                  className={`transition-colors ${
                    perm.isSelected
                      ? 'bg-blue-50 dark:bg-hover-bg'
                      : 'hover:bg-gray-50/5 dark:hover:bg-hover-bg/50'
                  }`}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {perm.menuName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                    {perm.menuPath}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggleMenuSelection(perm.menuId)}
                      disabled={disabled}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded transition-colors ${
                        perm.isSelected
                          ? 'bg-primary text-white hover:bg-primary-dark'
                          : 'bg-gray-200 text-gray-400 hover:bg-gray-300 dark:bg-input-bg dark:text-gray-500 dark:hover:bg-hover-bg'
                      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      title={perm.isSelected ? 'Deselect menu' : 'Select menu'}
                    >
                      {perm.isSelected ? (
                        <CheckIcon className="h-4 w-4" />
                      ) : (
                        <XMarkIcon className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => togglePermission(perm.menuId, 'canRead')}
                      disabled={disabled || !perm.isSelected}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded transition-colors ${
                        perm.canRead
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-200 text-gray-400 hover:bg-gray-300 dark:bg-input-bg dark:text-gray-500 dark:hover:bg-hover-bg'
                      } ${disabled || !perm.isSelected ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      title={perm.canRead ? 'Revoke read permission' : 'Grant read permission'}
                    >
                      {perm.canRead ? <CheckIcon className="h-4 w-4" /> : <XMarkIcon className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => togglePermission(perm.menuId, 'canWrite')}
                      disabled={disabled || !perm.isSelected}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded transition-colors ${
                        perm.canWrite
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-200 text-gray-400 hover:bg-gray-300 dark:bg-input-bg dark:text-gray-500 dark:hover:bg-hover-bg'
                      } ${disabled || !perm.isSelected ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      title={perm.canWrite ? 'Revoke write permission' : 'Grant write permission'}
                    >
                      {perm.canWrite ? <CheckIcon className="h-4 w-4" /> : <XMarkIcon className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => togglePermission(perm.menuId, 'canUpdate')}
                      disabled={disabled || !perm.isSelected}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded transition-colors ${
                        perm.canUpdate
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-200 text-gray-400 hover:bg-gray-300 dark:bg-input-bg dark:text-gray-500 dark:hover:bg-hover-bg'
                      } ${disabled || !perm.isSelected ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      title={perm.canUpdate ? 'Revoke update permission' : 'Grant update permission'}
                    >
                      {perm.canUpdate ? <CheckIcon className="h-4 w-4" /> : <XMarkIcon className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => togglePermission(perm.menuId, 'canDelete')}
                      disabled={disabled || !perm.isSelected}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded transition-colors ${
                        perm.canDelete
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-200 text-gray-400 hover:bg-gray-300 dark:bg-input-bg dark:text-gray-500 dark:hover:bg-hover-bg'
                      } ${disabled || !perm.isSelected ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      title={perm.canDelete ? 'Revoke delete permission' : 'Grant delete permission'}
                    >
                      {perm.canDelete ? <CheckIcon className="h-4 w-4" /> : <XMarkIcon className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {permissions.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center dark:border-border-dark dark:bg-card-bg">
          <p className="text-sm text-gray-500 dark:text-gray-400">No menus available</p>
        </div>
      )}
    </div>
  );
}
