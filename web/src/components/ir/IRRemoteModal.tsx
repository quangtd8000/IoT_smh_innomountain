import React, { useState, useEffect } from 'react';
import {
  Power,
  Volume2,
  VolumeX,
  Volume1,
  ChevronUp,
  ChevronDown,
  Tv,
  Wind,
  Fan,
  Radio,
  Plus,
  Send,
  Zap,
} from 'lucide-react';
import { IRDevice, IRCommand } from '../../types';
import { devicesApi } from '../../api/devices';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Notice } from '../ui/Notice';
import { AddIRCommandModal } from './AddIRCommandModal';

export interface IRRemoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  irDevice: IRDevice;
}

export const IRRemoteModal: React.FC<IRRemoteModalProps> = ({
  isOpen,
  onClose,
  irDevice,
}) => {
  const [commands, setCommands] = useState<IRCommand[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [showAddCommand, setShowAddCommand] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadCommands = async () => {
    setLoading(true);
    try {
      const data = await devicesApi.getIRCommands(irDevice.id);
      setCommands(data);
    } catch (err: any) {
      console.error('Error fetching IR commands:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCommands();
    }
  }, [isOpen, irDevice.id]);

  const handleSendCommand = async (cmd: IRCommand) => {
    setSendingId(cmd.id);
    setStatusMessage(null);
    try {
      await devicesApi.sendIRCommand(cmd.id);
      setStatusMessage(`Đã phát lệnh IR: "${cmd.name}"`);
      setTimeout(() => setStatusMessage(null), 2000);
    } catch (err: any) {
      setStatusMessage(`Lỗi phát lệnh: ${err.message}`);
    } finally {
      setSendingId(null);
    }
  };

  const getDeviceIcon = () => {
    switch (irDevice.target_type) {
      case 'tv':
        return Tv;
      case 'air_conditioner':
        return Wind;
      case 'fan':
        return Fan;
      default:
        return Radio;
    }
  };
  const Icon = getDeviceIcon();

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Điều Khiển: ${irDevice.name}`}
        description={irDevice.brand ? `${irDevice.brand} · ${irDevice.target_type === 'tv' ? 'Tivi' : irDevice.target_type === 'air_conditioner' ? 'Điều hoà' : irDevice.target_type === 'fan' ? 'Quạt' : 'Thiết bị khác'}` : (irDevice.target_type === 'tv' ? 'Tivi' : irDevice.target_type === 'air_conditioner' ? 'Điều hoà' : irDevice.target_type === 'fan' ? 'Quạt' : 'Thiết bị khác')}
        maxWidth="md"
      >
        <div className="space-y-5">
          {statusMessage && <Notice tone="info">{statusMessage}</Notice>}

          <div className="plate p-4">
            <div className="flex items-center gap-2 pb-3 border-b border-line">
              <Icon size={18} strokeWidth={1.75} className="text-ink-2" aria-hidden="true" />
              <span className="text-sm text-ink truncate">{irDevice.name}</span>
            </div>

            {/* Nút nguồn tách riêng vì đó là nút hay dùng nhất */}
            {commands.find((c) => c.name.toLowerCase().includes('power')) && (
              <div className="flex justify-center py-4 border-b border-line">
                {(() => {
                  const pwrCmd = commands.find((c) => c.name.toLowerCase().includes('power'))!;
                  return (
                    <button
                      onClick={() => handleSendCommand(pwrCmd)}
                      disabled={sendingId === pwrCmd.id}
                      aria-label="Bật hoặc tắt nguồn"
                      title="Bật hoặc tắt nguồn"
                      className="h-14 w-14 rounded-full border border-line bg-sunken text-ink flex items-center justify-center transition-colors hover:bg-ink hover:text-ground disabled:opacity-45"
                    >
                      <Power size={22} />
                    </button>
                  );
                })()}
              </div>
            )}

            <div className="pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-ink-2">Nút lệnh</span>
                <button
                  onClick={() => setShowAddCommand(true)}
                  className="text-sm text-ink-2 hover:text-ink flex items-center gap-1 transition-colors"
                >
                  <Plus size={13} aria-hidden="true" />
                  Thêm lệnh
                </button>
              </div>

              {commands.length === 0 ? (
                <p className="py-4 text-sm text-ink-2">
                  {loading ? 'Đang tải' : 'Remote này chưa có lệnh nào.'}
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto">
                  {commands.map((cmd) => {
                    const isSending = sendingId === cmd.id;
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => handleSendCommand(cmd)}
                        disabled={isSending}
                        className="min-h-14 px-2 py-2 bg-surface border border-line rounded-md text-sm text-ink flex flex-col items-center justify-center gap-0.5 transition-colors hover:bg-sunken disabled:opacity-45"
                      >
                        <span className="truncate max-w-full">{cmd.name}</span>
                        {/* Chỉ hiện giao thức khi thực sự có, không mặc định NEC */}
                        {cmd.protocol && (
                          <span className="text-xs text-ink-2 truncate">{cmd.protocol}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add IR Command Modal */}
      {showAddCommand && (
        <AddIRCommandModal
          isOpen={showAddCommand}
          onClose={() => setShowAddCommand(false)}
          irDeviceId={irDevice.id}
          onSuccess={loadCommands}
        />
      )}
    </>
  );
};
