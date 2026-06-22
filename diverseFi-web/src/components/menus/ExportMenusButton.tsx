'use client';

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { SecondaryButton } from '@/components/ui/buttons';
import { useExportMenus } from '@/hooks/useMenuImport';

interface ExportMenusButtonProps {
  className?: string;
}

export default function ExportMenusButton({ className }: ExportMenusButtonProps) {
  const exportMenus = useExportMenus();

  const handleExport = async () => {
    await exportMenus.mutateAsync();
    // File download is handled by the service
  };

  return (
    <SecondaryButton
      onClick={handleExport}
      loading={exportMenus.isPending}
      className={className}
    >
      <ArrowDownTrayIcon className="h-5 w-5" />
      Export
    </SecondaryButton>
  );
}
