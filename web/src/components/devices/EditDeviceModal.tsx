import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useHome } from '../../context/HomeContext';
import { devicesApi } from '../../api/devices';
import { Device, RelayChannel } from '../../types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Notice } from '../ui/Notice';

export interface EditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device;
}

export const EditDeviceModal: React.FC<EditDeviceModalProps> = ({
  isOpen,
  onClose,
  device,
}) => {
  const { rooms, refreshHomeDetails } = useHome();
  const [name, setName] = useState(device.name);
  const [roomId, setRoomId] = useState<string>(device.room_id ? String(device.room_id) : '');
  
  // State quản lý tên các công tắc con
  const [channelNames, setChannelNames] = useState<Record<number, string>>({});
  const [deletedChannelIds, setDeletedChannelIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const channels = (device.relay_channels || []).filter(
    (c) => !deletedChannelIds.includes(c.id)
  );

  useEffect(() => {
    setName(device.name);
    setRoomId(device.room_id ? String(device.room_id) : '');
    const initialNames: Record<number, string> = {};
    (device.relay_channels || []).forEach((ch) => {
      initialNames[ch.id] = ch.name;
    });
    setChannelNames(initialNames);
    setDeletedChannelIds([]);
    setError('');
  }, [device, isOpen]);

  const handleChannelNameChange = (chId: number, newName: string) => {
    setChannelNames((prev) => ({ ...prev, [chId]: newName }));
  };

  const handleDeleteChannel = (chId: number) => {
    setDeletedChannelIds((prev) => [...prev, chId]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên thiết bị');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // 1. Cập nhật tên thiết bị và phòng
      const promises: Promise<any>[] = [
        devicesApi.updateDevice(device.id, {
          name: name.trim(),
          room_id: roomId ? Number(roomId) : null,
        }),
      ];

      // 2. Xoá các kênh đã đánh dấu xoá
      for (const chId of deletedChannelIds) {
        promises.push(devicesApi.deleteRelayChannel(device.id, chId).catch(() => {}));
      }

      // 3. Cập nhật tên các kênh công tắc thay đổi
      for (const ch of device.relay_channels || []) {
        if (deletedChannelIds.includes(ch.id)) continue;
        const currentName = channelNames[ch.id]?.trim();
        if (currentName && currentName !== ch.name) {
          promises.push(
            devicesApi.updateRelayChannel(device.id, ch.id, { name: currentName })
          );
        }
      }

      await Promise.all(promises);
      await refreshHomeDetails();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật thiết bị');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cài đặt thiết bị"
      description={`Đổi tên thiết bị, chuyển phòng và chỉnh sửa tên các công tắc con.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Notice tone="error">{error}</Notice>}

        <Input
          label="Tên thiết bị"
          placeholder="VD: Bảng công tắc phòng khách, Cụm cảm biến trần..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        <div>
          <label className="block text-xs font-medium text-ink-2 mb-1.5">
            Vị trí phòng
          </label>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full h-9 px-3 rounded-md bg-surface border border-line text-sm text-ink focus:outline-none focus:border-ink transition-colors"
          >
            <option value="">-- Chưa gán phòng --</option>
            {rooms.map((r) => (
              <option key={r.id} value={String(r.id)}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Danh sách sửa tên các công tắc (nếu có) */}
        {channels.length > 0 && (
          <div className="pt-2 border-t border-line space-y-2.5">
            <label className="block text-xs font-medium text-ink-2">
              Tên các công tắc ({channels.length}/3)
            </label>
            <div className="space-y-2">
              {channels.map((ch) => (
                <div key={ch.id} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-ink-2 bg-ink/5 px-2 py-2 rounded flex-shrink-0">
                    Kênh {ch.channel}
                  </span>
                  <input
                    type="text"
                    value={channelNames[ch.id] ?? ch.name}
                    onChange={(e) => handleChannelNameChange(ch.id, e.target.value)}
                    placeholder={`Tên công tắc ${ch.channel}`}
                    className="flex-1 h-9 px-3 rounded-md bg-surface border border-line text-sm text-ink focus:outline-none focus:border-ink transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteChannel(ch.id)}
                    title="Xoá bớt công tắc này"
                    aria-label={`Xoá công tắc ${ch.channel}`}
                    className="p-2 text-ink-2/60 hover:text-air-bad transition-colors flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-line">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Modal>
  );
};
