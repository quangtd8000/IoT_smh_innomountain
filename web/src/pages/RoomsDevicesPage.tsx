import React, { useState } from 'react';
import { useHome } from '../context/HomeContext';
import { DeviceCard } from '../components/devices/DeviceCard';
import { Button } from '../components/ui/Button';
import { Plus, Cpu, Layers, Trash2, Home, CheckCircle2, AlertCircle } from 'lucide-react';
import { roomsApi } from '../api/rooms';
import { cn } from '../lib/utils';

export interface RoomsDevicesPageProps {
  onOpenAddDevice: () => void;
  onOpenAddRoom: () => void;
}

export const RoomsDevicesPage: React.FC<RoomsDevicesPageProps> = ({
  onOpenAddDevice,
  onOpenAddRoom,
}) => {
  const { devices, rooms, activeHome, isOwnerOrAdmin, refreshHomeDetails } = useHome();
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<number | 'all'>('all');

  const filteredDevices = devices.filter((d) => {
    if (selectedRoomFilter === 'all') return true;
    return d.room_id === selectedRoomFilter;
  });

  const onlineCount = devices.filter((d) => d.status === 'online').length;

  const handleDeleteRoom = async (roomId: number, roomName: string) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa phòng "${roomName}"? Thiết bị trong phòng sẽ chuyển về trạng thái Chưa gán phòng.`
      )
    ) {
      return;
    }
    try {
      await roomsApi.deleteRoom(roomId);
      if (selectedRoomFilter === roomId) setSelectedRoomFilter('all');
      await refreshHomeDetails();
    } catch (err: any) {
      alert(err.message || 'Không thể xóa phòng');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 glass-card rounded-3xl">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="text-cyan-400" size={20} />
            Quản Lý Thiết Bị & Không Gian
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Đang quản lý {devices.length} thiết bị phần cứng ({onlineCount} trực tuyến) trong {rooms.length} khu vực
          </p>
        </div>

        {isOwnerOrAdmin && (
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenAddRoom}
              className="rounded-xl border-slate-700 bg-slate-900 hover:bg-slate-800"
            >
              <Plus size={14} />
              Thêm Phòng
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenAddDevice}
              className="rounded-xl shadow-lg shadow-blue-600/30"
            >
              <Plus size={14} />
              Đăng Ký Thiết Bị
            </Button>
          </div>
        )}
      </div>

      {/* Room Tabs Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80 scrollbar-none">
        <button
          onClick={() => setSelectedRoomFilter('all')}
          className={cn(
            'px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2',
            selectedRoomFilter === 'all'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 border border-blue-500/40'
              : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800/80'
          )}
        >
          <span>Tất Cả Thiết Bị</span>
          <span
            className={cn(
              'text-[10px] px-2 py-0.5 rounded-full font-bold',
              selectedRoomFilter === 'all' ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-300'
            )}
          >
            {devices.length}
          </span>
        </button>

        {rooms.map((r) => {
          const devCount = devices.filter((d) => d.room_id === r.id).length;
          const isSelected = selectedRoomFilter === r.id;
          return (
            <div key={r.id} className="relative group flex items-center">
              <button
                onClick={() => setSelectedRoomFilter(r.id)}
                className={cn(
                  'px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2',
                  isSelected
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 border border-blue-500/40'
                    : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800/80'
                )}
              >
                <span>{r.name}</span>
                <span
                  className={cn(
                    'text-[10px] px-2 py-0.5 rounded-full font-bold',
                    isSelected ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-300'
                  )}
                >
                  {devCount}
                </span>
              </button>

              {isOwnerOrAdmin && (
                <button
                  onClick={() => handleDeleteRoom(r.id, r.name)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity ml-1"
                  title="Xóa phòng"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Devices Grid */}
      {filteredDevices.length === 0 ? (
        <div className="py-16 text-center text-slate-500 glass-card rounded-3xl border border-slate-800">
          <Cpu size={40} className="mx-auto mb-3 opacity-40 text-slate-400" />
          <p className="text-sm font-bold text-slate-300">Không tìm thấy thiết bị nào trong khu vực này.</p>
          {isOwnerOrAdmin && (
            <p className="text-xs text-slate-500 mt-1">
              Bấm nút "Đăng Ký Thiết Bị" ở góc trên để thêm phần cứng ESP32 mới.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredDevices.map((dev) => (
            <DeviceCard key={dev.id} device={dev} />
          ))}
        </div>
      )}
    </div>
  );
};
