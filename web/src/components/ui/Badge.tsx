import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
}

// Giữ nguyên 5 tên variant để các trang chưa thiết kế lại không vỡ,
// nhưng gom về đúng ngữ pháp màu: trung tính / đang bật / thang không khí.
export const Badge: React.FC<BadgeProps> = ({ className, variant = 'neutral', children, ...props }) => {
  const variants = {
    success: 'bg-air-good/12 text-air-good border-air-good/30',
    danger: 'bg-air-bad/12 text-air-bad border-air-bad/30',
    warning: 'bg-live/12 text-live border-live/35',
    info: 'bg-sunken text-ink-2 border-line',
    neutral: 'bg-sunken text-ink-2 border-line',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-medium border',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
