'use client';

import { Fragment, useState, useCallback } from 'react';
import { Dialog, Transition, DialogTitle, RadioGroup } from '@headlessui/react';
import {
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { useValidateMenuImport, useBulkMenuImport, useDownloadMenuTemplate } from '@/hooks/useMenuImport';
import { parseMenusExcel } from '@/lib/menuExcelUtils';
import {
  MenuImportRow,
  ImportStep,
  ValidateMenuImportResponse,
  BulkMenuImportResponse,
} from '@/types/menuImport';
import MenuImportPreviewTable from './MenuImportPreviewTable';
import ImportValidationErrors from '@/components/common/ImportValidationErrors';
import toast from 'react-hot-toast';

interface MenuImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MenuImportModal({ isOpen, onClose }: MenuImportModalProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [parsedRows, setParsedRows] = useState<MenuImportRow[]>([]);
  const [validationResult, setValidationResult] = useState<ValidateMenuImportResponse | null>(null);
  const [importResult, setImportResult] = useState<BulkMenuImportResponse | null>(null);
  const [updateMode, setUpdateMode] = useState<'skip' | 'update'>('skip');
  const [isDragging, setIsDragging] = useState(false);

  const validateImport = useValidateMenuImport();
  const bulkImport = useBulkMenuImport();
  const downloadTemplate = useDownloadMenuTemplate();

  const resetModal = useCallback(() => {
    setStep('upload');
    setParsedRows([]);
    setValidationResult(null);
    setImportResult(null);
    setUpdateMode('skip');
    setIsDragging(false);
  }, []);

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    await downloadTemplate.mutateAsync();
  };

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please select an Excel file (.xlsx or .xls)');
      return;
    }

    try {
      const rows = await parseMenusExcel(file);
      if (rows.length === 0) {
        toast.error('No data rows found in the Excel file');
        return;
      }
      setParsedRows(rows);
      setStep('preview');
    } catch (error) {
      console.error('Excel parsing error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to parse Excel file');
      // Reset state on error to allow retry
      setParsedRows([]);
      setStep('upload');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Clear the input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleValidate = async () => {
    setStep('validating');
    try {
      const result = await validateImport.mutateAsync({ rows: parsedRows });
      setValidationResult(result);
      setStep('validation_result');
    } catch {
      setStep('preview');
    }
  };

  const handleImport = async () => {
    setStep('importing');
    try {
      const result = await bulkImport.mutateAsync({
        rows: parsedRows,
        update_mode: updateMode,
      });
      setImportResult(result);
      setStep('import_result');
    } catch {
      setStep('validation_result');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'upload':
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <SecondaryButton onClick={handleDownloadTemplate} loading={downloadTemplate.isPending}>
                <DocumentArrowDownIcon className="h-5 w-5" />
                Download Template
              </SecondaryButton>
            </div>

            <div
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 dark:border-border-dark'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <ArrowUpTrayIcon className="mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                Drag and drop your Excel file here, or
              </p>
              <label className="cursor-pointer text-sm font-medium text-primary hover:text-primary-dark">
                browse to select a file
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls"
                  onChange={handleFileInputChange}
                />
              </label>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                Supported formats: .xlsx, .xls
              </p>
            </div>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Found {parsedRows.length} row{parsedRows.length !== 1 ? 's' : ''} to import
              </p>
              <SecondaryButton onClick={() => setStep('upload')}>
                Upload Different File
              </SecondaryButton>
            </div>
            <MenuImportPreviewTable rows={parsedRows} />
          </div>
        );

      case 'validating':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <svg
              className="mb-4 h-12 w-12 animate-spin text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm text-gray-600 dark:text-gray-400">Validating import data...</p>
          </div>
        );

      case 'validation_result':
        if (!validationResult) return null;

        return (
          <div className="space-y-4">
            {validationResult.is_valid ? (
              <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-300">
                    All {validationResult.total_rows} rows are valid
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">Ready to import</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-300">
                      {validationResult.valid_rows} of {validationResult.total_rows} rows are valid
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      Please fix the errors and re-upload
                    </p>
                  </div>
                </div>
                <ImportValidationErrors errors={validationResult.errors} />
              </>
            )}

            {validationResult.is_valid && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  How should existing menus be handled?
                </label>
                <RadioGroup value={updateMode} onChange={setUpdateMode} className="space-y-2">
                  <RadioGroup.Option value="skip">
                    {({ checked }) => (
                      <div className={`cursor-pointer rounded-lg border p-3 ${checked ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'border-gray-200 dark:border-border-dark'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`h-4 w-4 rounded-full border-2 ${checked ? 'border-primary bg-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                            {checked && <div className="flex h-full items-center justify-center"><div className="h-1.5 w-1.5 rounded-full bg-white" /></div>}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Skip existing menus</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Only create new menus, skip rows where menu name already exists</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </RadioGroup.Option>
                  <RadioGroup.Option value="update">
                    {({ checked }) => (
                      <div className={`cursor-pointer rounded-lg border p-3 ${checked ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'border-gray-200 dark:border-border-dark'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`h-4 w-4 rounded-full border-2 ${checked ? 'border-primary bg-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                            {checked && <div className="flex h-full items-center justify-center"><div className="h-1.5 w-1.5 rounded-full bg-white" /></div>}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Update existing menus</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Create new menus and update existing ones (upsert)</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </RadioGroup.Option>
                </RadioGroup>
              </div>
            )}
          </div>
        );

      case 'importing':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <svg className="mb-4 h-12 w-12 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm text-gray-600 dark:text-gray-400">Importing menus...</p>
          </div>
        );

      case 'import_result':
        if (!importResult) return null;

        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                <p className="font-medium text-green-800 dark:text-green-300">Import completed successfully</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-card-bg">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{importResult.total_rows}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{importResult.created}</p>
                <p className="text-sm text-green-600 dark:text-green-400">Created</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-900/20">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{importResult.updated}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">Updated</p>
              </div>
              <div className="rounded-lg bg-yellow-50 p-4 text-center dark:bg-yellow-900/20">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{importResult.skipped}</p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Skipped</p>
              </div>
            </div>

            {importResult.failed > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                <p className="font-medium text-red-800 dark:text-red-300">
                  {importResult.failed} row{importResult.failed !== 1 ? 's' : ''} failed to import
                </p>
                <ul className="mt-2 space-y-1">
                  {importResult.results.filter((r) => r.status === 'error').map((r) => (
                    <li key={r.row_number} className="text-sm text-red-600 dark:text-red-400">
                      Row {r.row_number} ({r.username}): {r.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderFooter = () => {
    switch (step) {
      case 'upload':
        return <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>;
      case 'preview':
        return (
          <>
            <SecondaryButton onClick={() => setStep('upload')}>Back</SecondaryButton>
            <PrimaryButton onClick={handleValidate} loading={validateImport.isPending}>Validate Data</PrimaryButton>
          </>
        );
      case 'validating':
      case 'importing':
        return null;
      case 'validation_result':
        return (
          <>
            <SecondaryButton onClick={() => setStep('upload')}>Upload Different File</SecondaryButton>
            {validationResult?.is_valid && (
              <PrimaryButton onClick={handleImport} loading={bulkImport.isPending}>Import Menus</PrimaryButton>
            )}
          </>
        );
      case 'import_result':
        return <PrimaryButton onClick={handleClose}>Done</PrimaryButton>;
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    const titles: Record<ImportStep, string> = {
      upload: 'Import Menus',
      preview: 'Preview Import Data',
      validating: 'Validating...',
      validation_result: 'Validation Result',
      importing: 'Importing...',
      import_result: 'Import Complete',
    };
    return titles[step];
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl dark:bg-card-bg">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-border-dark">
                  <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-gray-100">{getStepTitle()}</DialogTitle>
                  <button onClick={handleClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-hover-bg">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="px-6 py-4">{renderStep()}</div>
                <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-border-dark">{renderFooter()}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
