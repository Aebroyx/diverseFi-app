import React from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export type PrimaryBadgeVariant =
  | 'success'    // Green - for Active states
  | 'danger'     // Red - for Inactive states
  | 'info'       // Blue - for Default/Info states
  | 'warning'    // Orange - for Warning states
  | 'neutral';   // Gray - for neutral states

export interface PrimaryBadgeProps {
  /**
   * The visual variant/color of the badge
   */
  variant: PrimaryBadgeVariant;

  /**
   * The text content to display
   */
  children: React.ReactNode;

  /**
   * Whether to show an icon
   * - 'auto': Shows CheckCircleIcon for success, XCircleIcon for danger, none for others
   * - 'check': Always shows CheckCircleIcon
   * - 'x': Always shows XCircleIcon
   * - 'none': Never shows an icon
   * @default 'auto'
   */
  icon?: 'auto' | 'check' | 'x' | 'none';

  /**
   * Additional CSS classes
   */
  className?: string;
}

const variantStyles: Record<PrimaryBadgeVariant, string> = {
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  warning: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function PrimaryBadge({
  variant,
  children,
  icon = 'auto',
  className = ''
}: PrimaryBadgeProps) {
  // Determine which icon to show
  const shouldShowIcon = icon !== 'none';
  const IconComponent =
    icon === 'check' ? CheckCircleIcon :
    icon === 'x' ? XCircleIcon :
    icon === 'auto' && variant === 'success' ? CheckCircleIcon :
    icon === 'auto' && variant === 'danger' ? XCircleIcon :
    null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {shouldShowIcon && IconComponent && <IconComponent className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}
