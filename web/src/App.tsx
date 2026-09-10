import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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
import { BlePairingModal } from './components/devices/BlePairingModal';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentPage, setCurrentPage] = useState<string>('dashboard');

  // Global modals
  const [showCreateHome, setShowCreateHome] = useState<boolean>(false);
  const [showAddDevice, setShowAddDevice] = useState<boolean>(false);
  const [showAddRoom, setShowAddRoom] = useState<boolean>(false);
  const [showBlePairing, setShowBlePairing] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ground flex items-center justify-center">
        <p className="text-sm text-ink-2">Đang tải</p>
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
        onOpenBlePairing={() => setShowBlePairing(true)}
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

        {showBlePairing && (
          <BlePairingModal
            isOpen={showBlePairing}
            onClose={() => setShowBlePairing(false)}
          />
        )}
      </Layout>
    </HomeProvider>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
