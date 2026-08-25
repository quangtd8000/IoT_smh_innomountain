import React, { useState } from 'react';
import { useHome } from '../../context/HomeContext';
import { homesApi } from '../../api/homes';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export interface CreateHomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateHomeModal: React.FC<CreateHomeModalProps> = ({ isOpen, onClose }) => {
  const { refreshHomes } = useHome();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');
    try {
      await homesApi.createHome(name.trim());
      await refreshHomes();
      setName('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể tạo ngôi nhà mới');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo Ngôi Nhà Mới"
      description="Bạn sẽ là chủ sở hữu (Owner) của ngôi nhà này"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
            {error}
          </div>
        )}

        <Input
          label="Tên Ngôi Nhà"
          placeholder="VD: Căn hộ Vinhomes, Nhà riêng Q7, Villa Đà Lạt..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Tạo Nhà
          </Button>
        </div>
      </form>
    </Modal>
  );
};
