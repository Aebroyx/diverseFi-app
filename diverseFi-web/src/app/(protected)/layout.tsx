'use client';

import { Navigation } from '@/components/Navigation';
import { RequireMenuRead } from '@/components/auth/RequireMenuRead';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Navigation>
      <RequireMenuRead>
        {children}
      </RequireMenuRead>
    </Navigation>
  );
}
