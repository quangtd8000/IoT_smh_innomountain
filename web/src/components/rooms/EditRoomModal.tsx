import React, { useState, useEffect } from 'react';
import { useHome } from '../../context/HomeContext';
import { roomsApi } from '../../api/rooms';
import { Room } from '../../types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Notice } from '../ui/Notice';

export interface EditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
}

export const EditRoomModal: React.FC<EditRoomModalProps> = ({
  isOpen,
  onClose,
  room,
}) => {
  const { refreshHomeDetails } = useHome();
  const [name, setName] = useState(room.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(room.name);
    setError('');
  }, [room]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên phòng');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await roomsApi.updateRoom(room.id, name.trim());
      await refreshHomeDetails();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật tên phòng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Đổi tên phòng"
      description={`Cập nhật tên gọi cho phòng ${room.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Notice tone="error">{error}</Notice>}

        <Input
          label="Tên phòng mới"
          placeholder="VD: Phòng khách, Phòng ngủ master, Bếp & Bàn ăn..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
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
