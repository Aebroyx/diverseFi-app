import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const baseInputClasses = "mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 dark:bg-gray-700 dark:text-white";
    const inputClasses = error
      ? `${baseInputClasses} border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600`
      : `${baseInputClasses} border-gray-300 focus:border-primary focus:ring-primary dark:border-gray-600`;

    return (
      <div className="space-y-1">
        <label 
          htmlFor={props.id} 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
        <input
          ref={ref}
          className={`${inputClasses} ${className}`}
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