import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/shadcn/badge';
import { cn } from '@/lib/utils';

export type PrimaryBadgeVariant =
  | 'success'
  | 'danger'
  | 'info'
  | 'warning'
  | 'neutral';

export interface PrimaryBadgeProps {
  variant: PrimaryBadgeVariant;
  children: React.ReactNode;
  icon?: 'auto' | 'check' | 'x' | 'none';
  className?: string;
}

const variantStyles: Record<PrimaryBadgeVariant, string> = {
  success: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20',
  danger: 'bg-destructive/15 text-destructive border-destructive/20',
  info: 'bg-primary/15 text-primary border-primary/20',
  warning: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/20',
  neutral: 'bg-muted text-muted-foreground border-border',
};

export default function PrimaryBadge({
  variant,
  children,
  icon = 'auto',
  className = '',
}: PrimaryBadgeProps) {
  const shouldShowIcon = icon !== 'none';
  const IconComponent =
    icon === 'check'
      ? CheckCircle
      : icon === 'x'
        ? XCircle
        : icon === 'auto' && variant === 'success'
          ? CheckCircle
          : icon === 'auto' && variant === 'danger'
            ? XCircle
            : null;

  return (
    <Badge
      variant="outline"
      className={cn('rounded-full px-2.5 py-0.5 font-medium', variantStyles[variant], className)}
    >
      {shouldShowIcon && IconComponent && <IconComponent className="h-3.5 w-3.5" />}
      {children}
    </Badge>
  );
}
