import React, { useState } from 'react';
import { useHome } from '../../context/HomeContext';
import { devicesApi } from '../../api/devices';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Notice } from '../ui/Notice';

export interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEVICE_TYPES = [
  { value: 'sensor', label: 'Cảm biến môi trường' },
  { value: 'controller', label: 'Bộ điều khiển' },
  { value: 'relay', label: 'Module relay' },
  { value: 'ir', label: 'Mắt phát hồng ngoại' },
];

const selectClass = 'w-full min-h-11 px-3 bg-surface border border-line rounded-md text-ink text-base';

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({ isOpen, onClose }) => {
  const { activeHome, rooms, refreshHomeDetails } = useHome();
  const [name, setName] = useState('');
  const [deviceUid, setDeviceUid] = useState('');
  const [deviceType, setDeviceType] = useState('sensor');
  const [roomId, setRoomId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Điền sẵn một thiết bị mẫu để thử nhanh.
   *
   * Trước đây chỗ này là tab "Quét mã QR" có hiệu ứng quét, nhưng nó
   * không đọc camera và không giải mã gì cả — chỉ chờ 1,2 giây rồi điền
   * cứng đúng một mã. Giữ lại tiện ích, bỏ cái nhãn không đúng sự thật.
   */
  const fillSample = () => {
    setDeviceUid('esp32-node-58332');
    setName('Cảm biến không khí');
    setDeviceType('sensor');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHome) return;
    if (!name.trim() || !deviceUid.trim()) {
      setError('Nhập tên thiết bị và mã phần cứng để tiếp tục.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await devicesApi.registerDevice(activeHome.id, {
        name: name.trim(),
        device_uid: deviceUid.trim(),
        device_type: deviceType,
        room_id: roomId ? Number(roomId) : null,
      });
      await refreshHomeDetails();
      setName('');
      setDeviceUid('');
      setRoomId('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không đăng ký được thiết bị.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm thiết bị"
      description="Đăng ký một mạch ESP32 hoặc cụm cảm biến vào nhà."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Notice tone="error">{error}</Notice>}

        <Input
          label="Tên thiết bị"
          placeholder="Cảm biến phòng khách"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Mã phần cứng"
          placeholder="esp32-node-58332"
          value={deviceUid}
          onChange={(e) => setDeviceUid(e.target.value)}
          helper="Khớp với DEVICE_UID nạp trong firmware của mạch."
          required
        />

        <div className="space-y-1.5">
          <label htmlFor="device-type" className="block text-sm font-medium text-ink">
            Loại thiết bị
          </label>
          <select
            id="device-type"
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value)}
            className={selectClass}
          >
            {DEVICE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="device-room" className="block text-sm font-medium text-ink">
            Phòng
          </label>
          <select
            id="device-room"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className={selectClass}
          >
            <option value="">Chưa gán phòng</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-line">
          <button
            type="button"
            onClick={fillSample}
            className="text-sm text-ink-2 underline underline-offset-2 hover:text-ink"
          >
            Điền thiết bị mẫu
          </button>

          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Huỷ
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Thêm thiết bị
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
