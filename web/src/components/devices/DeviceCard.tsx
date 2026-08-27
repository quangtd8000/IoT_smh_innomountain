import React, { useState } from 'react';
import { Plus, Trash2, Pencil, Sliders, MapPin } from 'lucide-react';
import { Device } from '../../types';
import { useHome } from '../../context/HomeContext';
import { devicesApi } from '../../api/devices';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Notice } from '../ui/Notice';
import { AddRelayModal } from './AddRelayModal';
import { EditDeviceModal } from './EditDeviceModal';
import { formatRelativeTime, cn } from '../../lib/utils';

export interface DeviceCardProps {
  device: Device;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device }) => {
  const { isOwnerOrAdmin, refreshHomeDetails, toggleRelayChannel, rooms } = useHome();
  const [showAddRelay, setShowAddRelay] = useState(false);
  const [showEditDevice, setShowEditDevice] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const room = rooms.find((r) => r.id === device.room_id);
  const isOnline = device.status === 'online';
  const channels = device.relay_channels || [];
  const isRelayNode = device.device_type === 'relay' || channels.length > 0;

  const handleDeleteDevice = async () => {
    if (!window.confirm(`Xoá thiết bị “${device.name}”? Không khôi phục lại được.`)) return;
    setActionError(null);
    try {
      await devicesApi.deleteDevice(device.id);
      await refreshHomeDetails();
    } catch (err: any) {
      setActionError(err.message || 'Không xoá được thiết bị.');
    }
  };

  return (
    <>
      <div className="plate flex flex-col p-0">
        {/* Header thẻ: Tên thiết bị, trạng thái và DUY NHẤT 1 nút Bút chì chỉnh sửa */}
        <div className="px-4 py-3 border-b border-line">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-ink truncate">{device.name}</h3>
              <p className="text-xs text-ink-2 truncate">{device.device_uid}</p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Trạng thái trực tuyến / offline */}
              <span className="flex items-center gap-1.5 text-xs">
                <span
                  aria-hidden="true"
                  className={cn('h-1.5 w-1.5 rounded-full', isOnline ? 'bg-ink' : 'bg-ink-2/40')}
                />
                <span className={isOnline ? 'text-ink' : 'text-ink-2'}>
                  {isOnline ? 'Trực tuyến' : 'Mất kết nối'}
                </span>
              </span>

              {/* 1 nút Bút chì duy nhất để cài đặt / đổi phòng / đổi tên toàn bộ thiết bị */}
              {isOwnerOrAdmin && (
                <button
                  type="button"
                  onClick={() => setShowEditDevice(true)}
                  className="p-1.5 rounded text-ink-2 hover:text-ink hover:bg-ink/5 transition-colors"
                  title="Cài đặt, chuyển phòng và đổi tên"
                  aria-label="Cài đặt thiết bị"
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-ink-2">
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} className="text-ink-2/80" />
              <span>{room?.name || 'Chưa gán phòng'}</span>
            </span>
            <span>{formatRelativeTime(device.last_seen)}</span>
          </div>
        </div>

        {/* Nội dung: Danh sách công tắc sạch sẽ, không icon rác */}
        <div className="px-4 py-3 border-b border-line flex-1">
          {isRelayNode ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-ink-2">
                  Công tắc ({channels.length}/3)
                </span>
                {isOwnerOrAdmin && channels.length < 3 && (
                  <button
                    onClick={() => setShowAddRelay(true)}
                    className="text-xs text-ink-2 hover:text-ink flex items-center gap-1 transition-colors"
                  >
                    <Plus size={13} aria-hidden="true" />
                    Thêm công tắc
                  </button>
                )}
              </div>

              {channels.length > 0 ? (
                <ul className="space-y-1">
                  {channels.map((ch) => (
                    <li
                      key={ch.id}
                      className="flex items-center justify-between gap-3 py-1.5 px-2 rounded hover:bg-ink/[0.02] transition-colors"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono text-ink-2 bg-ink/5 px-1.5 py-0.5 rounded flex-shrink-0">
                          #{ch.channel}
                        </span>
                        <span className="text-sm text-ink truncate" title={ch.name}>
                          {ch.name}
                        </span>
                      </span>

                      <Switch
                        size="sm"
                        checked={ch.state}
                        aria-label={ch.name}
                        disabled={!isOnline}
                        onChange={() => toggleRelayChannel(device.id, ch.id, ch.state)}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-2 text-center">
                  <p className="text-xs text-ink-2">Chưa có công tắc nào.</p>
                  {isOwnerOrAdmin && (
                    <button
                      onClick={() => setShowAddRelay(true)}
                      className="mt-1 text-xs text-ink underline"
                    >
                      + Thêm công tắc (Tối đa 3)
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-2 space-y-1">
              <div className="flex items-center gap-2 text-xs text-ink">
                <Sliders size={14} className="text-ink-2" />
                <span>Node Cảm biến Môi trường & Hồng ngoại</span>
              </div>
              <p className="text-xs text-ink-2">
                Tự động đo chất lượng không khí và phát sóng điều khiển TV, Điều hòa, Quạt.
              </p>
            </div>
          )}
        </div>

        {actionError && (
          <div className="px-4 pt-3">
            <Notice tone="error">{actionError}</Notice>
          </div>
        )}

        {isOwnerOrAdmin && (
          <div className="px-4 py-2 flex items-center justify-end border-t border-line/40">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteDevice}
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
          existingChannels={channels.map((c) => c.channel)}
        />
      )}

      {showEditDevice && (
        <EditDeviceModal
          isOpen={showEditDevice}
          onClose={() => setShowEditDevice(false)}
          device={device}
        />
      )}
    </>
  );
};
