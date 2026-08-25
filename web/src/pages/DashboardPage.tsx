import React, { useState, useEffect } from 'react';
import { MetricCards } from '../components/dashboard/MetricCards';
import { SwitchPlate } from '../components/dashboard/SwitchPlate';
import { SensorChart } from '../components/dashboard/SensorChart';
import { AirQualityGauge } from '../components/dashboard/AirQualityGauge';
import { QuickSceneBar } from '../components/dashboard/QuickSceneBar';
import { useHome } from '../context/HomeContext';
import { Button } from '../components/ui/Button';
import { telemetryApi } from '../api/telemetry';
import { SensorData } from '../types';

export interface DashboardPageProps {
  onOpenCreateHome: () => void;
  onOpenAddDevice: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenCreateHome }) => {
  const { homes, devices, isLoading } = useHome();
  const [latestTelemetry, setLatestTelemetry] = useState<SensorData | null>(null);

  const sensorDevice =
    devices.find(
      (d) =>
        d.device_type === 'sensor' ||
        d.name.toLowerCase().includes('không khí') ||
        d.device_uid.includes('node')
    ) || devices[0];

  // Polling 4 giây giữ nguyên như bản cũ
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
  }, [sensorDevice]);

  if (isLoading) {
    return <p className="text-sm text-ink-2">Đang tải</p>;
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

  return (
    // Thứ tự theo việc thực sự cần khi dùng hàng ngày:
    // liếc một cái biết nhà thế nào, rồi chạm một cái đổi được nó.
    <div className="space-y-8 max-w-6xl">
      <MetricCards />

      <AirQualityGauge telemetry={latestTelemetry} deviceName={sensorDevice?.name} />

      <section>
        <h2 className="text-sm font-medium text-ink-2 mb-3">Công tắc</h2>
        <SwitchPlate />
      </section>

      <section>
        <h2 className="text-sm font-medium text-ink-2 mb-3">Kịch bản</h2>
        <QuickSceneBar />
      </section>

      <section>
        <SensorChart />
      </section>
    </div>
  );
};
