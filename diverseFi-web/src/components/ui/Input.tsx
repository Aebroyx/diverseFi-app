import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-foreground"
        >
          {label}
          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
        <input
          ref={ref}
          className={`
            block w-full rounded-md border px-3 py-2 text-sm shadow-sm
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary
            disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
            dark:disabled:bg-input-bg/50 dark:disabled:text-gray-400
            ${error
              ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:bg-red-900/10 dark:text-red-400'
              : 'border-gray-300 bg-white text-gray-900 dark:border-border-dark dark:bg-input-bg dark:text-white'
            }
            ${className}
          `}
          {...props}
        />
        {(error || helperText) && (
          <p className={`text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

// Textarea component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-foreground"
        >
          {label}
          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
        <textarea
          ref={ref}
          className={`
            block w-full rounded-md border px-3 py-2 text-sm shadow-sm
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary
            disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
            dark:disabled:bg-input-bg/50 dark:disabled:text-gray-400
            ${error
              ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:bg-red-900/10 dark:text-red-400'
              : 'border-gray-300 bg-white text-gray-900 dark:border-border-dark dark:bg-input-bg dark:text-white'
            }
            ${className}
          `}
          rows={props.rows || 3}
          {...props}
        />
        {(error || helperText) && (
          <p className={`text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Toggle/Switch component
interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ label, description, checked, onChange, disabled }: ToggleProps) {
  return (
    <div className="flex items-start gap-4">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-50
          ${checked ? 'bg-primary' : 'bg-gray-200 dark:bg-input-bg'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
            transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
      <div className="flex-1">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </span>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
