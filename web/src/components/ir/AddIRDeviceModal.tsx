import React, { useState } from 'react';
import { useHome } from '../../context/HomeContext';
import { devicesApi } from '../../api/devices';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

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
      setError('Vui lòng chọn thiết bị ESP32 và nhập tên thiết bị hồng ngoại');
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
      setError(err.message || 'Không thể tạo thiết bị IR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm Thiết Bị Hồng Ngoại (IR Remote)"
      description="Đăng ký TV, Điều hòa, Quạt để điều khiển qua mắt phát IR của ESP32"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">ESP32 phát hồng ngoại</label>
          <select
            value={selectedDevId}
            onChange={(e) => setSelectedDevId(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.device_uid})
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Tên thiết bị hiển thị"
          placeholder="VD: TV Samsung Phòng Khách, Điều hòa Daikin 12000BTU..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">Loại thiết bị</label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="tv">Tivi (TV)</option>
              <option value="air_conditioner">Điều hòa / Máy lạnh (AC)</option>
              <option value="fan">Quạt điện (Fan)</option>
              <option value="custom">Tùy biến khác (Custom)</option>
            </select>
          </div>

          <Input
            label="Hãng sản xuất (Brand)"
            placeholder="Samsung, LG, Daikin, Panasonic..."
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </div>

        <Input
          label="Chân mắt phát (Emitter Pin / Channel)"
          type="number"
          min="1"
          max="16"
          value={emitterPin}
          onChange={(e) => setEmitterPin(Number(e.target.value))}
          helper="Số thứ tự kênh mắt phát IR trên ESP32 (Mặc định 1)"
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Thêm Thiết Bị IR
          </Button>
        </div>
      </form>
    </Modal>
  );
};
