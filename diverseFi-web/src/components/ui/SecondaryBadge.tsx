import React from 'react';
import { Badge } from '@/components/ui/shadcn/badge';
import { cn } from '@/lib/utils';

export type SecondaryBadgeVariant =
  | 'green'
  | 'blue'
  | 'red'
  | 'purple'
  | 'orange'
  | 'gray';

export interface SecondaryBadgeProps {
  variant: SecondaryBadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<SecondaryBadgeVariant, string> = {
  green: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20',
  blue: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20',
  red: 'bg-destructive/15 text-destructive border-destructive/20',
  purple: 'bg-primary/15 text-primary border-primary/20',
  orange: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/20',
  gray: 'bg-muted text-muted-foreground border-border',
};

export default function SecondaryBadge({
  variant,
  children,
  className = '',
}: SecondaryBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', variantStyles[variant], className)}
    >
      {children}
    </Badge>
  );
}
