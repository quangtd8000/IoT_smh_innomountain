import React from 'react';
import { RefreshCw, LogOut, Menu, Sun, Moon, Bluetooth } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHome } from '../../context/HomeContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

export interface HeaderProps {
  title: string;
  onOpenCreateHome?: () => void;
  onOpenMenu?: () => void;
  onOpenBlePairing?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onOpenMenu, onOpenBlePairing }) => {
  const { user, logout } = useAuth();
  const { refreshHomeDetails, isRefreshing } = useHome();
  const { resolved, toggle } = useTheme();

  const iconButton =
    'p-2.5 rounded-md text-ink-2 hover:text-ink hover:bg-sunken transition-colors duration-150';

  return (
    <header className="h-16 flex-shrink-0 bg-surface border-b border-line px-3 sm:px-5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-1 min-w-0">
        <button
          onClick={onOpenMenu}
          aria-label="Mở menu"
          className={cn(iconButton, 'md:hidden')}
        >
          <Menu size={20} />
        </button>
        <h2 className="font-display text-lg font-semibold text-ink truncate">{title}</h2>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5">
        {onOpenBlePairing && (
          <button
            onClick={onOpenBlePairing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-accent bg-accent/10 hover:bg-accent/20 border border-accent/30 transition-colors"
            title="Cài đặt Wi-Fi và ghép nối ESP32 qua Bluetooth"
          >
            <Bluetooth size={15} />
            <span className="hidden sm:inline">Ghép nối Bluetooth</span>
          </button>
        )}
        <button
          onClick={toggle}
          className={iconButton}
          aria-label={resolved === 'dark' ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
          title={resolved === 'dark' ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
        >
          {resolved === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          onClick={() => refreshHomeDetails()}
          disabled={isRefreshing}
          className={cn(iconButton, 'disabled:opacity-45')}
          aria-label="Làm mới"
          title="Làm mới"
        >
          <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : undefined} />
        </button>

        <span className="hidden sm:block text-sm text-ink-2 truncate max-w-[140px] px-2">
          {user?.full_name || user?.username}
        </span>

        <button onClick={logout} className={iconButton} aria-label="Đăng xuất" title="Đăng xuất">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};
