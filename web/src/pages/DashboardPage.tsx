import React, { useState, useEffect } from 'react';
import { Tv, AirVent, Fan, Radio } from 'lucide-react';
import { SwitchPlate } from '../components/dashboard/SwitchPlate';
import { SensorChart } from '../components/dashboard/SensorChart';
import { AirQualityGauge } from '../components/dashboard/AirQualityGauge';
import { QuickSceneBar } from '../components/dashboard/QuickSceneBar';
import { IRRemoteModal } from '../components/ir/IRRemoteModal';
import { useHome } from '../context/HomeContext';
import { Button } from '../components/ui/Button';
import { telemetryApi } from '../api/telemetry';
import { SensorData, IRDevice } from '../types';
import { roomTone } from '../lib/roomTone';
import { cn } from '../lib/utils';

export interface DashboardPageProps {
  onOpenCreateHome: () => void;
  onOpenAddDevice: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenCreateHome }) => {
  const { homes, devices, rooms, isLoading } = useHome();
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<number | 'all'>('all');
  const [latestTelemetry, setLatestTelemetry] = useState<SensorData | null>(null);
  const [activeRemoteDevice, setActiveRemoteDevice] = useState<IRDevice | null>(null);

  // Tìm node cảm biến tương ứng với phòng đang chọn hoặc node chính
  const sensorDevice =
    selectedRoomFilter === 'all'
      ? devices.find((d) => d.device_type === 'sensor' || d.name.toLowerCase().includes('không khí') || d.device_uid.includes('node')) || devices[0]
      : devices.find((d) => d.room_id === selectedRoomFilter && (d.device_type === 'sensor' || d.device_uid.includes('node'))) ||
        devices.find((d) => d.device_type === 'sensor' || d.device_uid.includes('node')) ||
        devices[0];

  const selectedRoom = rooms.find((r) => r.id === selectedRoomFilter);
  const isRoomSpecificSensor = selectedRoomFilter !== 'all' && sensorDevice?.room_id === selectedRoomFilter;

  // Lấy danh sách remote hồng ngoại theo phòng
  const allIRDevices: Array<{ ir: IRDevice; parentName: string; roomId?: number | null }> = [];
  devices.forEach((dev) => {
    dev.ir_devices?.forEach((ir) => {
      allIRDevices.push({ ir, parentName: dev.name, roomId: dev.room_id });
    });
  });

  const filteredIRDevices =
    selectedRoomFilter === 'all'
      ? allIRDevices
      : allIRDevices.filter((item) => item.roomId === selectedRoomFilter);

  // Polling dữ liệu cảm biến mỗi 4 giây
  useEffect(() => {
    if (sensorDevice) {
      const fetchLatest = async () => {
        try {
          const list = await telemetryApi.getTelemetry(sensorDevice.id, { limit: 1 });
          if (list && list.length > 0) {
            setLatestTelemetry(list[0]);
          }
        } catch (e) {
          console.error('Error fetching latest telemetry for gauge:', e);
        }
      };

      fetchLatest();
      const timer = setInterval(fetchLatest, 4000);
      return () => clearInterval(timer);
    }
  }, [sensorDevice?.id]);

  if (isLoading) {
    return <p className="text-sm text-ink-2">Đang tải...</p>;
  }

  if (homes.length === 0) {
    return (
      <div className="max-w-sm">
        <h2 className="font-display text-xl font-semibold text-ink">Chưa có ngôi nhà nào</h2>
        <p className="mt-2 text-sm text-ink-2">
          Tạo một ngôi nhà để bắt đầu thêm phòng, công tắc và cảm biến.
        </p>
        <Button variant="primary" onClick={onOpenCreateHome} className="mt-4">
          Tạo ngôi nhà
        </Button>
      </div>
    );
  }

  const getIRIcon = (type: string) => {
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

  const tabClass = (isActive: boolean) =>
    cn(
      'min-h-9 px-3 rounded-md text-sm whitespace-nowrap flex items-center gap-2',
      'transition-colors duration-150',
      isActive ? 'bg-sunken text-ink font-medium shadow-sm' : 'text-ink-2 hover:bg-sunken hover:text-ink'
    );

  return (
    <div className="space-y-7 max-w-6xl">
      {/* 1. Thanh chuyển đổi giữa các phòng trong nhà */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-line">
        <button
          onClick={() => setSelectedRoomFilter('all')}
          className={tabClass(selectedRoomFilter === 'all')}
        >
          <span>Tất cả phòng</span>
        </button>

        {rooms.map((r) => {
          const isSelected = selectedRoomFilter === r.id;
          const tone = roomTone(r.name);
          const Icon = tone.icon;
          const roomRelayCount = devices
            .filter((d) => d.room_id === r.id)
            .reduce((sum, d) => sum + (d.relay_channels?.length || 0), 0);

          return (
            <button
              key={r.id}
              onClick={() => setSelectedRoomFilter(r.id)}
              className={tabClass(isSelected)}
              style={{ ['--tone' as string]: tone.rgb } as React.CSSProperties}
            >
              <Icon size={15} strokeWidth={1.75} aria-hidden="true" style={{ color: 'rgb(var(--tone))' }} />
              <span>{r.name}</span>
              {roomRelayCount > 0 && (
                <span className="text-xs text-ink-2 tnum">({roomRelayCount})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Đo lường không khí phòng */}
      <AirQualityGauge
        telemetry={latestTelemetry}
        deviceName={
          selectedRoomFilter === 'all'
            ? 'Toàn ngôi nhà'
            : isRoomSpecificSensor
            ? `${selectedRoom?.name} · Cảm biến phòng`
            : `${selectedRoom?.name} (Dữ liệu chung)`
        }
      />

      {/* 4. Mặt bảng công tắc theo phòng */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-ink-2">
            Công tắc {selectedRoom ? `· ${selectedRoom.name}` : ''}
          </h2>
        </div>
        <SwitchPlate selectedRoomId={selectedRoomFilter} />
      </section>

      {/* 5. Điều khiển thiết bị phòng (TV, Điều hoà, Quạt) */}
      {filteredIRDevices.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-ink-2">
              Điều khiển {selectedRoom ? `· ${selectedRoom.name}` : ''}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredIRDevices.map(({ ir }) => {
              const Icon = getIRIcon(ir.target_type);
              return (
                <button
                  key={ir.id}
                  type="button"
                  onClick={() => setActiveRemoteDevice(ir)}
                  className="plate p-3.5 flex items-center gap-3 text-left hover:bg-sunken transition-colors group"
                >
                  <div className="p-2 rounded-md bg-ink/5 text-ink group-hover:scale-105 transition-transform flex-shrink-0">
                    <Icon size={20} strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">{ir.name}</p>
                    <p className="text-xs text-ink-2 truncate">
                      {ir.brand || 'Remote'} · Bấm để điều khiển
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. Kịch bản nhanh */}
      <section>
        <QuickSceneBar />
      </section>

      {/* 7. Biểu đồ môi trường */}
      <section>
        <SensorChart selectedRoomId={selectedRoomFilter} />
      </section>

      {/* Modal điều khiển Remote IR */}
      {activeRemoteDevice && (
        <IRRemoteModal
          isOpen={activeRemoteDevice !== null}
          onClose={() => setActiveRemoteDevice(null)}
          irDevice={activeRemoteDevice}
        />
      )}
    </div>
  );
};
