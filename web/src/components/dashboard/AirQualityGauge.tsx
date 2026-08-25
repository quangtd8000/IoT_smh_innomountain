import React from 'react';
import {
  Wind,
  Thermometer,
  Droplets,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Activity,
  Cpu,
} from 'lucide-react';
import { SensorData } from '../../types';
import { cn } from '../../lib/utils';

export interface AirQualityGaugeProps {
  telemetry?: SensorData | null;
  deviceName?: string;
  loading?: boolean;
}

export const AirQualityGauge: React.FC<AirQualityGaugeProps> = ({
  telemetry,
  deviceName,
  loading = false,
}) => {
  const temp = telemetry?.temperature ?? null;
  const hum = telemetry?.humidity ?? null;
  const pm25 = telemetry?.pm25 ?? null;
  const co2 = telemetry?.co2 ?? null;

  // Extract extra metrics from JSON or object
  let extra: any = {};
  if (telemetry?.extra_metrics) {
    if (typeof telemetry.extra_metrics === 'string') {
      try {
        extra = JSON.parse(telemetry.extra_metrics);
      } catch {
        extra = {};
      }
    } else {
      extra = telemetry.extra_metrics;
    }
  }

  const vocIndex = extra.voc_index ?? null;
  const noxIndex = extra.nox_index ?? null;
  const co2Source = extra.co2_source || 'scd41_ndir';
  const pmSource = extra.pm_source || 'indoor_baseline';

  // Calculate composite Air Quality Score (0 - 500 AQI standard scale)
  let aqiScore = 25;
  if (pm25 != null) {
    if (pm25 <= 12) aqiScore = Math.round((pm25 / 12) * 50);
    else if (pm25 <= 35.4) aqiScore = Math.round(50 + ((pm25 - 12) / (35.4 - 12)) * 50);
    else if (pm25 <= 55.4) aqiScore = Math.round(100 + ((pm25 - 35.4) / (55.4 - 35.4)) * 50);
    else aqiScore = Math.min(300, Math.round(150 + ((pm25 - 55.4) / 100) * 150));
  }

  // Factor CO2 into AQI if elevated
  if (co2 != null && co2 > 1000) {
    const co2Penalty = Math.min(100, Math.round(((co2 - 1000) / 1000) * 80));
    aqiScore = Math.max(aqiScore, 50 + co2Penalty);
  }

  // Determine Level Info
  let statusText = 'Rất Trong Lành';
  let statusDesc = 'Chỉ số không khí hoàn hảo, môi trường sống và làm việc tối ưu.';
  let colorGradient = 'from-emerald-500 to-teal-400';
  let badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  let scoreRingColor = '#10b981';
  let icon = ShieldCheck;

  if (aqiScore <= 50) {
    statusText = 'Rất Trong Lành';
    statusDesc = 'Không khí tươi sạch tuyệt đối. Thích hợp cho giấc ngủ sâu và làm việc tập trung.';
    colorGradient = 'from-emerald-500 to-teal-400';
    badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    scoreRingColor = '#10b981';
    icon = ShieldCheck;
  } else if (aqiScore <= 100) {
    statusText = 'Không Khí Tốt';
    statusDesc = 'Chất lượng không khí an toàn cho sức khỏe cả gia đình.';
    colorGradient = 'from-cyan-500 to-blue-400';
    badgeBg = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    scoreRingColor = '#06b6d4';
    icon = Sparkles;
  } else if (aqiScore <= 150) {
    statusText = 'Mức Trung Bình';
    statusDesc = 'Nồng độ CO2 hoặc bụi bắt đầu tăng. Khuyến nghị bật quạt thông gió hoặc lọc khí.';
    colorGradient = 'from-amber-500 to-yellow-400';
    badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    scoreRingColor = '#f59e0b';
    icon = AlertTriangle;
  } else {
    statusText = 'Cần Lọc Không Khí';
    statusDesc = 'Chỉ số ô nhiễm cao. Vui lòng mở cửa thông gió hoặc bật máy lọc khí chế độ Max.';
    colorGradient = 'from-rose-500 to-orange-500';
    badgeBg = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    scoreRingColor = '#f43f5e';
    icon = AlertTriangle;
  }

  const StatusIcon = icon;

  // SVG Gauge calculations
  const circumference = 2 * Math.PI * 48; // r = 48
  const progressPercent = Math.min(100, Math.max(5, (aqiScore / 200) * 100));
  const strokeDashoffset = circumference - (progressPercent / 100) * (circumference * 0.75);

  return (
    <div className="glass-card rounded-3xl p-5 sm:p-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div
        className={cn(
          'absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 transition-all duration-700 pointer-events-none',
          aqiScore <= 50
            ? 'bg-emerald-500'
            : aqiScore <= 100
            ? 'bg-cyan-500'
            : aqiScore <= 150
            ? 'bg-amber-500'
            : 'bg-rose-500'
        )}
      />

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Activity className="text-cyan-400" size={20} />
              Chất Lượng Không Khí & Môi Trường
            </h3>
            {deviceName && (
              <span className="text-[11px] font-mono bg-slate-800/80 text-cyan-300 px-2.5 py-0.5 rounded-full border border-slate-700">
                {deviceName}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Dữ liệu quang phổ NDIR, tán xạ laser và cảm biến bán dẫn MOX thời gian thực
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-semibold px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-sm', badgeBg)}>
            <StatusIcon size={14} />
            {statusText}
          </span>
        </div>
      </div>

      {/* Main Metric Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5 items-center relative z-10">
        {/* Left: Interactive AQI Gauge Dial */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-950/50 rounded-2xl border border-slate-800/60 shadow-inner">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-135" viewBox="0 0 120 120">
              {/* Background circle track */}
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="#1e293b"
                strokeWidth="10"
                strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
                strokeLinecap="round"
              />
              {/* Active progress stroke */}
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke={scoreRingColor}
                strokeWidth="10"
                strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AQI Score</span>
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
                {loading ? '--' : aqiScore}
              </span>
              <span className="text-[10px] font-bold text-slate-400">/ 500</span>
            </div>
          </div>

          <div className="mt-3 text-center px-3">
            <h4 className={cn('text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r', colorGradient)}>
              {statusText}
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {statusDesc}
            </p>
          </div>
        </div>

        {/* Right: 4 Detailed Environmental Matrix Tiles */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Temperature & Humidity (SHT31) */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Thermometer size={14} className="text-rose-400" />
                Nhiệt Độ / Độ Ẩm
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300">
                SHT31
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-slate-100 font-mono">
                {temp != null ? `${temp.toFixed(1)}°C` : '--'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {hum != null ? `• ${hum.toFixed(1)}% RH` : ''}
              </span>
            </div>
            <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, ((temp || 25) / 45) * 100))}%` }}
              />
            </div>
          </div>

          {/* CO2 NDIR (SCD41) */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Wind size={14} className="text-purple-400" />
                Khí CO2 (Quang Học)
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300">
                {co2Source === 'scd41_ndir' ? 'SCD41 NDIR' : 'SCD41 Warmup'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold text-slate-100 font-mono">
                {co2 != null ? Math.round(co2) : '--'}
              </span>
              <span className="text-xs text-purple-400 font-semibold">ppm</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span>Chuẩn: 400 - 800 ppm</span>
              <span className={co2 && co2 < 1000 ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                {co2 && co2 < 1000 ? 'Lý tưởng' : 'Cần thông khí'}
              </span>
            </div>
          </div>

          {/* PM2.5 Fine Dust (SPS30) */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-400" />
                Bụi Mịn PM2.5
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300">
                {pmSource === 'sps30_laser' ? 'SPS30 Laser' : 'Chuẩn Phòng'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold text-slate-100 font-mono">
                {pm25 != null ? pm25.toFixed(1) : '--'}
              </span>
              <span className="text-xs text-emerald-400 font-semibold">µg/m³</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span>WHO: &lt; 15 µg/m³</span>
              <span className={pm25 && pm25 < 25 ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                {pm25 && pm25 < 25 ? 'Không bụi' : 'Có bụi'}
              </span>
            </div>
          </div>

          {/* VOC / NOx Gas Index (SGP41) */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Flame size={14} className="text-cyan-400" />
                Khí Hữu Cơ VOC
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300">
                SGP41
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-slate-100 font-mono">
                {vocIndex != null ? Math.round(vocIndex) : '--'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {noxIndex != null ? `• NOx: ${Math.round(noxIndex)}` : ''}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span>Chỉ số VOC: 1 - 500</span>
              <span className={vocIndex && vocIndex <= 100 ? 'text-emerald-400 font-medium' : 'text-cyan-400 font-medium'}>
                {vocIndex && vocIndex <= 100 ? 'Sạch sẽ' : 'Đang xử lý'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
