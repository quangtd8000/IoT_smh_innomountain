import React from 'react';
import { Plus, X, Check } from 'lucide-react';
import { useHome } from '../../context/HomeContext';
import { NAV_ITEMS } from './nav';
import { cn } from '../../lib/utils';

export interface SidebarProps {
  currentPage: string;
  onSelectPage: (page: string) => void;
  onOpenCreateHome: () => void;
  /** Trên điện thoại sidebar là ngăn kéo trượt ra */
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  onOpenCreateHome,
  isOpen = false,
  onClose,
}) => {
  const { homes, activeHome, setActiveHome, devices } = useHome();

  const onlineDevices = devices.filter((d) => d.status === 'online').length;

  const handleSelect = (id: string) => {
    onSelectPage(id);
    onClose?.();
  };

  return (
    <>
      {/* Nền mờ của ngăn kéo, chỉ trên màn hình nhỏ */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-ink/40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'w-60 bg-surface border-r border-line flex flex-col select-none',
          'fixed inset-y-0 left-0 z-50 transition-transform duration-200',
          'md:static md:z-auto md:translate-x-0 md:transition-none',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Tên ngôi nhà đứng thay cho logo — đây là nhà của họ, không phải sản phẩm */}
        <div className="h-16 px-4 border-b border-line flex items-center justify-between gap-2">
          <h1 className="font-display text-lg font-semibold text-ink truncate">
            {activeHome?.name ?? "SmartHome"}
          </h1>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Đóng menu"
              className="md:hidden p-2 -mr-2 text-ink-2 hover:text-ink rounded-md"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Chọn nhà */}
        {homes.length > 1 && (
          <div className="px-3 py-3 border-b border-line">
            <ul className="space-y-0.5">
              {homes.map((h) => {
                const isActive = activeHome?.id === h.id;
                return (
                  <li key={h.id}>
                    <button
                      onClick={() => setActiveHome(h)}
                      className={cn(
                        'w-full min-h-9 px-2.5 rounded-md text-sm flex items-center justify-between gap-2',
                        'transition-colors duration-150',
                        isActive ? 'text-ink font-medium' : 'text-ink-2 hover:bg-sunken'
                      )}
                    >
                      <span className="truncate">{h.name}</span>
                      {isActive && <Check size={15} aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Điều hướng */}
        <nav aria-label="Điều hướng chính" className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleSelect(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'w-full min-h-11 px-2.5 rounded-md text-sm flex items-center gap-3',
                      'transition-colors duration-150',
                      isActive
                        ? 'bg-sunken text-ink font-medium'
                        : 'text-ink-2 hover:bg-sunken hover:text-ink'
                    )}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.25 : 1.75} aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 border-t border-line space-y-2">
          <button
            onClick={onOpenCreateHome}
            className="w-full min-h-9 px-2.5 rounded-md text-sm text-ink-2 hover:bg-sunken hover:text-ink flex items-center gap-2 transition-colors duration-150"
          >
            <Plus size={16} aria-hidden="true" />
            <span>Thêm nhà</span>
          </button>
          <p className="px-2.5 text-sm text-ink-2 tnum">
            {onlineDevices}/{devices.length} thiết bị trực tuyến
          </p>
        </div>
      </aside>
    </>
  );
};
