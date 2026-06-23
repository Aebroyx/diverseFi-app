'use client';

import { Navigation } from '@/components/Navigation';
import { RequireMenuRead } from '@/components/auth/RequireMenuRead';
import { PermissionProvider } from '@/contexts/PermissionContext';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PermissionProvider>
      <Navigation>
        <RequireMenuRead>
          {children}
        </RequireMenuRead>
      </Navigation>
    </PermissionProvider>
  );
}
