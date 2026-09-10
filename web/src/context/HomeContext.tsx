import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  updateDevice: (deviceId: number, payload: { name?: string; room_id?: number | null }) => Promise<Device>;
  updateRelayChannelName: (deviceId: number, channelId: number, name: string) => Promise<void>;
}

// Chỉ cập nhật state khi dữ liệu thực sự thay đổi. HomeContext polling mỗi 5s
// luôn fetch dữ liệu mới (object/array mới), nếu setState vô điều kiện thì mọi
// component phụ thuộc object này sẽ render lại liên tục và làm reset form
// đang nhập trong các modal (sửa tên thiết bị, đổi tên phòng...).
function setIfChanged<T>(setter: React.Dispatch<React.SetStateAction<T>>, next: T) {
  setter((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
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
  // Bộ đếm thứ tự lần refresh — response về sau của lần cũ phải bị bỏ qua
  const refreshSeqRef = useRef(0);

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
    // Sequence guard: nếu trong lúc fetch có một lần refresh mới bắt đầu
    // (polling 5s / optimistic refresh), response cũ về sau phải bị bỏ qua,
    // nếu không dữ liệu cũ sẽ đè optimistic update vừa ghi (tên thiết bị bị nhảy).
    const seq = ++refreshSeqRef.current;
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

      // Bỏ qua response cũ: đã có lần refresh mới hơn bắt đầu sau lần này
      if (seq !== refreshSeqRef.current) return;

      setIfChanged(setMembers, membersData);
      setIfChanged(setRooms, sortedRooms);
      setIfChanged(setDevices, detailedDevices);
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

  // Device update handler with optimistic UI update
  const updateDevice = async (deviceId: number, payload: { name?: string; room_id?: number | null }) => {
    // Optimistic update
    setDevices((prev) =>
      prev.map((dev) => {
        if (dev.id !== deviceId) return dev;
        return {
          ...dev,
          name: payload.name !== undefined ? payload.name.trim() : dev.name,
          room_id: payload.room_id !== undefined ? payload.room_id : dev.room_id,
        };
      })
    );

    try {
      const updated = await devicesApi.updateDevice(deviceId, payload);
      setDevices((prev) =>
        prev.map((dev) => (dev.id === deviceId ? { ...dev, ...updated } : dev))
      );
      refreshHomeDetails(true);
      return updated;
    } catch (error) {
      console.error('Failed to update device:', error);
      refreshHomeDetails(true);
      throw error;
    }
  };

  // Relay name update handler with optimistic UI update
  const updateRelayChannelName = async (deviceId: number, channelId: number, name: string) => {
    setDevices((prev) =>
      prev.map((dev) => {
        if (dev.id !== deviceId) return dev;
        return {
          ...dev,
          relay_channels: dev.relay_channels?.map((ch) =>
            ch.id === channelId ? { ...ch, name: name.trim() } : ch
          ),
        };
      })
    );

    try {
      await devicesApi.updateRelayChannel(deviceId, channelId, { name: name.trim() });
      refreshHomeDetails(true);
    } catch (error) {
      console.error('Failed to update relay name:', error);
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
        updateDevice,
        updateRelayChannelName,
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
