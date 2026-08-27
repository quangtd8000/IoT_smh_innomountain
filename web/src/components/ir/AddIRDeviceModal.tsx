import React, { useState } from 'react';
import { useHome } from '../../context/HomeContext';
import { devicesApi } from '../../api/devices';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Notice } from '../ui/Notice';

export interface AddIRDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId?: number;
}

export const AddIRDeviceModal: React.FC<AddIRDeviceModalProps> = ({ isOpen, onClose, deviceId }) => {
  const { devices, refreshHomeDetails } = useHome();
  const [selectedDevId, setSelectedDevId] = useState<number>(deviceId || (devices[0]?.id ?? 0));
  const [name, setName] = useState('');
  const [targetType, setTargetType] = useState<'tv' | 'air_conditioner' | 'fan' | 'custom'>('tv');
  const [brand, setBrand] = useState('');
  const [emitterPin, setEmitterPin] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevId || !name.trim()) {
      setError('Vui lòng chọn bộ phát và nhập tên điều khiển');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await devicesApi.addIRDevice(selectedDevId, {
        name: name.trim(),
        target_type: targetType,
        brand: brand.trim() || undefined,
        emitter_pin: Number(emitterPin),
      });
      await refreshHomeDetails();
      setName('');
      setBrand('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể tạo điều khiển');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm Remote Điều Khiển"
      description="Thêm điều khiển từ xa cho TV, Điều hòa hoặc Quạt."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Notice tone="error">{error}</Notice>}

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-ink">Bộ phát tín hiệu</label>
          <select
            value={selectedDevId}
            onChange={(e) => setSelectedDevId(Number(e.target.value))}
            className="w-full min-h-11 px-3 bg-surface border border-line rounded-md text-ink text-base"
          >
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Tên điều khiển"
          placeholder="VD: TV Phòng Khách, Điều hòa Daikin, Quạt cây..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink">Loại thiết bị</label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as any)}
              className="w-full min-h-11 px-3 bg-surface border border-line rounded-md text-ink text-base"
            >
              <option value="tv">Tivi (TV)</option>
              <option value="air_conditioner">Điều hòa / Máy lạnh</option>
              <option value="fan">Quạt điện</option>
              <option value="custom">Thiết bị khác</option>
            </select>
          </div>

          <Input
            label="Hãng sản xuất"
            placeholder="Samsung, LG, Daikin, Panasonic..."
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-line">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Thêm Remote
          </Button>
        </div>
      </form>
    </Modal>
  );
};
