import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { cn } from '@/lib/utils';

export interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  variant?: 'primary' | 'danger';
}

const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  (
    {
      children,
      loading = false,
      fullWidth = false,
      variant = 'primary',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        variant={variant === 'danger' ? 'destructive' : 'default'}
        className={cn(
          'h-10 px-4 font-semibold shadow-sm',
          variant === 'danger' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
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

PrimaryButton.displayName = 'PrimaryButton';

export default PrimaryButton;
