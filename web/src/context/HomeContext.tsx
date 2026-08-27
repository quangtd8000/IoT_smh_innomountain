import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Home, HomeMember, Room, Device, HomeRole } from '../types';
import { homesApi } from '../api/homes';
import { roomsApi } from '../api/rooms';
import { devicesApi } from '../api/devices';
import { useAuth } from './AuthContext';

interface HomeContextType {
  homes: Home[];
  activeHome: Home | null;
  members: HomeMember[];
  rooms: Room[];
  devices: Device[];
  userRole: HomeRole;
  isOwnerOrAdmin: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  setActiveHome: (home: Home) => void;
  refreshHomes: () => Promise<void>;
  refreshHomeDetails: () => Promise<void>;
  toggleRelayChannel: (deviceId: number, channelId: number, currentState: boolean) => Promise<void>;
}

const HomeContext = createContext<HomeContextType | undefined>(undefined);

export const HomeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [homes, setHomes] = useState<Home[]>([]);
  const [activeHome, setActiveHomeState] = useState<Home | null>(null);
  const [members, setMembers] = useState<HomeMember[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Determine current user's role in active home
  const userRole: HomeRole = React.useMemo(() => {
    if (!activeHome || !user) return 'member';
    if (activeHome.owner_id === user.id) return 'owner';
    const member = members.find((m) => m.user_id === user.id);
    return member?.role || activeHome.role || 'member';
  }, [activeHome, user, members]);

  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';

  // Load all homes
  const refreshHomes = useCallback(async () => {
    if (!isAuthenticated) {
      setHomes([]);
      setActiveHomeState(null);
      setIsLoading(false);
      return;
    }
    try {
      const homeList = await homesApi.getHomes();
      setHomes(homeList);
      
      // Keep current active home or select first
      if (homeList.length > 0) {
        setActiveHomeState((prev) => {
          if (prev && homeList.some((h) => h.id === prev.id)) {
            return homeList.find((h) => h.id === prev.id) || homeList[0];
          }
          return homeList[0];
        });
      } else {
        setActiveHomeState(null);
      }
    } catch (error) {
      console.error('Error fetching homes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Load details for active home (rooms, devices, members)
  const refreshHomeDetails = useCallback(async (silent = false) => {
    if (!activeHome) {
      setMembers([]);
      setRooms([]);
      setDevices([]);
      return;
    }
    if (!silent) setIsRefreshing(true);
    try {
      const [membersData, roomsData, devicesData] = await Promise.all([
        homesApi.getMembers(activeHome.id).catch(() => []),
        roomsApi.getRoomsByHome(activeHome.id).catch(() => []),
        devicesApi.getDevicesByHome(activeHome.id).catch(() => []),
      ]);

      // Sắp xếp các danh sách cố định để không bị nhảy vị trí khi cập nhật
      const sortedRooms = (roomsData || []).sort((a, b) => a.id - b.id);

      // Enhance devices with their relay channels and IR devices in parallel
      const detailedDevices = await Promise.all(
        (devicesData || []).map(async (dev) => {
          try {
            const [relays, irs] = await Promise.all([
              devicesApi.getRelayChannels(dev.id).catch(() => []),
              devicesApi.getIRDevices(dev.id).catch(() => []),
            ]);
            return {
              ...dev,
              relay_channels: (relays || []).sort((a, b) => (a.channel || 0) - (b.channel || 0) || a.id - b.id),
              ir_devices: irs || [],
            };
          } catch {
            return dev;
          }
        })
      );

      detailedDevices.sort((a, b) => a.id - b.id);

      setMembers(membersData);
      setRooms(sortedRooms);
      setDevices(detailedDevices);
    } catch (error) {
      console.error('Error loading home details:', error);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, [activeHome]);

  const setActiveHome = (home: Home) => {
    setActiveHomeState(home);
  };

  useEffect(() => {
    refreshHomes();
  }, [refreshHomes]);

  useEffect(() => {
    if (activeHome) {
      refreshHomeDetails();
    }
  }, [activeHome?.id, refreshHomeDetails]);

  // Polling for device status and relay states every 5 seconds
  useEffect(() => {
    if (!isAuthenticated || !activeHome) return;
    const interval = setInterval(() => {
      refreshHomeDetails(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, activeHome, refreshHomeDetails]);

  // Quick relay toggle handler with optimistic UI update
  const toggleRelayChannel = async (deviceId: number, channelId: number, currentState: boolean) => {
    const newState = !currentState;
    // Optimistic update
    setDevices((prev) =>
      prev.map((dev) => {
        if (dev.id !== deviceId) return dev;
        return {
          ...dev,
          relay_channels: dev.relay_channels?.map((ch) =>
            ch.id === channelId ? { ...ch, state: newState } : ch
          ),
        };
      })
    );

    try {
      await devicesApi.updateRelayChannel(deviceId, channelId, { state: newState });
    } catch (error) {
      console.error('Failed to toggle relay:', error);
      // Revert on error
      refreshHomeDetails(true);
      throw error;
    }
  };

  return (
    <HomeContext.Provider
      value={{
        homes,
        activeHome,
        members,
        rooms,
        devices,
        userRole,
        isOwnerOrAdmin,
        isLoading,
        isRefreshing,
        setActiveHome,
        refreshHomes,
        refreshHomeDetails: () => refreshHomeDetails(false),
        toggleRelayChannel,
      }}
    >
      {children}
    </HomeContext.Provider>
  );
};

export const useHome = () => {
  const context = useContext(HomeContext);
  if (!context) {
    throw new Error('useHome must be used within a HomeProvider');
  }
  return context;
};
