import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HomeProvider } from './context/HomeContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { RoomsDevicesPage } from './pages/RoomsDevicesPage';
import { IRControllerPage } from './pages/IRControllerPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CreateHomeModal } from './components/homes/CreateHomeModal';
import { AddDeviceModal } from './components/devices/AddDeviceModal';
import { AddRoomModal } from './components/rooms/AddRoomModal';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentPage, setCurrentPage] = useState<string>('dashboard');

  // Global modals
  const [showCreateHome, setShowCreateHome] = useState<boolean>(false);
  const [showAddDevice, setShowAddDevice] = useState<boolean>(false);
  const [showAddRoom, setShowAddRoom] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Đang khởi tạo SmartHome...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authView === 'register') {
      return <RegisterPage onGoToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onGoToRegister={() => setAuthView('register')} />;
  }

  return (
    <HomeProvider>
      <Layout
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        onOpenCreateHome={() => setShowCreateHome(true)}
      >
        {currentPage === 'dashboard' && (
          <DashboardPage
            onOpenCreateHome={() => setShowCreateHome(true)}
            onOpenAddDevice={() => setShowAddDevice(true)}
          />
        )}
        {currentPage === 'devices' && (
          <RoomsDevicesPage
            onOpenAddDevice={() => setShowAddDevice(true)}
            onOpenAddRoom={() => setShowAddRoom(true)}
          />
        )}
        {currentPage === 'ir' && <IRControllerPage />}
        {currentPage === 'analytics' && <AnalyticsPage />}
        {currentPage === 'settings' && <SettingsPage />}

        {/* Global Action Modals */}
        {showCreateHome && (
          <CreateHomeModal
            isOpen={showCreateHome}
            onClose={() => setShowCreateHome(false)}
          />
        )}

        {showAddDevice && (
          <AddDeviceModal
            isOpen={showAddDevice}
            onClose={() => setShowAddDevice(false)}
          />
        )}

        {showAddRoom && (
          <AddRoomModal
            isOpen={showAddRoom}
            onClose={() => setShowAddRoom(false)}
          />
        )}
      </Layout>
    </HomeProvider>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
