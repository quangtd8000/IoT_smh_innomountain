import React, { useState, useEffect } from 'react';
import { useHome } from '../../context/HomeContext';
import { devicesApi } from '../../api/devices';
import { RelayChannel } from '../../types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Notice } from '../ui/Notice';

export interface EditRelayModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: number;
  channel: RelayChannel;
}

export const EditRelayModal: React.FC<EditRelayModalProps> = ({
  isOpen,
  onClose,
  deviceId,
  channel,
}) => {
  const { refreshHomeDetails } = useHome();
  const [name, setName] = useState(channel.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(channel.name);
    setError('');
  }, [channel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên công tắc');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await devicesApi.updateRelayChannel(deviceId, channel.id, {
        name: name.trim(),
      });
      await refreshHomeDetails();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật tên công tắc');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Đổi tên công tắc"
      description={`Đổi tên hiển thị cho Công tắc ${channel.channel}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Notice tone="error">{error}</Notice>}

        <Input
          label="Tên công tắc mới"
          placeholder="VD: Đèn trần, Quạt hút, Đèn ngủ, Ổ cắm TV..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />

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
