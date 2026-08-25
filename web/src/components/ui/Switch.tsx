import React from 'react';
import { cn } from '../../lib/utils';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
  'aria-label'?: string;
}

// Toggle cho hàng danh sách. Lưới công tắc lớn dùng phím rocker
// trong components/dashboard/SwitchPlate.tsx, không dùng cái này.
export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  className,
  size = 'md',
  ...props
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative inline-flex flex-shrink-0 items-center rounded-full',
        'transition-colors duration-150 disabled:opacity-45 disabled:cursor-not-allowed',
        checked ? 'bg-live' : 'bg-ink-2/35',
        size === 'sm' ? 'h-5 w-9 p-0.5' : 'h-6 w-11 p-0.5',
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none inline-block rounded-full bg-surface ring-1 ring-ink/10 transition-transform duration-150',
          size === 'sm' ? 'h-4 w-4' : 'h-5 w-5',
          checked ? (size === 'sm' ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0'
        )}
      />
    </button>
  );
};
