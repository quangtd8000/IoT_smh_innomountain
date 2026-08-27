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
  
  // Tìm các vị trí kênh còn trống từ 1 đến 3
  const allPossibleChannels = [1, 2, 3];
  const availableChannels = allPossibleChannels.filter((c) => !existingChannels.includes(c));
  const defaultChannel = availableChannels[0] || 1;

  const [channel, setChannel] = useState<number>(defaultChannel);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isFull = existingChannels.length >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFull) {
      setError('Thiết bị này đã có đủ 3 công tắc tối đa.');
      return;
    }
    if (!name.trim()) {
      setError('Vui lòng nhập tên công tắc (VD: Đèn trần, Quạt, Đèn bàn...)');
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
      setError(err.message || 'Không thể thêm công tắc');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm công tắc điều khiển"
      description="Mỗi thiết bị hỗ trợ tối đa 3 công tắc điều khiển độc lập."
    >
      {isFull ? (
        <div className="space-y-4">
          <Notice tone="neutral">
            Thiết bị này đã đạt giới hạn tối đa 3 công tắc. Để thêm mới, vui lòng xoá bớt một công tắc không dùng.
          </Notice>
          <div className="flex justify-end pt-3 border-t border-line">
            <Button type="button" variant="secondary" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Notice tone="error">{error}</Notice>}

          <Input
            label="Tên công tắc"
            placeholder="VD: Đèn trần, Đèn bàn, Quạt thông gió..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1.5">
              Vị trí công tắc (Tối đa 3 kênh)
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(Number(e.target.value))}
              className="w-full h-9 px-3 rounded-md bg-surface border border-line text-sm text-ink focus:outline-none focus:border-ink transition-colors"
            >
              {availableChannels.map((c) => (
                <option key={c} value={c}>
                  Công tắc {c} (Kênh {c})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-2">Chọn vị trí kênh vật lý trên bo mạch (Kênh 1, 2 hoặc 3).</p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Thêm công tắc
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
