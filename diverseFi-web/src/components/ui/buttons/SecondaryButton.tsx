import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { cn } from '@/lib/utils';

export interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  variant?: 'default' | 'danger';
}

const SecondaryButton = React.forwardRef<HTMLButtonElement, SecondaryButtonProps>(
  (
    {
      children,
      loading = false,
      fullWidth = false,
      variant = 'default',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        variant="outline"
        className={cn(
          'h-10 px-4 font-semibold shadow-sm',
          variant === 'danger' &&
            'border-destructive/50 text-destructive hover:bg-destructive/10 dark:border-destructive/50 dark:hover:bg-destructive/20',
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </Button>
    );
  }
);

SecondaryButton.displayName = 'SecondaryButton';

export default SecondaryButton;
