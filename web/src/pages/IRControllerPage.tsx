import React, { useState } from 'react';
import { useHome } from '../context/HomeContext';
import { IRDevice } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Radio, Tv, Wind, Fan, Plus, Play, Cpu } from 'lucide-react';
import { AddIRDeviceModal } from '../components/ir/AddIRDeviceModal';
import { IRRemoteModal } from '../components/ir/IRRemoteModal';

export const IRControllerPage: React.FC = () => {
  const { devices, isOwnerOrAdmin } = useHome();
  const [showAddIRModal, setShowAddIRModal] = useState(false);
  const [activeRemoteDevice, setActiveRemoteDevice] = useState<IRDevice | null>(null);

  // Flatten all IR devices with parent device info
  const allIRDevices: Array<{ ir: IRDevice; parentDeviceName: string }> = [];
  devices.forEach((dev) => {
    dev.ir_devices?.forEach((ir) => {
      allIRDevices.push({
        ir,
        parentDeviceName: dev.name,
      });
    });
  });

  const getIcon = (type: string) => {
    switch (type) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">Điều Khiển Hồng Ngoại (IR Remotes)</h3>
          <p className="text-xs text-slate-400">
            Quản lý và phát lệnh điều khiển TV, Máy lạnh, Quạt từ xa qua ESP32
          </p>
        </div>

        {isOwnerOrAdmin && (
          <Button variant="primary" size="sm" onClick={() => setShowAddIRModal(true)}>
            <Plus size={14} />
            Thêm Remote Mới
          </Button>
        )}
      </div>

      {/* IR Device Cards Grid */}
      {allIRDevices.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
          <Radio size={36} className="mx-auto mb-2 opacity-50 text-slate-400" />
          <p className="text-sm font-medium">Chưa có thiết bị hồng ngoại nào được tạo.</p>
          {isOwnerOrAdmin && (
            <p className="text-xs text-slate-600 mt-1">
              Bấm nút "Thêm Remote Mới" để gán remote TV, điều hòa vào mắt phát ESP32.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allIRDevices.map(({ ir, parentDeviceName }) => {
            const Icon = getIcon(ir.target_type);
            return (
              <Card
                key={ir.id}
                className="hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                        <Icon size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-100">{ir.name}</h4>
                        <p className="text-[11px] text-slate-400">
                          {ir.brand ? ir.brand.toUpperCase() : 'Generic'} • {ir.target_type.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="info" className="text-[10px]">
                      Pin #{ir.emitter_pin || 1}
                    </Badge>
                  </div>

                  <div className="py-3 flex items-center gap-2 text-xs text-slate-400">
                    <Cpu size={13} className="text-slate-500" />
                    <span>Bộ phát:</span>
                    <span className="text-slate-200 font-medium">{parentDeviceName}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => setActiveRemoteDevice(ir)}
                  >
                    <Play size={13} className="fill-current" />
                    Mở Remote Điều Khiển
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add IR Device Modal */}
      {showAddIRModal && (
        <AddIRDeviceModal
          isOpen={showAddIRModal}
          onClose={() => setShowAddIRModal(false)}
        />
      )}

      {/* Virtual Remote Control Modal */}
      {activeRemoteDevice && (
        <IRRemoteModal
          isOpen={!!activeRemoteDevice}
          onClose={() => setActiveRemoteDevice(null)}
          irDevice={activeRemoteDevice}
        />
      )}
    </div>
  );
};
