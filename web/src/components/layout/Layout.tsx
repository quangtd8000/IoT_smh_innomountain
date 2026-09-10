import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { pageTitle } from './nav';

export interface LayoutProps {
  currentPage: string;
  onSelectPage: (page: string) => void;
  onOpenCreateHome: () => void;
  onOpenBlePairing?: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentPage,
  onSelectPage,
  onOpenCreateHome,
  onOpenBlePairing,
  children,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen bg-ground text-ink overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onSelectPage={onSelectPage}
        onOpenCreateHome={onOpenCreateHome}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={pageTitle(currentPage)}
          onOpenCreateHome={onOpenCreateHome}
          onOpenMenu={() => setDrawerOpen(true)}
          onOpenBlePairing={onOpenBlePairing}
        />
        {/* pb-20 chừa chỗ cho tab dưới trên điện thoại */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 md:pb-6">{children}</main>
      </div>

      <BottomNav currentPage={currentPage} onSelectPage={onSelectPage} />
    </div>
  );
};
