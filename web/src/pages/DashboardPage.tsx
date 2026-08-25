import React, { useState, useEffect } from 'react';
import { MetricCards } from '../components/dashboard/MetricCards';
import { QuickRelays } from '../components/dashboard/QuickRelays';
import { SensorChart } from '../components/dashboard/SensorChart';
import { AirQualityGauge } from '../components/dashboard/AirQualityGauge';
import { QuickSceneBar } from '../components/dashboard/QuickSceneBar';
import { useHome } from '../context/HomeContext';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, ShieldCheck, Sparkles, Wifi } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { telemetryApi } from '../api/telemetry';
import { SensorData } from '../types';

export interface DashboardPageProps {
  onOpenCreateHome: () => void;
  onOpenAddDevice: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenCreateHome,
  onOpenAddDevice,
}) => {
  const { activeHome, homes, devices, isLoading } = useHome();
  const { user } = useAuth();
  const [latestTelemetry, setLatestTelemetry] = useState<SensorData | null>(null);
  const [telemetryLoading, setTelemetryLoading] = useState(false);

  // Find active sensor device
  const sensorDevice = devices.find(
    (d) => d.device_type === 'sensor' || d.name.toLowerCase().includes('không khí') || d.device_uid.includes('node')
  ) || devices[0];

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
    return (
      <div className="flex items-center justify-center h-[70vh] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-300">Đang khởi tạo hệ sinh thái nhà thông minh...</p>
        </div>
      </div>
    );
  }

  if (homes.length === 0) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center max-w-md p-8 glass-card rounded-3xl border border-slate-800 backdrop-blur-2xl">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
            <PlusCircle size={32} />
          </div>
          <h3 className="text-xl font-extrabold text-slate-100 mb-2">Chào Mừng Đến Với SmartHome</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Hãy bắt đầu bằng việc tạo ngôi nhà đầu tiên của bạn để kết nối các mạch ESP32 và cảm biến môi trường.
          </p>
          <Button variant="primary" onClick={onOpenCreateHome} className="w-full shadow-lg shadow-blue-600/30">
            Tạo Ngôi Nhà Đầu Tiên
          </Button>
        </div>
      </div>
    );
  }

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <div className="space-y-6">
      {/* Hero Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 glass-card rounded-3xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5">
              <Sparkles size={12} />
              Hệ Thống Trực Tuyến
            </span>
            <span className="text-xs text-slate-400 font-mono">
              • {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{user?.full_name || user?.username || 'Chủ Nhà'}</span>!
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Tất cả các node cảm biến môi trường và bộ điều khiển relay đang vận hành ổn định qua giao thức MQTT.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-emerald-400 animate-ping"></div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Hạ Tầng EMQX</p>
              <p className="text-xs font-bold text-emerald-400 font-mono">192.168.1.35:1883</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <MetricCards />

      {/* Air Quality Gauge Master Presentation */}
      <AirQualityGauge
        telemetry={latestTelemetry}
        deviceName={sensorDevice?.name}
        loading={telemetryLoading}
      />

      {/* Quick Scene Automation Bar */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Kịch Bản Tự Động Hóa 1-Chạm
          </h4>
          <span className="text-[11px] text-cyan-400 font-medium">Phản hồi thời gian thực</span>
        </div>
        <QuickSceneBar />
      </div>

      {/* Main Grid: Quick Relays + Sensor Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col">
          <QuickRelays />
        </div>
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col">
          <SensorChart />
        </div>
      </div>
    </div>
  );
};
