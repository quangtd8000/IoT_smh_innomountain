import React, { useState } from 'react';
import { devicesApi } from '../../api/devices';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export interface AddIRCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  irDeviceId: number;
  onSuccess?: () => void;
}

export const AddIRCommandModal: React.FC<AddIRCommandModalProps> = ({
  isOpen,
  onClose,
  irDeviceId,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [protocol, setProtocol] = useState('NEC');
  const [address, setAddress] = useState<string>('');
  const [command, setCommand] = useState<string>('');
  const [bits, setBits] = useState<number>(32);
  const [repeats, setRepeats] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên nút lệnh (VD: power, vol_up, mode)');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await devicesApi.addIRCommand(irDeviceId, {
        name: name.trim().toLowerCase().replace(/\s+/g, '_'),
        protocol,
        address: address ? Number(address) : undefined,
        command: command ? Number(command) : undefined,
        bits: Number(bits),
        repeats: Number(repeats),
      });
      setName('');
      setAddress('');
      setCommand('');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể tạo lệnh IR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm Mã Lệnh Hồng Ngoại"
      description="Lưu thông số phát xung IR (Protocol, Address, Command Code)"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
            {error}
          </div>
        )}

        <Input
          label="Tên nút lệnh"
          placeholder="power, vol_up, vol_down, temp_up, mode_cool..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">Giao thức (Protocol)</label>
            <select
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="NEC">NEC (Phổ biến nhất)</option>
              <option value="SONY">SONY</option>
              <option value="RC5">RC5 (Philips)</option>
              <option value="RC6">RC6</option>
              <option value="PANASONIC">PANASONIC</option>
              <option value="SAMSUNG">SAMSUNG</option>
              <option value="RAW">RAW Timing</option>
            </select>
          </div>

          <Input
            label="Số bits (Bits)"
            type="number"
            value={bits}
            onChange={(e) => setBits(Number(e.target.value))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Mã Address (Hex/Dec)"
            placeholder="VD: 0 hoặc 128"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <Input
            label="Mã Command (Hex/Dec)"
            placeholder="VD: 64 hoặc 0x40"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
          />
        </div>

        <Input
          label="Số lần phát lặp lại (Repeats)"
          type="number"
          min="1"
          max="10"
          value={repeats}
          onChange={(e) => setRepeats(Number(e.target.value))}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Lưu Mã Lệnh
          </Button>
        </div>
      </form>
    </Modal>
  );
};
