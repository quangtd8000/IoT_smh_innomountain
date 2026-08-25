import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Thermometer, Droplets, Wind, RefreshCw, BarChart2, Sparkles, Flame } from 'lucide-react';
import { useHome } from '../../context/HomeContext';
import { telemetryApi } from '../../api/telemetry';
import { SensorData } from '../../types';
import { cn } from '../../lib/utils';

export const SensorChart: React.FC = () => {
  const { devices } = useHome();
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [telemetryList, setTelemetryList] = useState<SensorData[]>([]);
  const [metric, setMetric] = useState<'temp_hum' | 'pm_co2' | 'voc_nox'>('temp_hum');
  const [loading, setLoading] = useState<boolean>(false);

  // Filter sensor or controller devices
  const sensorDevices = devices.filter(
    (d) => d.device_type === 'sensor' || d.device_type === 'controller' || true
  );

  useEffect(() => {
    if (sensorDevices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(sensorDevices[0].id);
    }
  }, [sensorDevices, selectedDeviceId]);

  const loadTelemetry = async (deviceId: number) => {
    setLoading(true);
    try {
      const data = await telemetryApi.getTelemetry(deviceId, { limit: 25 });
      const sorted = [...data].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setTelemetryList(sorted);
    } catch (error) {
      console.error('Error fetching telemetry:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDeviceId) {
      loadTelemetry(selectedDeviceId);
      const interval = setInterval(() => {
        loadTelemetry(selectedDeviceId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedDeviceId]);

  // Format chart data
  const chartData = telemetryList.map((item) => {
    const d = new Date(item.timestamp);
    const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;

    let extra: any = {};
    if (item.extra_metrics) {
      if (typeof item.extra_metrics === 'string') {
        try {
          extra = JSON.parse(item.extra_metrics);
        } catch {
          extra = {};
        }
      } else {
        extra = item.extra_metrics;
      }
    }

    return {
      time: timeStr,
      temperature: item.temperature != null ? Number(item.temperature.toFixed(2)) : null,
      humidity: item.humidity != null ? Number(item.humidity.toFixed(1)) : null,
      pm25: item.pm25 != null ? Number(item.pm25.toFixed(1)) : null,
      co2: item.co2 != null ? Math.round(item.co2) : null,
      voc: extra.voc_index ?? (extra.sraw_voc ? Math.round(extra.sraw_voc / 300) : null),
      nox: extra.nox_index ?? null,
    };
  });

  return (
    <div className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col h-full">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <BarChart2 size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-100">Đồ Thị Biến Thiên Thời Gian Thực</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cập nhật tự động 5s/lần từ Broker MQTT
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Device dropdown */}
          {sensorDevices.length > 0 && (
            <select
              value={selectedDeviceId || ''}
              onChange={(e) => setSelectedDeviceId(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {sensorDevices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.device_uid})
                </option>
              ))}
            </select>
          )}

          {/* Metric mode toggle */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex">
            <button
              onClick={() => setMetric('temp_hum')}
              className={cn(
                'px-2.5 py-1 text-xs rounded-lg font-semibold transition-all',
                metric === 'temp_hum'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Nhiệt/Độ Ẩm
            </button>
            <button
              onClick={() => setMetric('pm_co2')}
              className={cn(
                'px-2.5 py-1 text-xs rounded-lg font-semibold transition-all',
                metric === 'pm_co2'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Bụi & CO2
            </button>
            <button
              onClick={() => setMetric('voc_nox')}
              className={cn(
                'px-2.5 py-1 text-xs rounded-lg font-semibold transition-all',
                metric === 'voc_nox'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              VOC / NOx
            </button>
          </div>

          <button
            onClick={() => selectedDeviceId && loadTelemetry(selectedDeviceId)}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
            title="Làm mới biểu đồ"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-cyan-400' : ''} />
          </button>
        </div>
      </div>

      {/* Area Chart Container */}
      <div className="h-72 w-full pt-4 flex-1">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800/60">
            {loading ? 'Đang tải luồng dữ liệu cảm biến...' : 'Chưa có bản ghi telemetry cho thiết bị này.'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorPM25" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorCO2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorVOC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorNOX" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '1rem',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                  color: '#f8fafc',
                }}
              />
              {metric === 'temp_hum' ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="temperature"
                    name="Nhiệt độ (°C)"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTemp)"
                  />
                  <Area
                    type="monotone"
                    dataKey="humidity"
                    name="Độ ẩm (%)"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorHum)"
                  />
                </>
              ) : metric === 'pm_co2' ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="pm25"
                    name="PM2.5 (µg/m³)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorPM25)"
                  />
                  <Area
                    type="monotone"
                    dataKey="co2"
                    name="CO2 (ppm)"
                    stroke="#a855f7"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCO2)"
                  />
                </>
              ) : (
                <>
                  <Area
                    type="monotone"
                    dataKey="voc"
                    name="Chỉ số VOC"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorVOC)"
                  />
                  <Area
                    type="monotone"
                    dataKey="nox"
                    name="Chỉ số NOx"
                    stroke="#eab308"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorNOX)"
                  />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
