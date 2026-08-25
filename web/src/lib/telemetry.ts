import { ApiBucket } from '../api/telemetry';

export interface Bucket {
  t: number;
  /** Nhãn ngắn cho trục x */
  label: string;
  /** Mốc đầy đủ cho tooltip */
  full: string;
  temperature: number | null;
  humidity: number | null;
  pm25: number | null;
  co2: number | null;
  voc: number | null;
  nox: number | null;
  /** Số bản ghi thô gộp vào ô này */
  n: number;
}

export interface RangeOption {
  id: string;
  label: string;
  ms: number;
  /** Độ rộng mỗi ô, tính bằng giây. Không bao giờ nhỏ hơn 60. */
  bucketSeconds: number;
}

/**
 * Ô không bao giờ hẹp hơn 60 giây: nhãn trục là HH:MM, nên ô hẹp hơn một phút
 * sẽ khiến hai ô liền nhau mang cùng một nhãn.
 *
 * Số điểm mỗi khoảng: 15 phút → 15, 1 giờ → 60, 6 giờ → 72.
 */
export const RANGES: RangeOption[] = [
  { id: '15m', label: '15 phút', ms: 15 * 60_000, bucketSeconds: 60 },
  { id: '60m', label: '1 giờ', ms: 60 * 60_000, bucketSeconds: 60 },
  { id: '6h', label: '6 giờ', ms: 6 * 60 * 60_000, bucketSeconds: 300 },
];

const pad = (n: number) => n.toString().padStart(2, '0');

/** Chuyển ô do máy chủ trả về sang dạng biểu đồ dùng được. */
export function toBuckets(rows: ApiBucket[]): Bucket[] {
  return rows
    .map((r) => {
      const t = new Date(r.timestamp).getTime();
      const d = new Date(t);
      return {
        t,
        label: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
        full: `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
        temperature: r.temperature,
        humidity: r.humidity,
        pm25: r.pm25,
        co2: r.co2,
        voc: r.voc_index,
        nox: r.nox_index,
        n: r.count,
      };
    })
    .filter((b) => !Number.isNaN(b.t))
    .sort((a, b) => a.t - b.t);
}

/** Khoảng thời gian các ô thực sự phủ được. */
export function spanMinutes(buckets: Bucket[]): number {
  if (buckets.length < 2) return 0;
  return (buckets[buckets.length - 1].t - buckets[0].t) / 60_000;
}

/** "8 phút" / "1 giờ 12 phút" */
export function formatSpan(minutes: number): string {
  const m = Math.round(minutes);
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h} giờ` : `${h} giờ ${rest} phút`;
}
