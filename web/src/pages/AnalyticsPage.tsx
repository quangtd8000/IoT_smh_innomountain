import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useHome } from '../context/HomeContext';
import { useTheme } from '../context/ThemeContext';
import { telemetryApi } from '../api/telemetry';
import { SensorData } from '../types';
import { Button } from '../components/ui/Button';
import { CHART } from '../lib/chartColors';
import { formatDate } from '../lib/utils';

export const AnalyticsPage: React.FC = () => {
  const { devices } = useHome();
  const { resolved } = useTheme();
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [limit, setLimit] = useState<number>(50);
  const [telemetryList, setTelemetryList] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(false);

  const c = CHART[resolved];

  useEffect(() => {
    if (devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  const loadData = async () => {
    if (!selectedDeviceId) return;
    setLoading(true);
    try {
      const data = await telemetryApi.getTelemetry(selectedDeviceId, { limit });
      const sorted = [...data].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setTelemetryList(sorted);
    } catch (err: any) {
      console.error('Error loading analytics telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDeviceId, limit]);

  const chartData = telemetryList.map((item) => {
    const d = new Date(item.timestamp);
    return {
      time: `${d.getHours().toString().padStart(2, '0')}:${d
        .getMinutes()
        .toString()
        .padStart(2, '0')}`,
      temperature: item.temperature != null ? Number(item.temperature.toFixed(2)) : null,
      humidity: item.humidity != null ? Number(item.humidity.toFixed(1)) : null,
      pm25: item.pm25 != null ? Number(item.pm25.toFixed(1)) : null,
      co2: item.co2 != null ? Math.round(item.co2) : null,
    };
  });

  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const pick = (k: keyof SensorData) =>
    telemetryList.map((t) => t[k]).filter((v): v is number => typeof v === 'number');

  const co2s = pick('co2');
  const stats = [
    { label: 'Nhiệt độ trung bình', value: avg(pick('temperature')), unit: '°C', digits: 1 },
    { label: 'Độ ẩm trung bình', value: avg(pick('humidity')), unit: '%', digits: 0 },
    { label: 'PM2.5 trung bình', value: avg(pick('pm25')), unit: 'µg/m³', digits: 1 },
    { label: 'CO₂ cao nhất', value: co2s.length ? Math.max(...co2s) : null, unit: 'ppm', digits: 0 },
  ];

  const series = [
    { key: 'temperature', name: 'Nhiệt độ (°C)', color: c.series[0] },
    { key: 'humidity', name: 'Độ ẩm (%)', color: c.series[1] },
    { key: 'pm25', name: 'PM2.5 (µg/m³)', color: c.series[2] },
    { key: 'co2', name: 'CO₂ (ppm)', color: c.series[3] },
  ];

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

  const selectClass = 'min-h-9 bg-surface border border-line text-ink text-sm rounded-md px-2';

  return (
    <div className="space-y-6 max-w-6xl">
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

        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          aria-label="Số bản ghi"
          className={selectClass}
        >
          <option value={20}>20 bản ghi</option>
          <option value={50}>50 bản ghi</option>
          <option value={100}>100 bản ghi</option>
          <option value={200}>200 bản ghi</option>
        </select>

        <Button variant="secondary" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : undefined} aria-hidden="true" />
          Làm mới
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportCSV}
          disabled={telemetryList.length === 0}
        >
          Tải CSV
        </Button>
      </div>

      <dl className="plate p-5 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-xs text-ink-2">{s.label}</dt>
            <dd className="text-xl text-ink tnum mt-0.5">
              {s.value == null ? '—' : s.value.toFixed(s.digits)}
              <span className="ml-1 text-sm text-ink-2">{s.unit}</span>
            </dd>
          </div>
        ))}
      </dl>

      <section className="plate p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h2 className="text-sm font-medium text-ink-2">Biểu đồ</h2>
          <span className="text-xs text-ink-2 tnum">{chartData.length} điểm</span>
        </div>

        <ul className="flex gap-4 flex-wrap mb-3">
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

        <div className="h-72 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-ink-2">
              {loading ? 'Đang tải' : 'Thiết bị này chưa gửi số liệu nào.'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
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
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.name}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="plate p-5 sm:p-6">
        <h2 className="text-sm font-medium text-ink-2 mb-3">Bản ghi gần đây</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="py-2 pr-4 font-medium text-ink-2 text-xs whitespace-nowrap">Thời gian</th>
                <th className="py-2 pr-4 font-medium text-ink-2 text-xs whitespace-nowrap">Nhiệt độ</th>
                <th className="py-2 pr-4 font-medium text-ink-2 text-xs whitespace-nowrap">Độ ẩm</th>
                <th className="py-2 pr-4 font-medium text-ink-2 text-xs whitespace-nowrap">PM2.5</th>
                <th className="py-2 font-medium text-ink-2 text-xs whitespace-nowrap">CO₂</th>
              </tr>
            </thead>
            <tbody>
              {telemetryList
                .slice(-20)
                .reverse()
                .map((rec) => (
                  <tr key={rec.id} className="border-b border-line last:border-b-0">
                    <td className="py-2 pr-4 text-ink-2 whitespace-nowrap">{formatDate(rec.timestamp)}</td>
                    <td className="py-2 pr-4 text-ink tnum whitespace-nowrap">
                      {rec.temperature != null ? `${rec.temperature.toFixed(1)} °C` : '—'}
                    </td>
                    <td className="py-2 pr-4 text-ink tnum whitespace-nowrap">
                      {rec.humidity != null ? `${rec.humidity.toFixed(0)} %` : '—'}
                    </td>
                    <td className="py-2 pr-4 text-ink tnum whitespace-nowrap">
                      {rec.pm25 != null ? `${rec.pm25.toFixed(1)} µg/m³` : '—'}
                    </td>
                    <td className="py-2 text-ink tnum whitespace-nowrap">
                      {rec.co2 != null ? `${Math.round(rec.co2)} ppm` : '—'}
                    </td>
                  </tr>
                ))}
              {telemetryList.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-ink-2">
                    Chưa có bản ghi nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
