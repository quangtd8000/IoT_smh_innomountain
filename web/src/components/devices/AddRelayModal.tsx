import React, { useState } from 'react';
import { useHome } from '../../context/HomeContext';
import { devicesApi } from '../../api/devices';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Notice } from '../ui/Notice';

export interface AddRelayModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: number;
  existingChannels: number[];
}

export const AddRelayModal: React.FC<AddRelayModalProps> = ({
  isOpen,
  onClose,
  deviceId,
  existingChannels,
}) => {
  const { refreshHomeDetails } = useHome();
  const nextAvailableChannel = Math.max(0, ...existingChannels) + 1;
  const [channel, setChannel] = useState<number>(nextAvailableChannel);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên kênh relay/tải điện');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await devicesApi.addRelayChannel(deviceId, {
        channel: Number(channel),
        name: name.trim(),
      });
      await refreshHomeDetails();
      setName('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể thêm kênh relay');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm Kênh Relay"
      description="Gán kênh chân điều khiển rơ-le cho tải điện (Đèn, Quạt, Ổ cắm)"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Notice tone="error">{error}</Notice>}

        <Input
          label="Tên tải điều khiển"
          placeholder="VD: Đèn trần, Quạt thông gió..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Số thứ tự kênh (Channel #)"
          type="number"
          min="1"
          max="32"
          value={channel}
          onChange={(e) => setChannel(Number(e.target.value))}
          helper="Số thứ tự kênh relay trên bo mạch ESP32 (1, 2, 3, 4...)"
          required
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-line">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Thêm Kênh
          </Button>
        </div>
      </form>
    </Modal>
  );
};
