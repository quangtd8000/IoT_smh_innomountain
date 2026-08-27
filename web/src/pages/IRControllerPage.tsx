import React, { useState } from 'react';
import { Tv, AirVent, Fan, Radio, Plus } from 'lucide-react';
import { useHome } from '../context/HomeContext';
import { IRDevice } from '../types';
import { Button } from '../components/ui/Button';
import { AddIRDeviceModal } from '../components/ir/AddIRDeviceModal';
import { IRRemoteModal } from '../components/ir/IRRemoteModal';

const TARGET_LABEL: Record<string, string> = {
  tv: 'TV',
  air_conditioner: 'Điều hoà',
  fan: 'Quạt',
  custom: 'Khác',
};

export const IRControllerPage: React.FC = () => {
  const { devices, isOwnerOrAdmin } = useHome();
  const [showAddIRModal, setShowAddIRModal] = useState(false);
  const [activeRemoteDevice, setActiveRemoteDevice] = useState<IRDevice | null>(null);

  const allIRDevices: Array<{ ir: IRDevice; parentDeviceName: string }> = [];
  devices.forEach((dev) => {
    dev.ir_devices?.forEach((ir) => {
      allIRDevices.push({ ir, parentDeviceName: dev.name });
    });
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'tv':
        return Tv;
      case 'air_conditioner':
        return AirVent;
      case 'fan':
        return Fan;
      default:
        return Radio;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-ink-2">
          Điều khiển TV, điều hoà và quạt qua mắt phát hồng ngoại.
        </p>

        {isOwnerOrAdmin && (
          <Button variant="primary" size="sm" onClick={() => setShowAddIRModal(true)}>
            <Plus size={14} aria-hidden="true" />
            Thêm remote
          </Button>
        )}
      </div>

      {allIRDevices.length === 0 ? (
        <div className="plate p-6">
          <p className="text-sm text-ink">Chưa có remote nào.</p>
          {isOwnerOrAdmin && (
            <p className="text-sm text-ink-2 mt-1">
              Bấm “Thêm remote” để thêm điều khiển cho TV, điều hoà hoặc quạt.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {allIRDevices.map(({ ir, parentDeviceName }) => {
            const Icon = getIcon(ir.target_type);
            return (
              <section key={ir.id} className="plate p-0 flex flex-col">
                <div className="px-4 py-3 border-b border-line flex items-start gap-3">
                  <Icon size={20} strokeWidth={1.75} className="text-ink-2 mt-0.5" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-ink truncate">{ir.name}</h3>
                    <p className="text-xs text-ink-2 truncate">
                      {ir.brand || 'Không rõ hãng'} · {TARGET_LABEL[ir.target_type] ?? ir.target_type}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-3 border-b border-line flex-1">
                  <p className="text-xs text-ink-2">Bộ phát tín hiệu</p>
                  <p className="text-sm text-ink truncate">{parentDeviceName}</p>
                </div>

                <div className="px-4 py-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => setActiveRemoteDevice(ir)}
                  >
                    Mở remote
                  </Button>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {showAddIRModal && (
        <AddIRDeviceModal isOpen={showAddIRModal} onClose={() => setShowAddIRModal(false)} />
      )}

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
