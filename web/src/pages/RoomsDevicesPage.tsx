import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useHome } from '../context/HomeContext';
import { DeviceCard } from '../components/devices/DeviceCard';
import { Button } from '../components/ui/Button';
import { Notice } from '../components/ui/Notice';
import { roomsApi } from '../api/rooms';
import { roomTone } from '../lib/roomTone';
import { cn } from '../lib/utils';

export interface RoomsDevicesPageProps {
  onOpenAddDevice: () => void;
  onOpenAddRoom: () => void;
}

export const RoomsDevicesPage: React.FC<RoomsDevicesPageProps> = ({
  onOpenAddDevice,
  onOpenAddRoom,
}) => {
  const { devices, rooms, isOwnerOrAdmin, refreshHomeDetails } = useHome();
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<number | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  const filteredDevices = devices.filter((d) =>
    selectedRoomFilter === 'all' ? true : d.room_id === selectedRoomFilter
  );

  const onlineCount = devices.filter((d) => d.status === 'online').length;

  const handleDeleteRoom = async (roomId: number, roomName: string) => {
    if (
      !window.confirm(
        `Xoá phòng “${roomName}”? Thiết bị trong phòng sẽ thành chưa gán phòng.`
      )
    ) {
      return;
    }
    setError(null);
    try {
      await roomsApi.deleteRoom(roomId);
      if (selectedRoomFilter === roomId) setSelectedRoomFilter('all');
      await refreshHomeDetails();
    } catch (err: any) {
      setError(err.message || 'Không xoá được phòng.');
    }
  };

  const tabClass = (isActive: boolean) =>
    cn(
      'min-h-9 px-3 rounded-md text-sm whitespace-nowrap flex items-center gap-2',
      'transition-colors duration-150',
      isActive ? 'bg-sunken text-ink font-medium' : 'text-ink-2 hover:bg-sunken hover:text-ink'
    );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-ink-2 tnum">
          {devices.length} thiết bị · {onlineCount} trực tuyến · {rooms.length} phòng
        </p>

        {isOwnerOrAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onOpenAddRoom}>
              <Plus size={14} aria-hidden="true" />
              Thêm phòng
            </Button>
            <Button variant="primary" size="sm" onClick={onOpenAddDevice}>
              <Plus size={14} aria-hidden="true" />
              Thêm thiết bị
            </Button>
          </div>
        )}
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-line">
        <button onClick={() => setSelectedRoomFilter('all')} className={tabClass(selectedRoomFilter === 'all')}>
          <span>Tất cả</span>
          <span className="text-xs text-ink-2 tnum">{devices.length}</span>
        </button>

        {rooms.map((r) => {
          const devCount = devices.filter((d) => d.room_id === r.id).length;
          const isSelected = selectedRoomFilter === r.id;
          const tone = roomTone(r.name);
          const Icon = tone.icon;
          return (
            <div key={r.id} className="flex items-center flex-shrink-0">
              <button
                onClick={() => setSelectedRoomFilter(r.id)}
                className={tabClass(isSelected)}
                style={{ ['--tone' as string]: tone.rgb } as React.CSSProperties}
              >
                <Icon size={15} strokeWidth={1.75} aria-hidden="true" style={{ color: 'rgb(var(--tone))' }} />
                <span>{r.name}</span>
                <span className="text-xs text-ink-2 tnum">{devCount}</span>
              </button>

              {isOwnerOrAdmin && (
                <button
                  onClick={() => handleDeleteRoom(r.id, r.name)}
                  aria-label={`Xoá phòng ${r.name}`}
                  title={`Xoá phòng ${r.name}`}
                  className="p-2 text-ink-2 hover:text-air-bad transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {filteredDevices.length === 0 ? (
        <div className="plate p-6">
          <p className="text-sm text-ink">Chưa có thiết bị nào ở đây.</p>
          {isOwnerOrAdmin && (
            <p className="text-sm text-ink-2 mt-1">
              Bấm “Thêm thiết bị” để đăng ký một mạch ESP32 mới.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDevices.map((dev) => (
            <DeviceCard key={dev.id} device={dev} />
          ))}
        </div>
      )}
    </div>
  );
};
