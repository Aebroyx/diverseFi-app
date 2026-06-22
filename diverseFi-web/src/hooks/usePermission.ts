'use client';

import { usePathname } from 'next/navigation';
import { usePermissionContext } from '@/contexts/PermissionContext';
import { EffectivePermissions } from '@/services/menuService';

interface UsePermissionReturn extends EffectivePermissions {
  isLoading: boolean;
}

/**
 * Hook to check permissions for a specific page path
 *
 * @param path - Optional menu path. If not provided, uses current pathname from Next.js router
 * @returns Permission flags (canRead, canWrite, canUpdate, canDelete) and loading state
 *
 * @example
 * ```tsx
 * // Use current page path
 * const { canDelete, isLoading } = usePermission();
 *
 * // Use specific path
 * const { canWrite } = usePermission('/users-management');
 * ```
 */
export function usePermission(path?: string): UsePermissionReturn {
  const pathname = usePathname();
  const { getMenuPermissions, isLoading } = usePermissionContext();

  // Use provided path or fall back to current pathname
  const targetPath = path || pathname;

  // Get permissions for the target path
  const permissions = getMenuPermissions(targetPath);

  // If permissions not found, default to no access (safe default)
  const defaultPermissions: EffectivePermissions = {
    can_read: false,
    can_write: false,
    can_update: false,
    can_delete: false,
  };

  return {
    ...(permissions || defaultPermissions),
    isLoading,
  };
}
