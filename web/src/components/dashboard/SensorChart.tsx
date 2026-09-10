import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useHome } from '../../context/HomeContext';
import { useTheme } from '../../context/ThemeContext';
import { telemetryApi } from '../../api/telemetry';
import { MetricChart } from '../charts/MetricChart';
import { CHART } from '../../lib/chartColors';
import { RANGES, toBuckets, spanMinutes, formatSpan, Bucket } from '../../lib/telemetry';
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

/** Dashboard cần xu hướng gần đây, không cần lịch sử — dùng khoảng ngắn nhất. */
const RANGE = RANGES[0];

export interface SensorChartProps {
  selectedRoomId?: number | 'all';
}

export const SensorChart: React.FC<SensorChartProps> = ({ selectedRoomId = 'all' }) => {
  const { devices, rooms } = useHome();
  const { resolved } = useTheme();
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [groupId, setGroupId] = useState<string>('temp_hum');
  const [loading, setLoading] = useState<boolean>(false);

  const palette = CHART[resolved];
  const group = GROUPS.find((g) => g.id === groupId) ?? GROUPS[0];

  // Tìm cảm biến CỦA ĐÚNG phòng đang chọn — không fallback sang phòng khác
  // (cùng lý do như gauge ở DashboardPage: số liệu phòng khác đội lốt
  // phòng này là dữ liệu giả).
  const roomSensorDevice =
    selectedRoomId === 'all'
      ? devices.find((d) => d.device_type === 'sensor' || d.device_uid.includes('node') || d.name.toLowerCase().includes('cảm biến')) || devices[0]
      : devices.find((d) => d.room_id === selectedRoomId && (d.device_type === 'sensor' || d.device_uid.includes('node')));

  const selectedDeviceId = roomSensorDevice?.id;
  const currentRoomName = rooms.find((r) => r.id === selectedRoomId)?.name;

  const loadTelemetry = async (deviceId: number) => {
    setLoading(true);
    try {
      const rows = await telemetryApi.getAggregate(deviceId, {
        bucket_seconds: RANGE.bucketSeconds,
        start_time: new Date(Date.now() - RANGE.ms).toISOString(),
        max_points: 200,
      });
      setBuckets(toBuckets(rows));
    } catch (error) {
      console.error('Error fetching telemetry:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedDeviceId) return;
    loadTelemetry(selectedDeviceId);
    // Ô rộng 1 phút nên không cần làm mới dày hơn thế
    const interval = setInterval(() => loadTelemetry(selectedDeviceId), 30000);
    return () => clearInterval(interval);
  }, [selectedDeviceId]);

  return (
    <div className="plate p-5 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-medium text-ink">
            Biểu đồ môi trường {currentRoomName ? `· ${currentRoomName}` : '· Toàn nhà'}
          </h2>
          <p className="text-xs text-ink-2 mt-0.5">
            {buckets.length > 1 ? `${formatSpan(spanMinutes(buckets))} vừa qua` : RANGE.label} (Trung bình mỗi phút)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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
          {loading
            ? 'Đang tải'
            : selectedRoomId !== 'all' && !selectedDeviceId
              ? `Phòng ${currentRoomName ?? 'này'} chưa có cảm biến.`
              : 'Chưa có số liệu trong 15 phút vừa qua.'}
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
