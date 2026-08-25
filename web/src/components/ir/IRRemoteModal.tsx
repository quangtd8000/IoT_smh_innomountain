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
        description={`${irDevice.brand ? irDevice.brand.toUpperCase() : ''} (${irDevice.target_type.toUpperCase()}) - Mắt phát #${irDevice.emitter_pin || 1}`}
        maxWidth="md"
      >
        <div className="space-y-5">
          {/* Status feedback */}
          {statusMessage && (
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-xs text-center font-medium animate-in fade-in">
              {statusMessage}
            </div>
          )}

          {/* Quick Virtual Remote Grid */}
          <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-inner flex flex-col items-center gap-4">
            <div className="flex items-center justify-between w-full pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2 text-slate-300">
                <Icon size={18} className="text-blue-400" />
                <span className="text-xs font-semibold">{irDevice.name}</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                IR Ready
              </span>
            </div>

            {/* TV Layout or AC Layout or Dynamic Commands */}
            <div className="w-full space-y-3">
              {/* Power Button */}
              {commands.find((c) => c.name.toLowerCase().includes('power')) && (
                <div className="flex justify-center">
                  {(() => {
                    const pwrCmd = commands.find((c) => c.name.toLowerCase().includes('power'))!;
                    return (
                      <button
                        onClick={() => handleSendCommand(pwrCmd)}
                        disabled={sendingId === pwrCmd.id}
                        className="h-14 w-14 rounded-full bg-rose-600/20 text-rose-400 border border-rose-500/40 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-all shadow-lg shadow-rose-600/20 active:scale-95 disabled:opacity-50"
                        title="Bật / Tắt nguồn"
                      >
                        <Power size={24} />
                      </button>
                    );
                  })()}
                </div>
              )}

              {/* All Saved Commands List */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400">Danh Sách Nút Lệnh</span>
                  <button
                    onClick={() => setShowAddCommand(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                  >
                    <Plus size={13} />
                    Học/Thêm lệnh mới
                  </button>
                </div>

                {commands.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    {loading ? 'Đang tải danh sách lệnh...' : 'Chưa có lệnh nào được lưu cho remote này.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                    {commands.map((cmd) => {
                      const isSending = sendingId === cmd.id;
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => handleSendCommand(cmd)}
                          disabled={isSending}
                          className="p-3 bg-slate-900 hover:bg-blue-600/20 hover:border-blue-500/40 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                        >
                          <Zap size={14} className={isSending ? 'text-amber-400 animate-bounce' : 'text-blue-400'} />
                          <span className="truncate max-w-[100px]">{cmd.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {cmd.protocol || 'NEC'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
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
