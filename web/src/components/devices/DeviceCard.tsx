import React, { useState } from 'react';
import {
  Cpu,
  Power,
  Trash2,
  Plus,
  Terminal,
  Clock,
  Radio,
  Sliders,
  CheckCircle2,
  XCircle,
  Wifi,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Device } from '../../types';
import { useHome } from '../../context/HomeContext';
import { devicesApi } from '../../api/devices';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { AddRelayModal } from './AddRelayModal';
import { formatRelativeTime, cn } from '../../lib/utils';

export interface DeviceCardProps {
  device: Device;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device }) => {
  const { isOwnerOrAdmin, refreshHomeDetails, toggleRelayChannel, rooms } = useHome();
  const [showAddRelay, setShowAddRelay] = useState(false);
  const [showCommandModal, setShowCommandModal] = useState(false);
  const [commandName, setCommandName] = useState('power');
  const [commandValue, setCommandValue] = useState('on');
  const [commandLoading, setCommandLoading] = useState(false);
  const [commandResult, setCommandResult] = useState<string | null>(null);

  const room = rooms.find((r) => r.id === device.room_id);
  const isOnline = device.status === 'online';

  const isAirSensor =
    device.device_type === 'sensor' ||
    device.name.toLowerCase().includes('không khí') ||
    device.name.toLowerCase().includes('air') ||
    device.device_uid.includes('58332');

  const handleDelete = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa thiết bị "${device.name}"?`)) return;
    try {
      await devicesApi.deleteDevice(device.id);
      await refreshHomeDetails();
    } catch (err: any) {
      alert(err.message || 'Không thể xóa thiết bị');
    }
  };

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommandLoading(true);
    setCommandResult(null);
    try {
      let parsedValue: any = commandValue;
      try {
        parsedValue = JSON.parse(commandValue);
      } catch {
        // use string if not valid json
      }
      await devicesApi.sendCommand(device.id, commandName, parsedValue);
      setCommandResult('Lệnh đã phát thành công lên MQTT Topic!');
      setTimeout(() => setShowCommandModal(false), 1200);
    } catch (err: any) {
      setCommandResult(`Lỗi: ${err.message}`);
    } finally {
      setCommandLoading(false);
    }
  };

  return (
    <>
      <div className="glass-card rounded-3xl p-5 hover:border-slate-700/80 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
        {/* Ambient indicator */}
        <div
          className={cn(
            'absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-10 pointer-events-none transition-all',
            isOnline ? 'bg-emerald-500' : 'bg-slate-700'
          )}
        />

        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'h-12 w-12 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-105',
                  isOnline
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-800 text-slate-500 border-slate-700'
                )}
              >
                <Cpu size={22} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors">
                  {device.name}
                </h4>
                <p className="text-[11px] font-mono text-cyan-400 truncate max-w-[150px]">
                  {device.device_uid}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'text-[10px] px-2.5 py-1 rounded-full font-bold border flex items-center gap-1.5 shadow-sm',
                  isOnline
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  )}
                />
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Details & Room Tag */}
          <div className="py-3 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/60">
            <span className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl text-slate-300 font-medium">
              {room?.name || 'Chưa gán phòng'}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
              <Clock size={12} className="text-slate-500" />
              {formatRelativeTime(device.last_seen)}
            </span>
          </div>

          {/* Hardware Sensors chipset info */}
          {isAirSensor && (
            <div className="py-2.5 border-b border-slate-800/60 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-semibold text-slate-400">Chipset I2C:</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                SHT31
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                SCD41 NDIR
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                SGP41 VOC
              </span>
            </div>
          )}

          {/* Relay Channels section */}
          <div className="py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Power size={13} className="text-amber-400" />
                Kênh Relay ({device.relay_channels?.length || 0})
              </span>
              {isOwnerOrAdmin && (
                <button
                  onClick={() => setShowAddRelay(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 font-semibold transition-colors"
                >
                  <Plus size={13} />
                  Thêm kênh
                </button>
              )}
            </div>

            {device.relay_channels && device.relay_channels.length > 0 ? (
              <div className="space-y-2">
                {device.relay_channels.map((ch) => (
                  <div
                    key={ch.id}
                    className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="h-6 w-6 rounded-lg bg-slate-800 text-[10px] font-mono text-cyan-400 flex items-center justify-center font-bold border border-slate-700">
                        #{ch.channel}
                      </span>
                      <span className="text-xs text-slate-200 font-semibold">{ch.name}</span>
                    </div>
                    <Switch
                      size="sm"
                      checked={ch.state}
                      onChange={() => toggleRelayChannel(device.id, ch.id, ch.state)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-1">Chưa cấu hình kênh relay</p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowCommandModal(true)}
            className="text-xs flex-1 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800"
          >
            <Terminal size={13} className="text-cyan-400" />
            Lệnh MQTT
          </Button>

          {isOwnerOrAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-2 rounded-xl"
              title="Xóa thiết bị"
            >
              <Trash2 size={15} />
            </Button>
          )}
        </div>
      </div>

      {/* Add Relay Modal */}
      {showAddRelay && (
        <AddRelayModal
          isOpen={showAddRelay}
          onClose={() => setShowAddRelay(false)}
          deviceId={device.id}
          existingChannels={device.relay_channels?.map((c) => c.channel) || []}
        />
      )}

      {/* Send Command Modal */}
      {showCommandModal && (
        <Modal
          isOpen={showCommandModal}
          onClose={() => setShowCommandModal(false)}
          title={`Gửi Lệnh MQTT tới ${device.name}`}
          description={`Topic: home/${device.home_id}/device/${device.id}/command`}
        >
          <form onSubmit={handleSendCommand} className="space-y-4">
            {commandResult && (
              <div
                className={cn(
                  'p-3 rounded-2xl text-xs font-semibold',
                  commandResult.startsWith('Lỗi')
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                )}
              >
                {commandResult}
              </div>
            )}

            <Input
              label="Tên Lệnh (Command field)"
              value={commandName}
              onChange={(e) => setCommandName(e.target.value)}
              placeholder="power, toggle, restart, ir, clean"
              required
            />

            <Input
              label="Giá trị (Value field / JSON)"
              value={commandValue}
              onChange={(e) => setCommandValue(e.target.value)}
              placeholder="on, off, 1, 2, or json payload"
              required
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCommandModal(false)}
                disabled={commandLoading}
              >
                Đóng
              </Button>
              <Button type="submit" variant="primary" loading={commandLoading}>
                Gửi Lệnh Ngay
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};
