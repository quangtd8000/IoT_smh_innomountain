import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { useHome } from '../context/HomeContext';
import { useTheme } from '../context/ThemeContext';
import { telemetryApi } from '../api/telemetry';
import { SensorData } from '../types';
import { Button } from '../components/ui/Button';
import { Notice } from '../components/ui/Notice';
import { MetricChart } from '../components/charts/MetricChart';
import { CHART } from '../lib/chartColors';
import { RANGES, bucketTelemetry, effectiveWindow, formatSpan, Bucket } from '../lib/telemetry';
import { cn } from '../lib/utils';

const METRICS: {
  key: keyof Bucket;
  name: string;
  unit: string;
  digits: number;
}[] = [
  { key: 'temperature', name: 'Nhiệt độ', unit: '°C', digits: 1 },
  { key: 'humidity', name: 'Độ ẩm', unit: '%', digits: 0 },
  { key: 'pm25', name: 'Bụi mịn PM2.5', unit: 'µg/m³', digits: 1 },
  { key: 'co2', name: 'CO₂', unit: 'ppm', digits: 0 },
];

export const AnalyticsPage: React.FC = () => {
  const { devices } = useHome();
  const { resolved } = useTheme();
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [rangeId, setRangeId] = useState<string>('60m');
  const [telemetryList, setTelemetryList] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(false);

  const palette = CHART[resolved];
  const range = RANGES.find((r) => r.id === rangeId) ?? RANGES[RANGES.length - 1];

  useEffect(() => {
    if (devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  const loadData = async () => {
    if (!selectedDeviceId) return;
    setLoading(true);
    try {
      const startTime = new Date(Date.now() - range.ms).toISOString();
      const data = await telemetryApi.getTelemetry(selectedDeviceId, {
        limit: 1000,
        start_time: startTime,
      });
      setTelemetryList(data);
    } catch (err: any) {
      console.error('Error loading analytics telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDeviceId, rangeId]);

  const win = useMemo(() => effectiveWindow(telemetryList, range), [telemetryList, range]);
  const buckets = useMemo(() => (win ? bucketTelemetry(telemetryList, win) : []), [telemetryList, win]);

  const selectClass = 'min-h-9 bg-surface border border-line text-ink text-sm rounded-md px-2';

  const handleExportCSV = () => {
    if (telemetryList.length === 0) return;
    const headers = ['ID', 'DeviceID', 'Timestamp', 'Temperature_C', 'Humidity_Percent', 'PM25_ug_m3', 'CO2_ppm'];
    const rows = telemetryList.map((t) => [
      t.id,
      t.device_id,
      t.timestamp,
      t.temperature ?? '',
      t.humidity ?? '',
      t.pm25 ?? '',
      t.co2 ?? '',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute(
      'download',
      `telemetry_device_${selectedDeviceId}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={selectedDeviceId || ''}
          onChange={(e) => setSelectedDeviceId(Number(e.target.value))}
          aria-label="Chọn thiết bị"
          className={selectClass}
        >
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <div className="flex rounded-md border border-line overflow-hidden">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRangeId(r.id)}
              aria-pressed={rangeId === r.id}
              className={cn(
                'min-h-9 px-3 text-sm transition-colors duration-150',
                rangeId === r.id ? 'bg-sunken text-ink font-medium' : 'text-ink-2 hover:bg-sunken'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        <Button variant="secondary" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : undefined} aria-hidden="true" />
          Làm mới
        </Button>

        <Button variant="secondary" size="sm" onClick={handleExportCSV} disabled={telemetryList.length === 0}>
          Tải CSV
        </Button>
      </div>

      {buckets.length === 0 ? (
        <div className="plate p-6">
          <p className="text-sm text-ink">
            {loading ? 'Đang tải' : `Không có số liệu trong ${range.label.toLowerCase()} vừa qua.`}
          </p>
        </div>
      ) : (
        <>
          {/* Mỗi chỉ số một biểu đồ, một thang y riêng */}
          <div className="plate p-5 sm:p-6">
            <div className="flex items-baseline justify-between gap-3 mb-4">
              <h2 className="text-sm font-medium text-ink-2">
                {win ? `${formatSpan(win.minutes)} vừa qua` : range.label}
              </h2>
              <span className="text-xs text-ink-2 tnum">
                {telemetryList.length} bản ghi, gộp thành {buckets.length} mốc
              </span>
            </div>

            {/* Noi that khi khoang thuc te ngan hon khoang da chon */}
            {win?.truncated && (
              <Notice tone="info" className="mb-4">
                {`Máy chủ chỉ trả tối đa 1000 bản ghi mỗi lần. Cảm biến gửi khoảng nửa giây một lần, nên biểu đồ đang hiển thị ${formatSpan(win.minutes)} gần nhất thay vì ${range.label.toLowerCase()}.`}
              </Notice>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              {METRICS.map((m, i) => (
                <MetricChart
                  key={m.key as string}
                  data={buckets}
                  dataKey={m.key}
                  name={m.name}
                  unit={m.unit}
                  digits={m.digits}
                  color={palette.series[i]}
                  palette={palette}
                />
              ))}
            </div>
          </div>

          <section className="plate p-5 sm:p-6">
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <h2 className="text-sm font-medium text-ink-2">Bảng số liệu</h2>
              <span className="text-xs text-ink-2">trung bình mỗi mốc</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="py-2 pr-4 font-medium text-ink-2 text-xs whitespace-nowrap">Mốc</th>
                    {METRICS.map((m) => (
                      <th key={m.key as string} className="py-2 pr-4 font-medium text-ink-2 text-xs whitespace-nowrap">
                        {m.name}
                      </th>
                    ))}
                    <th className="py-2 font-medium text-ink-2 text-xs whitespace-nowrap">Bản ghi</th>
                  </tr>
                </thead>
                <tbody>
                  {[...buckets].reverse().map((b) => (
                    <tr key={b.t} className="border-b border-line last:border-b-0">
                      <td className="py-2 pr-4 text-ink-2 tnum whitespace-nowrap">{b.full}</td>
                      {METRICS.map((m) => {
                        const v = b[m.key];
                        return (
                          <td key={m.key as string} className="py-2 pr-4 text-ink tnum whitespace-nowrap">
                            {typeof v === 'number' ? v.toFixed(m.digits) : '—'}
                          </td>
                        );
                      })}
                      <td className="py-2 text-ink-2 tnum">{b.n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
