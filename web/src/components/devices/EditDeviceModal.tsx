import React, { useState, useEffect } from 'react';
import { useHome } from '../../context/HomeContext';
import { devicesApi } from '../../api/devices';
import { Device } from '../../types';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(device.name);
    setRoomId(device.room_id ? String(device.room_id) : '');
    setError('');
  }, [device]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên thiết bị');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await devicesApi.updateDevice(device.id, {
        name: name.trim(),
        room_id: roomId ? Number(roomId) : null,
      });
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
      title="Cài đặt thiết bị & Chuyển phòng"
      description={`Cập nhật tên gọi và gán vị trí phòng cho thiết bị ${device.device_uid}`}
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
          <p className="mt-1 text-xs text-ink-2">
            Chọn phòng nơi thiết bị này đang được lắp đặt.
          </p>
        </div>

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
