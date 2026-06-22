'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface FormCardProps {
  title: string;
  description?: string;
  backHref?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function FormCard({
  title,
  description,
  backHref,
  children,
  actions,
}: FormCardProps) {
  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        {backHref && (
          <Link
            href={backHref}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </Link>
        )}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>

      {/* Form Card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-border-dark dark:bg-card-bg">
        <div
          className="p-6 sm:p-8
          [&_label]:text-sm [&_label]:font-medium [&_label]:text-gray-700 dark:[&_label]:text-gray-300
          [&_input:not([type='checkbox']):not([type='radio'])]:mt-1
          [&_input:not([type='checkbox']):not([type='radio'])]:block
          [&_input:not([type='checkbox']):not([type='radio'])]:w-full
          [&_input:not([type='checkbox']):not([type='radio'])]:rounded-md
          [&_input:not([type='checkbox']):not([type='radio'])]:border
          [&_input:not([type='checkbox']):not([type='radio'])]:border-gray-300
          [&_input:not([type='checkbox']):not([type='radio'])]:bg-white
          [&_input:not([type='checkbox']):not([type='radio'])]:px-3
          [&_input:not([type='checkbox']):not([type='radio'])]:py-2
          [&_input:not([type='checkbox']):not([type='radio'])]:text-gray-900
          [&_input:not([type='checkbox']):not([type='radio'])]:shadow-sm
          [&_input:not([type='checkbox']):not([type='radio'])]:placeholder:text-gray-400
          [&_input:not([type='checkbox']):not([type='radio'])]:focus:outline-primary
          [&_input:not([type='checkbox']):not([type='radio'])]:focus:ring-1
          [&_input:not([type='checkbox']):not([type='radio'])]:focus:ring-primary/30
          dark:[&_input:not([type='checkbox']):not([type='radio'])]:border-border-dark
          dark:[&_input:not([type='checkbox']):not([type='radio'])]:bg-input-bg
          dark:[&_input:not([type='checkbox']):not([type='radio'])]:text-white
          dark:[&_input:not([type='checkbox']):not([type='radio'])]:placeholder:text-gray-500

          [&_textarea]:mt-1 [&_textarea]:block [&_textarea]:w-full [&_textarea]:rounded-md
          [&_textarea]:border [&_textarea]:border-gray-300 [&_textarea]:bg-white
          [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-gray-900 [&_textarea]:shadow-sm
          [&_textarea]:placeholder:text-gray-400 [&_textarea]:focus:outline-primary [&_textarea]:focus:ring-1 [&_textarea]:focus:ring-primary/30
          dark:[&_textarea]:border-border-dark dark:[&_textarea]:bg-input-bg dark:[&_textarea]:text-white dark:[&_textarea]:placeholder:text-gray-500

          [&_select]:mt-1 [&_select]:block [&_select]:w-full [&_select]:rounded-md
          [&_select]:border [&_select]:border-gray-300 [&_select]:bg-white
          [&_select]:px-3 [&_select]:py-2 [&_select]:text-gray-900 [&_select]:shadow-sm
          [&_select]:focus:outline-primary [&_select]:focus:ring-1 [&_select]:focus:ring-primary/30
          dark:[&_select]:border-border-dark dark:[&_select]:bg-input-bg dark:[&_select]:text-gray-100"
        >
          {children}
        </div>

        {/* Actions Footer */}
        {actions && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-border-dark dark:bg-input-bg sm:px-8">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <div className="space-y-6">
      {(title || description) && (
        <div className="border-b border-gray-200 pb-4 dark:border-border-dark">
          {title && (
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-6">{children}</div>
    </div>
  );
}

interface FormRowProps {
  children: ReactNode;
  columns?: 1 | 2;
}

export function FormRow({ children, columns = 1 }: FormRowProps) {
  return (
    <div className={`grid gap-6 ${columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
      {children}
    </div>
  );
}

interface FormActionsProps {
  children: ReactNode;
}

export function FormActions({ children }: FormActionsProps) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      {children}
    </div>
  );
}
