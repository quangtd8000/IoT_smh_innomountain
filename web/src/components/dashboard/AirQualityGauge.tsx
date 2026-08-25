import React from 'react';
import { SensorData } from '../../types';
import { cn } from '../../lib/utils';

export interface AirQualityGaugeProps {
  telemetry?: SensorData | null;
  deviceName?: string;
  loading?: boolean;
}

/** Thang hiển thị chạy tới 200; trên mức đó coi như kịch thang. */
const SCALE_MAX = 200;

export const AirQualityGauge: React.FC<AirQualityGaugeProps> = ({
  telemetry,
  loading = false,
}) => {
  const temp = telemetry?.temperature ?? null;
  const hum = telemetry?.humidity ?? null;
  const pm25 = telemetry?.pm25 ?? null;
  const co2 = telemetry?.co2 ?? null;

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

  // ── Phép tính AQI giữ nguyên như bản cũ (breakpoint PM2.5 chuẩn + phạt CO2) ──
  let aqiScore = 25;
  if (pm25 != null) {
    if (pm25 <= 12) aqiScore = Math.round((pm25 / 12) * 50);
    else if (pm25 <= 35.4) aqiScore = Math.round(50 + ((pm25 - 12) / (35.4 - 12)) * 50);
    else if (pm25 <= 55.4) aqiScore = Math.round(100 + ((pm25 - 35.4) / (55.4 - 35.4)) * 50);
    else aqiScore = Math.min(300, Math.round(150 + ((pm25 - 55.4) / 100) * 150));
  }
  if (co2 != null && co2 > 1000) {
    const co2Penalty = Math.min(100, Math.round(((co2 - 1000) / 1000) * 80));
    aqiScore = Math.max(aqiScore, 50 + co2Penalty);
  }
  // ──────────────────────────────────────────────────────────────────────────

  let statusText: string;
  let statusNote: string;
  let tone: 'good' | 'ok' | 'bad';

  if (aqiScore <= 50) {
    statusText = 'Trong lành';
    statusNote = 'Không khí sạch. Ngủ và làm việc đều tốt.';
    tone = 'good';
  } else if (aqiScore <= 100) {
    statusText = 'Tốt';
    statusNote = 'An toàn cho cả nhà.';
    tone = 'good';
  } else if (aqiScore <= 150) {
    statusText = 'Trung bình';
    statusNote = 'CO₂ hoặc bụi đang tăng. Nên bật quạt thông gió.';
    tone = 'ok';
  } else {
    statusText = 'Kém';
    statusNote = 'Nên mở cửa thông gió hoặc bật máy lọc khí.';
    tone = 'bad';
  }

  const toneText = { good: 'text-air-good', ok: 'text-air-ok', bad: 'text-air-bad' }[tone];
  const toneBg = { good: 'bg-air-good', ok: 'bg-air-ok', bad: 'bg-air-bad' }[tone];

  const markerPct = Math.min(100, (aqiScore / SCALE_MAX) * 100);

  // So sánh với null tường minh: giá trị 0 là số đo hợp lệ, không phải "chưa có".
  const readings: { label: string; value: string; note?: string }[] = [
    {
      label: 'Nhiệt độ',
      value: temp != null ? `${temp.toFixed(1)}°C` : '—',
    },
    {
      label: 'Độ ẩm',
      value: hum != null ? `${hum.toFixed(0)}%` : '—',
    },
    {
      label: 'CO₂',
      value: co2 != null ? `${Math.round(co2)} ppm` : '—',
      note: co2 == null ? undefined : co2 < 1000 ? 'Thoáng' : 'Cần thông khí',
    },
    {
      label: 'Bụi mịn PM2.5',
      value: pm25 != null ? `${pm25.toFixed(1)} µg/m³` : '—',
      note: pm25 == null ? undefined : pm25 < 25 ? 'Ít bụi' : 'Nhiều bụi',
    },
    {
      label: 'Khí hữu cơ VOC',
      value: vocIndex != null ? `${Math.round(vocIndex)}` : '—',
      note: noxIndex != null ? `NOx ${Math.round(noxIndex)}` : undefined,
    },
  ];

  return (
    <section className="plate p-5 sm:p-6">
      <h2 className="text-sm font-medium text-ink-2 mb-4">Không khí</h2>

      <div className="flex items-baseline gap-3 flex-wrap">
        <p className={cn('font-display text-2xl font-semibold', toneText)}>{statusText}</p>
        <p className="font-display text-reading text-ink tnum leading-none">
          {loading ? '—' : aqiScore}
        </p>
      </div>

      {/* Thang đo kiểu nhiệt kế treo tường: vạch mốc cố định, con trỏ chạy */}
      <div className="mt-5">
        <div className="relative h-1.5 rounded-full bg-sunken">
          <div
            className={cn('absolute inset-y-0 left-0 rounded-full transition-all duration-500', toneBg)}
            style={{ width: `${markerPct}%` }}
          />
          {[50, 100, 150].map((tick) => (
            <span
              key={tick}
              aria-hidden="true"
              className="absolute top-0 h-1.5 w-px bg-ground"
              style={{ left: `${(tick / SCALE_MAX) * 100}%` }}
            />
          ))}
        </div>
        <div className="relative mt-1.5 h-4 text-xs text-ink-2 tnum" aria-hidden="true">
          <span className="absolute left-0">0</span>
          {[50, 100, 150].map((tick) => (
            <span
              key={tick}
              className="absolute -translate-x-1/2"
              style={{ left: `${(tick / SCALE_MAX) * 100}%` }}
            >
              {tick}
            </span>
          ))}
        </div>
      </div>

      <p className="mt-3 text-sm text-ink-2">{statusNote}</p>

      <dl className="mt-5 pt-5 border-t border-line grid gap-x-6 gap-y-3 grid-cols-2 lg:grid-cols-3">
        {readings.map((r) => (
          <div key={r.label}>
            <dt className="text-xs text-ink-2">{r.label}</dt>
            <dd className="text-base text-ink tnum">
              {r.value}
              {r.note && <span className="ml-2 text-xs text-ink-2">{r.note}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
