import { InputHTMLAttributes, forwardRef } from 'react';
import { Input as ShadcnInput } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Textarea as ShadcnTextarea } from '@/components/ui/shadcn/textarea';
import { Switch } from '@/components/ui/shadcn/switch';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || props.name || label.replace(/\s+/g, '-').toLowerCase();

    return (
      <div className="space-y-2">
        <Label htmlFor={inputId} className="text-sm font-medium">
          {label}
          {props.required && <span className="ml-1 text-destructive">*</span>}
        </Label>
        <ShadcnInput
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={cn('h-10', className)}
          {...props}
        />
        {(error || helperText) && (
          <p className={cn('text-sm', error ? 'text-destructive' : 'text-muted-foreground')}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const textareaId = id || props.name || label.replace(/\s+/g, '-').toLowerCase();

    return (
      <div className="space-y-2">
        <Label htmlFor={textareaId} className="text-sm font-medium">
          {label}
          {props.required && <span className="ml-1 text-destructive">*</span>}
        </Label>
        <ShadcnTextarea
          ref={ref}
          id={textareaId}
          aria-invalid={!!error}
          className={cn('min-h-[80px]', className)}
          rows={props.rows || 3}
          {...props}
        />
        {(error || helperText) && (
          <p className={cn('text-sm', error ? 'text-destructive' : 'text-muted-foreground')}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ label, description, checked, onChange, disabled }: ToggleProps) {
  const toggleId = label.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className="flex items-start gap-4">
      <Switch
        id={toggleId}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
      <div className="flex-1 space-y-1">
        <Label htmlFor={toggleId} className="text-sm font-medium">
          {label}
        </Label>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
