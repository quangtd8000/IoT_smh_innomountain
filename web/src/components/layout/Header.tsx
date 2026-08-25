import React, { useState } from 'react';
import {
  RefreshCw,
  LogOut,
  User as UserIcon,
  Shield,
  Server,
  Activity,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHome } from '../../context/HomeContext';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { getBaseUrl, setBaseUrl } from '../../api/client';
import { cn } from '../../lib/utils';

export interface HeaderProps {
  title: string;
  onOpenCreateHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user, logout } = useAuth();
  const { activeHome, userRole, refreshHomeDetails, isRefreshing } = useHome();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [apiUrl, setApiUrl] = useState(getBaseUrl());

  const handleSaveApiUrl = () => {
    setBaseUrl(apiUrl);
    setShowConfigModal(false);
    window.location.reload();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'warning';
      case 'admin':
        return 'info';
      default:
        return 'neutral';
    }
  };

  return (
    <>
      <header className="h-16 bg-slate-950/70 border-b border-slate-800/80 backdrop-blur-2xl px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Page Title & Active Home Name */}
        <div className="flex items-center gap-3">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-100 tracking-tight">{title}</h2>
          {activeHome && (
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-800 pl-3">
              <span className="text-xs text-slate-400 font-medium">{activeHome.name}</span>
              <Badge variant={getRoleBadgeVariant(userRole)} className="text-[9px] uppercase font-bold tracking-wider rounded-lg">
                <Shield size={10} />
                {userRole}
              </Badge>
            </div>
          )}
        </div>

        {/* Action Controls & User info */}
        <div className="flex items-center gap-2.5">
          {/* API Server Endpoint Config */}
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 text-xs font-mono"
            title="Cấu hình địa chỉ máy chủ API"
          >
            <Server size={14} className="text-cyan-400" />
            <span className="hidden md:inline text-[11px] text-slate-300">
              {apiUrl.replace('http://', '').replace('/api', '')}
            </span>
          </button>

          {/* Refresh button */}
          <button
            onClick={() => refreshHomeDetails()}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
            title="Làm mới toàn bộ trạng thái"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-cyan-400' : ''} />
          </button>

          {/* User Profile Info */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-500/20">
              {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-100 leading-tight">
                {user?.full_name || user?.username}
              </p>
              <p className="text-[10px] text-cyan-400 font-mono leading-tight truncate max-w-[120px]">
                {user?.email || 'Active User'}
              </p>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 ml-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Server Endpoint Config Modal */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title="Cấu hình kết nối Backend API"
        description="Địa chỉ máy chủ FastAPI REST API & WebSocket"
      >
        <div className="space-y-4">
          <Input
            label="API Base URL Prefix"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="http://192.168.1.35:8000/api"
            helper="Mặc định: http://192.168.1.35:8000/api"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowConfigModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSaveApiUrl}>
              Lưu & Tải lại
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
