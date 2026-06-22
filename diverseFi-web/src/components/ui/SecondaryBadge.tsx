import React from 'react';

export type SecondaryBadgeVariant =
  | 'green'    // CREATE actions
  | 'blue'     // UPDATE actions
  | 'red'      // DELETE actions
  | 'purple'   // LOGIN_SUCCESS actions
  | 'orange'   // LOGIN_FAILED, warnings
  | 'gray';    // LOGOUT, neutral actions

export interface SecondaryBadgeProps {
  /**
   * The visual variant/color of the badge
   */
  variant: SecondaryBadgeVariant;

  /**
   * The text content to display
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

const variantStyles: Record<SecondaryBadgeVariant, string> = {
  green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export default function SecondaryBadge({
  variant,
  children,
  className = ''
}: SecondaryBadgeProps) {
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
