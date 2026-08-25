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
import { RefreshCw } from 'lucide-react';
import { useHome } from '../../context/HomeContext';
import { useTheme } from '../../context/ThemeContext';
import { telemetryApi } from '../../api/telemetry';
import { SensorData } from '../../types';
import { cn } from '../../lib/utils';
import { CHART } from '../../lib/chartColors';

const METRICS = [
  { id: 'temp_hum', label: 'Nhiệt độ & độ ẩm' },
  { id: 'pm_co2', label: 'Bụi & CO₂' },
  { id: 'voc_nox', label: 'VOC & NOx' },
] as const;

type MetricId = (typeof METRICS)[number]['id'];

export const SensorChart: React.FC = () => {
  const { devices } = useHome();
  const { resolved } = useTheme();
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [telemetryList, setTelemetryList] = useState<SensorData[]>([]);
  const [metric, setMetric] = useState<MetricId>('temp_hum');
  const [loading, setLoading] = useState<boolean>(false);

  const c = CHART[resolved];

  const sensorDevices = devices;

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

  const chartData = telemetryList.map((item) => {
    const d = new Date(item.timestamp);
    const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

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

  const series =
    metric === 'temp_hum'
      ? [
          { key: 'temperature', name: 'Nhiệt độ (°C)', color: c.series[0] },
          { key: 'humidity', name: 'Độ ẩm (%)', color: c.series[1] },
        ]
      : metric === 'pm_co2'
      ? [
          { key: 'pm25', name: 'PM2.5 (µg/m³)', color: c.series[0] },
          { key: 'co2', name: 'CO₂ (ppm)', color: c.series[1] },
        ]
      : [
          { key: 'voc', name: 'VOC', color: c.series[0] },
          { key: 'nox', name: 'NOx', color: c.series[1] },
        ];

  return (
    <div className="plate p-5 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-sm font-medium text-ink-2">Số liệu theo thời gian</h2>
          <p className="text-xs text-ink-2 mt-0.5">Cập nhật 5 giây một lần</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {sensorDevices.length > 0 && (
            <select
              value={selectedDeviceId || ''}
              onChange={(e) => setSelectedDeviceId(Number(e.target.value))}
              aria-label="Chọn thiết bị"
              className="min-h-9 bg-surface border border-line text-ink text-sm rounded-md px-2"
            >
              {sensorDevices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          <div className="flex rounded-md border border-line overflow-hidden">
            {METRICS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMetric(m.id)}
                aria-pressed={metric === m.id}
                className={cn(
                  'min-h-9 px-2.5 text-sm transition-colors duration-150',
                  metric === m.id ? 'bg-sunken text-ink font-medium' : 'text-ink-2 hover:bg-sunken'
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => selectedDeviceId && loadTelemetry(selectedDeviceId)}
            disabled={loading}
            aria-label="Làm mới biểu đồ"
            className="p-2 text-ink-2 hover:text-ink hover:bg-sunken rounded-md transition-colors disabled:opacity-45"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : undefined} />
          </button>
        </div>
      </div>

      {/* Chú giải nằm ngoài biểu đồ để không che dữ liệu */}
      <ul className="flex gap-4 mb-3">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5 text-xs text-ink-2">
            <span
              aria-hidden="true"
              className="h-0.5 w-4 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {s.name}
          </li>
        ))}
      </ul>

      <div className="h-64 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-ink-2">
            {loading ? 'Đang tải' : 'Thiết bị này chưa gửi số liệu nào.'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={c.grid} vertical={false} />
              <XAxis
                dataKey="time"
                stroke={c.axis}
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: c.grid }}
              />
              <YAxis stroke={c.axis} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: c.surface,
                  border: `1px solid ${c.grid}`,
                  borderRadius: '0.5rem',
                  fontSize: '13px',
                  color: c.ink,
                }}
                labelStyle={{ color: c.axis }}
              />
              {series.map((s) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  fill={s.color}
                  fillOpacity={0.1}
                  dot={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
