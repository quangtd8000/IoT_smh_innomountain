import React, { useState } from 'react';
import { Bluetooth, Wifi, CheckCircle2, AlertCircle, Loader2, Sparkles, Server } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Notice } from '../ui/Notice';
import { BleProvisioner, isWebBluetoothSupported, BleStatusPayload } from '../../lib/bleProvisioning';
import { useHome } from '../../context/HomeContext';
import { devicesApi } from '../../api/devices';

export interface BlePairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BlePairingModal: React.FC<BlePairingModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { activeHome, rooms, refreshHomeDetails } = useHome();
  const [step, setStep] = useState<'scan' | 'config' | 'pairing' | 'success'>('scan');
  const [bleProvisioner] = useState(() => new BleProvisioner());
  const [deviceName, setDeviceName] = useState<string>('');
  
  // Thông tin Wi-Fi & Máy chủ
  const [ssid, setSsid] = useState('Xuan Bach');
  const [wifiPass, setWifiPass] = useState('0936265558');
  const [brokerIp, setBrokerIp] = useState('192.168.1.35');
  
  // Thông tin gán phòng & tên thiết bị
  const [displayName, setDisplayName] = useState('');
  const [roomId, setRoomId] = useState<string>('');
  
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [detectedUid, setDetectedUid] = useState<string>('');
  const [assignedIp, setAssignedIp] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isBleSupported = isWebBluetoothSupported();

  const handleScan = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await bleProvisioner.scanDevice();
      setDeviceName(res.name);
      
      // Gợi ý tên thân thiện và UID theo tên Bluetooth của ESP32
      if (res.name.includes('Air')) {
        setDisplayName('Cảm biến không khí');
      } else if (res.name.includes('Relay')) {
        setDisplayName('Công tắc relay');
      } else {
        setDisplayName(res.name);
      }
      
      setStep('config');
    } catch (err: any) {
      setError(err.message || 'Không thể quét thiết bị Bluetooth.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartProvisioning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ssid.trim()) {
      setError('Vui lòng nhập tên Wi-Fi (SSID).');
      return;
    }

    setError(null);
    setStep('pairing');
    setStatusMsg('Đang kết nối Bluetooth với thiết bị...');

    try {
      const result = await bleProvisioner.connectAndSendConfig(
        {
          ssid: ssid.trim(),
          pass: wifiPass,
          broker: brokerIp.trim(),
          user: 'inno',
          pass_mqtt: 'inno123'
        },
        (payload: BleStatusPayload) => {
          if (payload.status === 'saving') {
            setStatusMsg('Đang lưu cấu hình vào Flash...');
          } else if (payload.status === 'connecting') {
            setStatusMsg('Thiết bị đang kết nối vào Wi-Fi...');
          } else if (payload.status === 'connected') {
            setStatusMsg('Đã kết nối Wi-Fi & máy chủ thành công!');
            if (payload.ip) setAssignedIp(payload.ip);
            if (payload.uid) setDetectedUid(payload.uid);
          }
        }
      );

      // Đăng ký thiết bị vào Backend Smart Home
      if (activeHome) {
        const finalUid = result.uid || detectedUid || deviceName.toLowerCase().replace('smarthome-', 'esp32-node-');
        const deviceType = deviceName.toLowerCase().includes('air') ? 'sensor' : 'relay';
        
        try {
          await devicesApi.registerDevice(activeHome.id, {
            name: displayName.trim() || deviceName,
            device_uid: finalUid,
            device_type: deviceType,
            room_id: roomId ? Number(roomId) : null,
          });
          await refreshHomeDetails();
        } catch (apiErr: any) {
          console.warn("[Register API error or already exists]", apiErr);
        }
      }

      setStep('success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Lỗi ghép nối Bluetooth với thiết bị.');
      setStep('config');
    }
  };

  const handleClose = () => {
    bleProvisioner.disconnect();
    setStep('scan');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Ghép nối thiết bị qua Bluetooth"
      description="Cài đặt Wi-Fi và ghép nối nhanh ESP32 vào ngôi nhà qua Web Bluetooth."
    >
      <div className="space-y-4">
        {!isBleSupported && (
          <Notice tone="error">
            Trình duyệt của bạn không hỗ trợ <strong>Web Bluetooth</strong>. Hãy sử dụng <strong>Google Chrome</strong> hoặc <strong>Microsoft Edge</strong> trên máy tính/điện thoại Android.
          </Notice>
        )}

        {error && <Notice tone="error">{error}</Notice>}

        {/* BƯỚC 1: Quét tìm thiết bị */}
        {step === 'scan' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto ring-8 ring-accent/5">
              <Bluetooth className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink">Tìm kiếm thiết bị xung quanh</h3>
              <p className="text-sm text-ink-2 max-w-sm mx-auto mt-1">
                Bật nguồn hoặc bấm nút <strong>Reset</strong> trên mạch ESP32, sau đó bấm nút bên dưới để chọn thiết bị.
              </p>
            </div>

            <Button
              onClick={handleScan}
              disabled={!isBleSupported || loading}
              className="w-full py-3 text-base font-semibold flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bluetooth className="w-5 h-5" />}
              {loading ? 'Đang mở tìm kiếm...' : '🔍 Quét thiết bị Bluetooth'}
            </Button>
          </div>
        )}

        {/* BƯỚC 2: Nhập thông tin Wi-Fi & Phòng */}
        {step === 'config' && (
          <form onSubmit={handleStartProvisioning} className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-sunken border border-line">
              <Bluetooth className="w-5 h-5 text-accent shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-ink-2">Đã chọn thiết bị Bluetooth</p>
                <p className="text-sm font-semibold text-ink truncate">{deviceName}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setStep('scan')}>
                Đổi
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Tên đặt cho thiết bị"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="VD: Cảm biến phòng khách"
                required
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-1.5">
                  Gán vào phòng
                </label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full min-h-11 px-3 bg-surface border border-line rounded-md text-ink text-sm"
                >
                  <option value="">-- Chưa gán phòng --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-line space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-2 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5" /> Thông tin Wi-Fi để mạch kết nối
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Tên Wi-Fi (SSID)"
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  placeholder="VD: Nhà Tôi 2.4G"
                  required
                />
                <Input
                  label="Mật khẩu Wi-Fi"
                  type="password"
                  value={wifiPass}
                  onChange={(e) => setWifiPass(e.target.value)}
                  placeholder="Mật khẩu Wi-Fi (nếu có)"
                />
              </div>

              <Input
                label="Địa chỉ máy chủ (IP Broker / Server)"
                value={brokerIp}
                onChange={(e) => setBrokerIp(e.target.value)}
                placeholder="VD: 192.168.1.35"
                helper="Mặc định là IP máy chủ Smart Home trong mạng LAN."
              />
            </div>

            <div className="flex gap-2 pt-3">
              <Button type="button" variant="outline" onClick={() => setStep('scan')} className="flex-1">
                Quay lại
              </Button>
              <Button type="submit" className="flex-1 font-semibold">
                Bắt đầu ghép nối ➔
              </Button>
            </div>
          </form>
        )}

        {/* BƯỚC 3: Đang ghép nối */}
        {step === 'pairing' && (
          <div className="text-center py-8 space-y-4">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-accent/20 animate-ping" />
              <div className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">Đang truyền cấu hình Wi-Fi</h3>
              <p className="text-sm text-ink-2 mt-1">{statusMsg || 'Vui lòng giữ thiết bị gần máy tính/điện thoại...'}</p>
            </div>
          </div>
        )}

        {/* BƯỚC 4: Ghép nối thành công */}
        {step === 'success' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink">Ghép nối thành công!</h3>
              <p className="text-sm text-ink-2 max-w-sm mx-auto mt-1">
                Thiết bị <strong>{displayName || deviceName}</strong> đã nhận cấu hình và kết nối thành công vào hệ thống.
              </p>
              {assignedIp && (
                <div className="inline-block mt-2 px-3 py-1 bg-sunken rounded text-xs font-mono text-ink-2 border border-line">
                  IP LAN: {assignedIp}
                </div>
              )}
            </div>

            <Button onClick={handleClose} className="w-full py-2.5 font-semibold">
              Hoàn tất
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
