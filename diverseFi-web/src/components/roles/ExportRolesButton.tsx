'use client';

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { SecondaryButton } from '@/components/ui/buttons';
import { useExportRoles } from '@/hooks/useRoleImport';

interface ExportRolesButtonProps {
  className?: string;
}

export default function ExportRolesButton({ className }: ExportRolesButtonProps) {
  const exportRoles = useExportRoles();

  const handleExport = async () => {
    await exportRoles.mutateAsync();
    // File download is handled by the service
  };

  return (
    <SecondaryButton
      onClick={handleExport}
      loading={exportRoles.isPending}
      className={className}
    >
      <ArrowDownTrayIcon className="h-5 w-5" />
      Export
    </SecondaryButton>
  );
}
