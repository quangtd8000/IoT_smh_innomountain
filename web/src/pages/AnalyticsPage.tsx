import React, { useState, useEffect } from 'react';
import { useHome } from '../context/HomeContext';
import { telemetryApi } from '../api/telemetry';
import { SensorData } from '../types';
import { Button } from '../components/ui/Button';
import {
  BarChart3,
  RefreshCw,
  Thermometer,
  Droplets,
  Wind,
  Sparkles,
  Download,
  Calendar,
  Layers,
  Flame,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatDate, cn } from '../lib/utils';

export const AnalyticsPage: React.FC = () => {
  const { devices } = useHome();
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [limit, setLimit] = useState<number>(50);
  const [telemetryList, setTelemetryList] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(false);

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
      time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`,
      fullTime: formatDate(item.timestamp),
      temperature: item.temperature != null ? Number(item.temperature.toFixed(2)) : null,
      humidity: item.humidity != null ? Number(item.humidity.toFixed(1)) : null,
      pm25: item.pm25 != null ? Number(item.pm25.toFixed(1)) : null,
      co2: item.co2 != null ? Math.round(item.co2) : null,
    };
  });

  // Calculate statistics
  const temps = telemetryList.map((t) => t.temperature).filter((v): v is number => v != null);
  const hums = telemetryList.map((t) => t.humidity).filter((v): v is number => v != null);
  const pm25s = telemetryList.map((t) => t.pm25).filter((v): v is number => v != null);
  const co2s = telemetryList.map((t) => t.co2).filter((v): v is number => v != null);

  const avgTemp = temps.length > 0 ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : '--';
  const avgHum = hums.length > 0 ? (hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(1) : '--';
  const avgPm25 = pm25s.length > 0 ? (pm25s.reduce((a, b) => a + b, 0) / pm25s.length).toFixed(1) : '--';
  const maxCo2 = co2s.length > 0 ? Math.round(Math.max(...co2s)) : '--';

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

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `telemetry_device_${selectedDeviceId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 glass-card rounded-3xl">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="text-cyan-400" size={20} />
            Phân Tích & Nhật Ký Môi Trường
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Truy vấn và phân tích dữ liệu cảm biến đa thông số thời gian thực
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={selectedDeviceId || ''}
            onChange={(e) => setSelectedDeviceId(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-2xl px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.device_uid})
              </option>
            ))}
          </select>

          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-2xl px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value={20}>20 bản ghi</option>
            <option value={50}>50 bản ghi</option>
            <option value={100}>100 bản ghi</option>
            <option value={200}>200 bản ghi</option>
          </select>

          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="rounded-2xl bg-slate-900 border-slate-700 hover:bg-slate-800"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-cyan-400' : ''} />
            Làm mới
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            disabled={telemetryList.length === 0}
            className="rounded-2xl bg-slate-900 border-slate-700 hover:bg-slate-800 text-cyan-300"
          >
            <Download size={13} />
            Xuất CSV
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
            <Thermometer size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Nhiệt Độ TB</p>
            <p className="text-xl font-extrabold text-slate-100 font-mono">{avgTemp} °C</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
            <Droplets size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Độ Ẩm TB</p>
            <p className="text-xl font-extrabold text-slate-100 font-mono">{avgHum} %</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Bụi PM2.5 TB</p>
            <p className="text-xl font-extrabold text-slate-100 font-mono">{avgPm25} µg/m³</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
            <Wind size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">CO2 Đỉnh Điểm</p>
            <p className="text-xl font-extrabold text-slate-100 font-mono">{maxCo2} ppm</p>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="glass-card rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Layers className="text-blue-400" size={16} />
            Đồ Thị Tương Quan Môi Trường
          </h4>
          <span className="text-xs font-mono text-cyan-400">
            {chartData.length} điểm dữ liệu
          </span>
        </div>

        <div className="h-80 w-full pt-4">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800/60">
              {loading ? 'Đang tải dữ liệu...' : 'Không có dữ liệu cảm biến cho thiết bị này.'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '1rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  name="Nhiệt độ (°C)"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  name="Độ ẩm (%)"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="pm25"
                  name="PM2.5 (µg/m³)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="co2"
                  name="CO2 (ppm)"
                  stroke="#a855f7"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Raw Data Table */}
      <div className="glass-card rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="text-purple-400" size={16} />
            Bảng Bản Ghi Dữ Liệu Chi Tiết
          </h4>
        </div>

        <div className="overflow-x-auto border border-slate-800/80 rounded-2xl mt-4">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Thời gian (Local)</th>
                <th className="p-3.5">Nhiệt độ (°C)</th>
                <th className="p-3.5">Độ ẩm (%)</th>
                <th className="p-3.5">Bụi PM2.5</th>
                <th className="p-3.5">Khí CO2 (ppm)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
              {telemetryList.slice(-20).reverse().map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-mono text-slate-400">{formatDate(rec.timestamp)}</td>
                  <td className="p-3.5 font-bold text-rose-400 font-mono">
                    {rec.temperature != null ? `${rec.temperature.toFixed(2)} °C` : '-'}
                  </td>
                  <td className="p-3.5 font-bold text-blue-400 font-mono">
                    {rec.humidity != null ? `${rec.humidity.toFixed(1)} %` : '-'}
                  </td>
                  <td className="p-3.5 font-bold text-emerald-400 font-mono">
                    {rec.pm25 != null ? `${rec.pm25.toFixed(1)} µg/m³` : '-'}
                  </td>
                  <td className="p-3.5 font-bold text-purple-400 font-mono">
                    {rec.co2 != null ? `${Math.round(rec.co2)} ppm` : '-'}
                  </td>
                </tr>
              ))}
              {telemetryList.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 italic">
                    Chưa có bản ghi nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
