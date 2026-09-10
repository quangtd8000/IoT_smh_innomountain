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

  // Tìm node cảm biến CỦA ĐÚNG phòng đang chọn — tuyệt đối không fallback
  // sang cảm biến phòng khác (hiển thị số liệu phòng khác dưới tên phòng này
  // là dữ liệu giả, sai sự thật với người dùng gia đình).
  const sensorDevice =
    selectedRoomFilter === 'all'
      ? devices.find((d) => d.device_type === 'sensor' || d.name.toLowerCase().includes('không khí')) || devices[0]
      : devices.find((d) => d.room_id === selectedRoomFilter && (d.device_type === 'sensor' || d.name.toLowerCase().includes('không khí')));

  const selectedRoom = rooms.find((r) => r.id === selectedRoomFilter);
  // Phòng đang chọn có cảm biến riêng hay không (quyết định hiển thị gauge hay
  // thông báo "chưa có cảm biến" — không bao giờ mượn số liệu phòng khác).
  const noRoomSensor = selectedRoomFilter !== 'all' && !sensorDevice;

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

  // Polling dữ liệu cảm biến mỗi 4 giây (chỉ lấy nếu thiết bị online)
  useEffect(() => {
    if (!sensorDevice || sensorDevice.status === 'offline') {
      setLatestTelemetry(null);
      return;
    }

    const fetchLatest = async () => {
      try {
        const list = await telemetryApi.getTelemetry(sensorDevice.id, { limit: 1 });
        if (list && list.length > 0) {
          const recordTime = new Date(list[0].timestamp).getTime();
          // Nếu dữ liệu cũ hơn 5 phút, coi như thiết bị đã ngắt tín hiệu
          if (Date.now() - recordTime > 5 * 60 * 1000) {
            setLatestTelemetry(null);
          } else {
            setLatestTelemetry(list[0]);
          }
        } else {
          setLatestTelemetry(null);
        }
      } catch (e) {
        console.error('Error fetching latest telemetry for gauge:', e);
        setLatestTelemetry(null);
      }
    };

    fetchLatest();
    const timer = setInterval(fetchLatest, 4000);
    return () => clearInterval(timer);
  }, [sensorDevice?.id, sensorDevice?.status]);

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
          // Đếm THIẾT BỊ theo phòng, không đếm kênh relay. Bản cũ cộng
          // relay_channels nên một node 3 công tắc đội số lên 3, phòng nào
          // cũng hiện "(3)" dù chỉ có 1 thiết bị.
          const roomDeviceCount = devices.filter((d) => d.room_id === r.id).length;

          return (
            <button
              key={r.id}
              onClick={() => setSelectedRoomFilter(r.id)}
              className={tabClass(isSelected)}
              style={{ ['--tone' as string]: tone.rgb } as React.CSSProperties}
            >
              <Icon size={15} strokeWidth={1.75} aria-hidden="true" style={{ color: 'rgb(var(--tone))' }} />
              <span>{r.name}</span>
              {roomDeviceCount > 0 && (
                <span className="text-xs text-ink-2 tnum">({roomDeviceCount})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Đo lường không khí — chỉ hiển thị khi có cảm biến thuộc đúng phòng
          đang chọn. Không mượn số liệu phòng khác. */}
      {noRoomSensor ? (
        <section className="plate p-5 sm:p-6">
          <h2 className="text-sm font-medium text-ink-2 mb-4">Không khí</h2>
          <p className="text-sm text-ink">Phòng {selectedRoom?.name} chưa có cảm biến.</p>
          <p className="text-sm text-ink-2 mt-1">
            Thêm một node cảm biến vào phòng này để xem nhiệt độ, độ ẩm và chất lượng không khí.
          </p>
        </section>
      ) : (
        <AirQualityGauge
          telemetry={latestTelemetry}
          deviceName={
            selectedRoomFilter === 'all'
              ? 'Toàn ngôi nhà'
              : `${selectedRoom?.name} · Cảm biến phòng`
          }
        />
      )}

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
