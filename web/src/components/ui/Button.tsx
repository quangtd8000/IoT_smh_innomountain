import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  ...props
}) => {
  const variants = {
    primary: 'bg-ink text-ground hover:bg-ink/85',
    secondary: 'bg-surface text-ink border border-line hover:bg-sunken',
    outline: 'bg-transparent text-ink border border-line hover:bg-sunken',
    danger: 'bg-air-bad text-white hover:bg-air-bad/85',
    ghost: 'bg-transparent text-ink-2 hover:bg-sunken hover:text-ink',
  };

  // Cao tối thiểu 44px ở cỡ md/lg — vừa đầu ngón tay trên điện thoại
  const sizes = {
    sm: 'min-h-9 px-3 text-sm rounded-md font-medium',
    md: 'min-h-11 px-4 text-sm rounded-md font-medium',
    lg: 'min-h-12 px-6 text-base rounded-lg font-medium',
    icon: 'h-11 w-11 rounded-md',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-colors duration-150',
        'disabled:opacity-45 disabled:pointer-events-none select-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
};
