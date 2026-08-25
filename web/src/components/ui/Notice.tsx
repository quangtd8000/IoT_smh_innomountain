import React from 'react';
import { cn } from '../../lib/utils';

export interface NoticeProps {
  tone?: 'error' | 'success' | 'info';
  children: React.ReactNode;
  className?: string;
}

export const Notice: React.FC<NoticeProps> = ({ tone = 'info', children, className }) => {
  const tones = {
    error: 'bg-air-bad/10 border-air-bad/30 text-air-bad',
    success: 'bg-air-good/10 border-air-good/30 text-air-good',
    info: 'bg-sunken border-line text-ink-2',
  };

  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('px-3 py-2.5 rounded-md border text-sm', tones[tone], className)}
    >
      {children}
    </p>
  );
};
