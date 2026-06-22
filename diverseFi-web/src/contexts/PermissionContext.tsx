'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useGetUserMenus } from '@/hooks/useMenu';
import { MenuWithPermissions, EffectivePermissions } from '@/services/menuService';

interface PermissionContextType {
  getMenuPermissions: (path: string) => EffectivePermissions | null;
  isLoading: boolean;
  permissionsMap: Map<string, EffectivePermissions>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

interface PermissionProviderProps {
  children: React.ReactNode;
}

/**
 * Recursively flattens menu tree structure into a path -> permissions map
 */
function flattenMenus(menus: MenuWithPermissions[], map: Map<string, EffectivePermissions> = new Map()): Map<string, EffectivePermissions> {
  for (const menu of menus) {
    // Store permissions for this menu's path
    map.set(menu.path, menu.permissions);

    // Recursively process children
    if (menu.children && menu.children.length > 0) {
      flattenMenus(menu.children, map);
    }
  }

  return map;
}

export function PermissionProvider({ children }: PermissionProviderProps) {
  // Fetch user menus with permissions
  const { data: userMenus, isLoading } = useGetUserMenus();

  // Build permission map from menu tree (memoized for performance)
  const permissionsMap = useMemo(() => {
    if (!userMenus || userMenus.length === 0) {
      return new Map<string, EffectivePermissions>();
    }

    return flattenMenus(userMenus);
  }, [userMenus]);

  /**
   * Get permissions for a specific menu path
   * @param path - The menu path (e.g., '/users-management')
   * @returns EffectivePermissions if found, null otherwise
   */
  const getMenuPermissions = (path: string): EffectivePermissions | null => {
    return permissionsMap.get(path) || null;
  };

  const value = {
    getMenuPermissions,
    isLoading,
    permissionsMap,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

/**
 * Hook to access the permission context
 * Must be used within PermissionProvider
 */
export function usePermissionContext() {
  const context = useContext(PermissionContext);

  if (context === undefined) {
    throw new Error('usePermissionContext must be used within a PermissionProvider');
  }

  return context;
}
