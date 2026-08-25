import React, { useState } from 'react';
import { useHome } from '../../context/HomeContext';
import { devicesApi } from '../../api/devices';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { QrCode, Cpu, Sparkles, Check, Camera, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({ isOpen, onClose }) => {
  const { activeHome, rooms, refreshHomeDetails } = useHome();
  const [tab, setTab] = useState<'manual' | 'qr'>('qr');
  const [name, setName] = useState('');
  const [deviceUid, setDeviceUid] = useState('');
  const [deviceType, setDeviceType] = useState('sensor');
  const [roomId, setRoomId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrScanning, setQrScanning] = useState(false);

  const simulateQrScan = () => {
    setQrScanning(true);
    setTimeout(() => {
      setDeviceUid('esp32-node-58332');
      setName('Node Cảm Biến Không Khí Thông Minh');
      setDeviceType('sensor');
      setQrScanning(false);
      setTab('manual');
    }, 1200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHome) return;
    if (!name.trim() || !deviceUid.trim()) {
      setError('Vui lòng nhập đầy đủ tên và Device UID (Mã phần cứng)');
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
      setError(err.message || 'Không thể đăng ký thiết bị');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Đăng Ký & Ghép Nối Thiết Bị Mới"
      description="Kết nối phần cứng ESP32 hoặc bộ cảm biến thông minh vào ngôi nhà của bạn"
    >
      <div className="space-y-4">
        {/* Method Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setTab('qr')}
            className={cn(
              'flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2',
              tab === 'qr'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <QrCode size={14} />
            Quét Mã QR / Serial (Mô Hình 2)
          </button>
          <button
            type="button"
            onClick={() => setTab('manual')}
            className={cn(
              'flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2',
              tab === 'manual'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Cpu size={14} />
            Nhập Thủ Công
          </button>
        </div>

        {tab === 'qr' ? (
          <div className="p-6 bg-slate-950/60 rounded-3xl border border-slate-800 text-center space-y-4">
            <div className="relative w-40 h-40 mx-auto rounded-2xl border-2 border-dashed border-cyan-500/40 p-3 flex flex-col items-center justify-center bg-slate-900/60 overflow-hidden group">
              <QrCode size={72} className="text-cyan-400 opacity-80" />
              {qrScanning && (
                <div className="absolute inset-x-0 h-1 bg-cyan-400 animate-bounce shadow-lg shadow-cyan-400" />
              )}
            </div>

            <div>
              <h5 className="text-sm font-bold text-slate-100">Quét Mã QR In Trên Thân Thiết Bị</h5>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Mỗi thiết bị IoT xuất xưởng đều có mã QR định danh duy nhất chứa Serial và loại cảm biến.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={simulateQrScan}
              disabled={qrScanning}
              className="w-full rounded-2xl shadow-lg shadow-blue-600/25"
            >
              <Camera size={16} />
              {qrScanning ? 'Đang nhận diện mã QR...' : 'Quét Mã QR Thiết Bị Tự Động'}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            <Input
              label="Tên thiết bị hiển thị"
              placeholder="VD: Node Cảm Biến Không Khí Phòng Khách"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Device UID (Mã phần cứng / Serial)"
              placeholder="VD: esp32-node-58332"
              value={deviceUid}
              onChange={(e) => setDeviceUid(e.target.value)}
              helper="Khớp với mã DEVICE_UID được nạp trong Firmware ESP32"
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Loại thiết bị</label>
              <select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="sensor">Cụm cảm biến môi trường (Air Sensor)</option>
                <option value="controller">Bộ điều khiển tổng hợp (Controller)</option>
                <option value="relay">Module Relay công tắc (Relay Switch)</option>
                <option value="ir">Bộ phát hồng ngoại IR (IR Blaster)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Gán vào phòng</label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="">-- Chưa gán phòng --</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <Button type="button" variant="secondary" onClick={onClose} disabled={loading} className="rounded-2xl">
                Hủy
              </Button>
              <Button type="submit" variant="primary" loading={loading} className="rounded-2xl shadow-lg shadow-blue-600/30">
                Đăng Ký Thiết Bị Ngay
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
