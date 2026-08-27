import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Device } from '../../types';
import { useHome } from '../../context/HomeContext';
import { devicesApi } from '../../api/devices';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Notice } from '../ui/Notice';
import { AddRelayModal } from './AddRelayModal';
import { formatRelativeTime, cn } from '../../lib/utils';

export interface DeviceCardProps {
  device: Device;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device }) => {
  const { isOwnerOrAdmin, refreshHomeDetails, toggleRelayChannel, rooms } = useHome();
  const [showAddRelay, setShowAddRelay] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const room = rooms.find((r) => r.id === device.room_id);
  const isOnline = device.status === 'online';

  const handleDelete = async () => {
    if (!window.confirm(`Xoá thiết bị “${device.name}”? Không khôi phục lại được.`)) return;
    setDeleteError(null);
    try {
      await devicesApi.deleteDevice(device.id);
      await refreshHomeDetails();
    } catch (err: any) {
      setDeleteError(err.message || 'Không xoá được thiết bị.');
    }
  };

  return (
    <>
      <div className="plate flex flex-col p-0">
        <div className="px-4 py-3 border-b border-line">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-ink truncate">{device.name}</h3>
              <p className="text-xs text-ink-2 truncate">{device.device_uid}</p>
            </div>
            {/* Trạng thái nói bằng chữ, không bằng màu — giữ bảng màu kỷ luật */}
            <span className="flex items-center gap-1.5 text-xs flex-shrink-0">
              <span
                aria-hidden="true"
                className={cn('h-1.5 w-1.5 rounded-full', isOnline ? 'bg-ink' : 'bg-ink-2/40')}
              />
              <span className={isOnline ? 'text-ink' : 'text-ink-2'}>
                {isOnline ? 'Trực tuyến' : 'Mất kết nối'}
              </span>
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-2">
            {room?.name || 'Chưa gán phòng'} · {formatRelativeTime(device.last_seen)}
          </p>
        </div>

        <div className="px-4 py-3 border-b border-line flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-ink-2">
              Công tắc ({device.relay_channels?.length || 0})
            </span>
            {isOwnerOrAdmin && (
              <button
                onClick={() => setShowAddRelay(true)}
                className="text-xs text-ink-2 hover:text-ink flex items-center gap-1 transition-colors"
              >
                <Plus size={13} aria-hidden="true" />
                Thêm công tắc
              </button>
            )}
          </div>

          {device.relay_channels && device.relay_channels.length > 0 ? (
            <ul className="space-y-1">
              {device.relay_channels.map((ch) => (
                <li key={ch.id} className="flex items-center justify-between gap-3 py-1.5">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-ink-2 tnum w-4 flex-shrink-0">{ch.channel}</span>
                    <span className="text-sm text-ink truncate">{ch.name}</span>
                  </span>
                  <Switch
                    size="sm"
                    checked={ch.state}
                    aria-label={ch.name}
                    onChange={() => toggleRelayChannel(device.id, ch.id, ch.state)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-2">Chưa có công tắc nào.</p>
          )}
        </div>

        {deleteError && (
          <div className="px-4 pt-3">
            <Notice tone="error">{deleteError}</Notice>
          </div>
        )}

        {isOwnerOrAdmin && (
          <div className="px-4 py-2.5 flex items-center justify-end border-t border-line/40">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-xs text-ink-2 hover:text-air-bad flex items-center gap-1.5"
              aria-label="Xoá thiết bị"
              title="Xoá thiết bị"
            >
              <Trash2 size={13} />
              <span>Xoá thiết bị</span>
            </Button>
          </div>
        )}
      </div>

      {showAddRelay && (
        <AddRelayModal
          isOpen={showAddRelay}
          onClose={() => setShowAddRelay(false)}
          deviceId={device.id}
          existingChannels={device.relay_channels?.map((c) => c.channel) || []}
        />
      )}
    </>
  );
};
