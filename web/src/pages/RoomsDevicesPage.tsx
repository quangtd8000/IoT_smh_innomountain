import React, { useState } from 'react';
import { Plus, Trash2, Pencil, Bluetooth } from 'lucide-react';
import { useHome } from '../context/HomeContext';
import { DeviceCard } from '../components/devices/DeviceCard';
import { EditRoomModal } from '../components/rooms/EditRoomModal';
import { BlePairingModal } from '../components/devices/BlePairingModal';
import { Button } from '../components/ui/Button';
import { Notice } from '../components/ui/Notice';
import { roomsApi } from '../api/rooms';
import { roomTone } from '../lib/roomTone';
import { Room } from '../types';
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
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showBlePairing, setShowBlePairing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomFilter);

  const filteredDevices = devices.filter((d) =>
    selectedRoomFilter === 'all' ? true : d.room_id === selectedRoomFilter
  );

  const onlineCount = devices.filter((d) => d.status === 'online').length;

  const handleDeleteRoom = async (room: Room) => {
    if (
      !window.confirm(
        `Xoá phòng “${room.name}”? Các thiết bị trong phòng này sẽ được chuyển thành chưa gán phòng.`
      )
    ) {
      return;
    }
    setError(null);
    try {
      await roomsApi.deleteRoom(room.id);
      setSelectedRoomFilter('all');
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
            {selectedRoom && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingRoom(selectedRoom)}
                  className="text-xs text-ink-2 hover:text-ink flex items-center gap-1.5"
                >
                  <Pencil size={13} />
                  <span>Đổi tên phòng</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteRoom(selectedRoom)}
                  className="text-xs text-ink-2 hover:text-air-bad flex items-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>Xoá phòng</span>
                </Button>
                <div className="h-4 w-px bg-line" />
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBlePairing(true)}
              className="text-blue-500 border-blue-500/30 hover:bg-blue-500/10 flex items-center gap-1.5 font-medium"
            >
              <Bluetooth size={14} className="text-blue-500" aria-hidden="true" />
              <span>Ghép nối Bluetooth</span>
            </Button>
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

      {/* Danh sách tab phòng sạch sẽ, không có icon rác */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-line">
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
            <button
              key={r.id}
              onClick={() => setSelectedRoomFilter(r.id)}
              className={tabClass(isSelected)}
              style={{ ['--tone' as string]: tone.rgb } as React.CSSProperties}
            >
              <Icon size={15} strokeWidth={1.75} aria-hidden="true" style={{ color: 'rgb(var(--tone))' }} />
              <span>{r.name}</span>
              <span className="text-xs text-ink-2 tnum">{devCount}</span>
            </button>
          );
        })}
      </div>

      {filteredDevices.length === 0 ? (
        <div className="plate p-6">
          <p className="text-sm text-ink">Chưa có thiết bị nào ở phòng này.</p>
          {isOwnerOrAdmin && (
            <p className="text-sm text-ink-2 mt-1">
              Bấm “Thêm thiết bị” để thêm thiết bị mới hoặc bấm nút bút chì ✏️ trên thẻ thiết bị để chuyển vào phòng này.
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

      {editingRoom && (
        <EditRoomModal
          isOpen={editingRoom !== null}
          onClose={() => setEditingRoom(null)}
          room={editingRoom}
        />
      )}

      <BlePairingModal
        isOpen={showBlePairing}
        onClose={() => setShowBlePairing(false)}
        onSuccess={() => {
          setShowBlePairing(false);
          refreshHomeDetails();
        }}
      />
    </div>
  );
};
