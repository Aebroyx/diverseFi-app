'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useGetUserMenus } from '@/hooks/useMenu';
import type { MenuWithPermissions } from '@/services/menuService';

function hasReadAccessForPath(menus: MenuWithPermissions[], pathname: string): boolean {
  const normalizedPath = pathname === '/' ? '/dashboard' : pathname;

  const matches = (menu: MenuWithPermissions): boolean => {
    if (!menu?.path) return false;

    // Exact match or sub-route match (e.g. /users-management/123)
    const isMatch = normalizedPath === menu.path || normalizedPath.startsWith(menu.path + '/');
    if (isMatch) return !!menu.permissions?.can_read;

    return false;
  };

  const walk = (items: MenuWithPermissions[]): boolean => {
    for (const item of items) {
      if (matches(item)) return true;
      if (item.children?.length && walk(item.children)) return true;
    }
    return false;
  };

  return walk(menus);
}

export function RequireMenuRead({
  children,
  fallbackTitle = 'Access denied',
  fallbackDescription = 'You don’t have permission to view this page.',
}: {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}) {
  const pathname = usePathname();
  const { data: userMenus, isLoading, error } = useGetUserMenus();

  const allowed = useMemo(() => {
    if (!userMenus) return false;
    return hasReadAccessForPath(userMenus, pathname);
  }, [userMenus, pathname]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600 dark:border-border-dark dark:bg-card-bg/50 dark:text-gray-400">
        Checking permissions…
      </div>
    );
  }

  // If we can’t fetch menus, don’t silently allow access.
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        Failed to verify permissions. Please try again.
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
        <div className="text-base font-semibold text-amber-900 dark:text-amber-200">{fallbackTitle}</div>
        <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">{fallbackDescription}</p>
        <div className="mt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

