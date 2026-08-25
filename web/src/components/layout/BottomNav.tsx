import React from 'react';
import { NAV_ITEMS } from './nav';
import { cn } from '../../lib/utils';

export interface BottomNavProps {
  currentPage: string;
  onSelectPage: (page: string) => void;
}

// Chỉ hiện trên điện thoại. Đặt dưới cùng vì đó là tầm với của ngón cái.
export const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onSelectPage }) => {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-line pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <li key={item.id} className="flex-1">
              <button
                onClick={() => onSelectPage(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'w-full min-h-14 flex flex-col items-center justify-center gap-0.5',
                  'transition-colors duration-150',
                  isActive ? 'text-ink' : 'text-ink-2'
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} aria-hidden="true" />
                <span className={cn('text-[11px]', isActive && 'font-medium')}>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
