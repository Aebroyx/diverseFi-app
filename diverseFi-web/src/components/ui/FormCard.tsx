'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/shadcn/card';
import { cn } from '@/lib/utils';

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
      <div className="mb-8">
        {backHref && (
          <Link
            href={backHref}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        )}
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-6 sm:p-8">{children}</CardContent>
        {actions && (
          <CardFooter className="border-t bg-muted/50 px-6 py-4 sm:px-8">
            {actions}
          </CardFooter>
        )}
      </Card>
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
        <div className="border-b border-border pb-4">
          {title && <h3 className="text-base font-semibold text-foreground">{title}</h3>}
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
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
    <div className={cn('grid gap-6', columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1')}>
      {children}
    </div>
  );
}

interface FormActionsProps {
  children: ReactNode;
}

export function FormActions({ children }: FormActionsProps) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{children}</div>
  );
}
