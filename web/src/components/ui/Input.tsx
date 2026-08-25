import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helper, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const describedBy = error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full min-h-11 px-3 bg-surface border border-line rounded-md',
            'text-ink text-base placeholder:text-ink-2/60',
            'transition-colors duration-150 disabled:opacity-45',
            error && 'border-air-bad',
            className
          )}
          {...props}
        />
        {helper && !error && (
          <p id={`${inputId}-helper`} className="text-sm text-ink-2">
            {helper}
          </p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-air-bad">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
