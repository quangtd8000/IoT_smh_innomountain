import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export interface LayoutProps {
  currentPage: string;
  onSelectPage: (page: string) => void;
  onOpenCreateHome: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentPage,
  onSelectPage,
  onOpenCreateHome,
  children,
}) => {
  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return 'Bảng Điều Khiển Tổng Quan';
      case 'devices':
        return 'Quản Lý Phòng & Thiết Bị';
      case 'ir':
        return 'Bộ Điều Khiển Hồng Ngoại (IR)';
      case 'analytics':
        return 'Phân Tích Dữ Liệu Cảm Biến';
      case 'settings':
        return 'Cài Đặt Hệ Thống';
      default:
        return 'Smart Home Control';
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={onSelectPage}
        onOpenCreateHome={onOpenCreateHome}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={getPageTitle()} onOpenCreateHome={onOpenCreateHome} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
