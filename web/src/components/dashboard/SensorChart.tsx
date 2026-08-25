import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { useHome } from '../../context/HomeContext';
import { useTheme } from '../../context/ThemeContext';
import { telemetryApi } from '../../api/telemetry';
import { SensorData } from '../../types';
import { MetricChart } from '../charts/MetricChart';
import { CHART } from '../../lib/chartColors';
import { RANGES, bucketTelemetry, effectiveWindow, formatSpan, Bucket } from '../../lib/telemetry';
import { cn } from '../../lib/utils';

interface MetricDef {
  key: keyof Bucket;
  name: string;
  unit: string;
  digits: number;
}

const GROUPS: { id: string; label: string; metrics: MetricDef[] }[] = [
  {
    id: 'temp_hum',
    label: 'Nhiệt độ & độ ẩm',
    metrics: [
      { key: 'temperature', name: 'Nhiệt độ', unit: '°C', digits: 1 },
      { key: 'humidity', name: 'Độ ẩm', unit: '%', digits: 0 },
    ],
  },
  {
    id: 'pm_co2',
    label: 'Bụi & CO₂',
    metrics: [
      { key: 'pm25', name: 'Bụi mịn PM2.5', unit: 'µg/m³', digits: 1 },
      { key: 'co2', name: 'CO₂', unit: 'ppm', digits: 0 },
    ],
  },
  {
    id: 'voc_nox',
    label: 'VOC & NOx',
    metrics: [
      { key: 'voc', name: 'VOC', unit: '', digits: 0 },
      { key: 'nox', name: 'NOx', unit: '', digits: 0 },
    ],
  },
];

// Khoảng ngắn nhất: dashboard cần xu hướng gần đây, không cần lịch sử
const RANGE = RANGES[0];

export const SensorChart: React.FC = () => {
  const { devices } = useHome();
  const { resolved } = useTheme();
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [telemetryList, setTelemetryList] = useState<SensorData[]>([]);
  const [groupId, setGroupId] = useState<string>('temp_hum');
  const [loading, setLoading] = useState<boolean>(false);

  const palette = CHART[resolved];
  const group = GROUPS.find((g) => g.id === groupId) ?? GROUPS[0];

  useEffect(() => {
    if (devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  const loadTelemetry = async (deviceId: number) => {
    setLoading(true);
    try {
      const data = await telemetryApi.getTelemetry(deviceId, {
        limit: 1000,
        start_time: new Date(Date.now() - RANGE.ms).toISOString(),
      });
      setTelemetryList(data);
    } catch (error) {
      console.error('Error fetching telemetry:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedDeviceId) return;
    loadTelemetry(selectedDeviceId);
    // 15 giây một lần: đủ tươi cho xu hướng, không kéo 1000 bản ghi mỗi 5 giây
    const interval = setInterval(() => loadTelemetry(selectedDeviceId), 15000);
    return () => clearInterval(interval);
  }, [selectedDeviceId]);

  const win = useMemo(() => effectiveWindow(telemetryList, RANGE), [telemetryList]);
  const buckets = useMemo(() => (win ? bucketTelemetry(telemetryList, win) : []), [telemetryList, win]);

  return (
    <div className="plate p-5 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-medium text-ink-2">
            {win ? `${formatSpan(win.minutes)} vừa qua` : RANGE.label}
          </h2>
          <p className="text-xs text-ink-2 mt-0.5">Cập nhật 15 giây một lần</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {devices.length > 1 && (
            <select
              value={selectedDeviceId || ''}
              onChange={(e) => setSelectedDeviceId(Number(e.target.value))}
              aria-label="Chọn thiết bị"
              className="min-h-9 bg-surface border border-line text-ink text-sm rounded-md px-2"
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          <div className="flex rounded-md border border-line overflow-hidden">
            {GROUPS.map((g) => (
              <button
                key={g.id}
                onClick={() => setGroupId(g.id)}
                aria-pressed={groupId === g.id}
                className={cn(
                  'min-h-9 px-2.5 text-sm transition-colors duration-150',
                  groupId === g.id ? 'bg-sunken text-ink font-medium' : 'text-ink-2 hover:bg-sunken'
                )}
              >
                {g.label}
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

      {buckets.length === 0 ? (
        <p className="text-sm text-ink-2 py-6">
          {loading ? 'Đang tải' : 'Chưa có số liệu trong 15 phút vừa qua.'}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {group.metrics.map((m, i) => (
            <MetricChart
              key={m.key as string}
              data={buckets}
              dataKey={m.key}
              name={m.name}
              unit={m.unit}
              digits={m.digits}
              color={palette.series[i]}
              palette={palette}
              height={130}
            />
          ))}
        </div>
      )}
    </div>
  );
};
