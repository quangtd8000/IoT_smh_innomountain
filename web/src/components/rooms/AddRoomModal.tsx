import React, { useState } from 'react';
import { useHome } from '../../context/HomeContext';
import { roomsApi } from '../../api/rooms';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddRoomModal: React.FC<AddRoomModalProps> = ({ isOpen, onClose }) => {
  const { activeHome, refreshHomeDetails } = useHome();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHome || !name.trim()) return;

    setLoading(true);
    setError('');
    try {
      await roomsApi.createRoom(activeHome.id, name.trim());
      await refreshHomeDetails();
      setName('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể tạo phòng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm Phòng Mới"
      description={`Tạo không gian mới trong ngôi nhà "${activeHome?.name}"`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
            {error}
          </div>
        )}

        <Input
          label="Tên phòng"
          placeholder="VD: Phòng Khách, Phòng Ngủ Master, Bếp..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Tạo Phòng
          </Button>
        </div>
      </form>
    </Modal>
  );
};
