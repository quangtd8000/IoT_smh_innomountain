import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Device } from '../../types';
import { useHome } from '../../context/HomeContext';
import { devicesApi } from '../../api/devices';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Notice } from '../ui/Notice';
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
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const room = rooms.find((r) => r.id === device.room_id);
  const isOnline = device.status === 'online';

  const handleDelete = async () => {
    if (!window.confirm(`Xoá thiết bị “${device.name}”? Không khôi phục lại được.`)) return;
    setDeleteError(null);
    try {
      await devicesApi.deleteDevice(device.id);
      await refreshHomeDetails();
    } catch (err: any) {
      setDeleteError(err.message || 'Không xoá được thiết bị.');
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
        // Không phải JSON thì gửi nguyên chuỗi
      }
      await devicesApi.sendCommand(device.id, commandName, parsedValue);
      setCommandResult('Đã gửi lệnh.');
      setTimeout(() => setShowCommandModal(false), 1200);
    } catch (err: any) {
      setCommandResult(`Lỗi: ${err.message}`);
    } finally {
      setCommandLoading(false);
    }
  };

  return (
    <>
      <div className="plate flex flex-col p-0">
        <div className="px-4 py-3 border-b border-line">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-ink truncate">{device.name}</h3>
              <p className="text-xs text-ink-2 truncate">{device.device_uid}</p>
            </div>
            {/* Trạng thái nói bằng chữ, không bằng màu — giữ bảng màu kỷ luật */}
            <span className="flex items-center gap-1.5 text-xs flex-shrink-0">
              <span
                aria-hidden="true"
                className={cn('h-1.5 w-1.5 rounded-full', isOnline ? 'bg-ink' : 'bg-ink-2/40')}
              />
              <span className={isOnline ? 'text-ink' : 'text-ink-2'}>
                {isOnline ? 'Trực tuyến' : 'Mất kết nối'}
              </span>
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-2">
            {room?.name || 'Chưa gán phòng'} · {formatRelativeTime(device.last_seen)}
          </p>
        </div>

        <div className="px-4 py-3 border-b border-line flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-ink-2">
              Kênh relay ({device.relay_channels?.length || 0})
            </span>
            {isOwnerOrAdmin && (
              <button
                onClick={() => setShowAddRelay(true)}
                className="text-xs text-ink-2 hover:text-ink flex items-center gap-1 transition-colors"
              >
                <Plus size={13} aria-hidden="true" />
                Thêm kênh
              </button>
            )}
          </div>

          {device.relay_channels && device.relay_channels.length > 0 ? (
            <ul className="space-y-1">
              {device.relay_channels.map((ch) => (
                <li key={ch.id} className="flex items-center justify-between gap-3 py-1.5">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-ink-2 tnum w-4 flex-shrink-0">{ch.channel}</span>
                    <span className="text-sm text-ink truncate">{ch.name}</span>
                  </span>
                  <Switch
                    size="sm"
                    checked={ch.state}
                    aria-label={ch.name}
                    onChange={() => toggleRelayChannel(device.id, ch.id, ch.state)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-2">Chưa có kênh nào.</p>
          )}
        </div>

        {deleteError && (
          <div className="px-4 pt-3">
            <Notice tone="error">{deleteError}</Notice>
          </div>
        )}

        <div className="px-4 py-3 flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowCommandModal(true)} className="flex-1">
            Gửi lệnh
          </Button>

          {isOwnerOrAdmin && (
            <Button variant="ghost" size="sm" onClick={handleDelete} aria-label="Xoá thiết bị" title="Xoá thiết bị">
              <Trash2 size={15} />
            </Button>
          )}
        </div>
      </div>

      {showAddRelay && (
        <AddRelayModal
          isOpen={showAddRelay}
          onClose={() => setShowAddRelay(false)}
          deviceId={device.id}
          existingChannels={device.relay_channels?.map((c) => c.channel) || []}
        />
      )}

      {showCommandModal && (
        <Modal
          isOpen={showCommandModal}
          onClose={() => setShowCommandModal(false)}
          title={`Gửi lệnh tới ${device.name}`}
          description={`home/${device.home_id}/device/${device.id}/command`}
        >
          <form onSubmit={handleSendCommand} className="space-y-4">
            {commandResult && (
              <Notice tone={commandResult.startsWith('Lỗi') ? 'error' : 'success'}>
                {commandResult}
              </Notice>
            )}

            <Input
              label="Lệnh"
              value={commandName}
              onChange={(e) => setCommandName(e.target.value)}
              placeholder="power"
              helper="Ví dụ: power, toggle, restart, ir, clean"
              required
            />

            <Input
              label="Giá trị"
              value={commandValue}
              onChange={(e) => setCommandValue(e.target.value)}
              placeholder="on"
              helper="Chuỗi hoặc JSON. Ví dụ: on, off, 1, {&quot;ch&quot;:2}"
              required
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCommandModal(false)}
                disabled={commandLoading}
              >
                Huỷ
              </Button>
              <Button type="submit" variant="primary" loading={commandLoading}>
                Gửi lệnh
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};
