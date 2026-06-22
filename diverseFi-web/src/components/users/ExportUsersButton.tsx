'use client';

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { SecondaryButton } from '@/components/ui/buttons';
import { useExportUsers } from '@/hooks/useUserImport';

interface ExportUsersButtonProps {
  className?: string;
}

export default function ExportUsersButton({ className }: ExportUsersButtonProps) {
  const exportUsers = useExportUsers();

  const handleExport = async () => {
    await exportUsers.mutateAsync();
    // File download is handled by the service
  };

  return (
    <SecondaryButton
      onClick={handleExport}
      loading={exportUsers.isPending}
      className={className}
    >
      <ArrowDownTrayIcon className="h-5 w-5" />
      Export
    </SecondaryButton>
  );
}
