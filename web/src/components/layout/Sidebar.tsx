import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  Radio,
  BarChart3,
  Settings,
  Home,
  PlusCircle,
  Zap,
  Activity,
  Shield,
} from 'lucide-react';
import { useHome } from '../../context/HomeContext';
import { cn } from '../../lib/utils';

export interface SidebarProps {
  currentPage: string;
  onSelectPage: (page: string) => void;
  onOpenCreateHome: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  onOpenCreateHome,
}) => {
  const { homes, activeHome, setActiveHome, devices } = useHome();

  const navItems = [
    { id: 'dashboard', label: 'Tổng Quan & Môi Trường', icon: LayoutDashboard, color: 'text-cyan-400' },
    { id: 'devices', label: 'Phòng & Thiết Bị', icon: Cpu, color: 'text-blue-400' },
    { id: 'ir', label: 'Điều Khiển IR & Điều Hòa', icon: Radio, color: 'text-purple-400' },
    { id: 'analytics', label: 'Biểu Đồ Phân Tích', icon: BarChart3, color: 'text-emerald-400' },
    { id: 'settings', label: 'Cài Đặt & Thành Viên', icon: Settings, color: 'text-amber-400' },
  ];

  const onlineDevices = devices.filter((d) => d.status === 'online').length;

  return (
    <aside className="w-64 bg-slate-950/80 border-r border-slate-800/80 flex flex-col h-screen select-none backdrop-blur-2xl">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
          <Zap size={22} className="fill-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-base text-slate-100 tracking-tight flex items-center gap-1">
            SmartHome <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">PRO</span>
          </h1>
          <p className="text-[11px] text-cyan-400 font-medium">IoT & AI Environment</p>
        </div>
      </div>

      {/* Home Switcher */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Không Gian Nhà
          </span>
          <button
            onClick={onOpenCreateHome}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold transition-colors"
          >
            <PlusCircle size={13} />
            <span>Thêm</span>
          </button>
        </div>

        {homes.length > 0 ? (
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {homes.map((h) => {
              const isActive = activeHome?.id === h.id;
              return (
                <button
                  key={h.id}
                  onClick={() => setActiveHome(h)}
                  className={cn(
                    'w-full text-left px-3.5 py-2.5 rounded-2xl text-xs flex items-center justify-between transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/25 to-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold shadow-sm'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Home size={14} className={isActive ? 'text-cyan-400' : 'text-slate-500'} />
                    <span className="truncate">{h.name}</span>
                  </div>
                  {isActive && <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic py-1">Chưa có ngôi nhà nào</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 px-3">
          Menu Điều Khiển
        </span>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 group',
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-600/30 border border-cyan-400/30 font-bold'
                  : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-100'
              )}
            >
              <Icon size={18} className={isActive ? 'text-white' : item.color} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Live System Status Pill */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-slate-300 font-semibold">{onlineDevices} Node Online</span>
        </div>
        <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded-full text-cyan-300 border border-slate-700">
          MQTT 1883
        </span>
      </div>
    </aside>
  );
};
