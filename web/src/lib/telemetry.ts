import { SensorData } from '../types';

export interface Bucket {
  /** Mốc đầu ô, dùng để sắp xếp */
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
  /** Số bản ghi gộp vào ô này */
  n: number;
}

export interface RangeOption {
  id: string;
  label: string;
  ms: number;
  /** Số ô muốn chia khoảng này thành */
  buckets: number;
}

/** Máy chủ chặn ở đây; chạm mức này nghĩa là dữ liệu đã bị cắt bớt. */
export const SERVER_LIMIT = 1000;

/** Ô không bao giờ hẹp hơn một phút, vì nhãn trục là HH:MM. */
const MIN_BUCKET_MS = 60_000;

export const RANGES: RangeOption[] = [
  { id: '15m', label: '15 phút', ms: 15 * 60_000, buckets: 15 },
  { id: '60m', label: '1 giờ', ms: 60 * 60_000, buckets: 60 },
  { id: '6h', label: '6 giờ', ms: 6 * 60 * 60_000, buckets: 72 },
];

export interface Window {
  start: number;
  end: number;
  buckets: number;
  /** Số phút dữ liệu thực sự phủ được */
  minutes: number;
  /** Máy chủ đã cắt bớt: khoảng thật ngắn hơn khoảng đã yêu cầu */
  truncated: boolean;
}

/**
 * Khoảng thời gian thực sự vẽ được.
 *
 * Máy chủ trả về 1000 bản ghi MỚI NHẤT trong khoảng, mà cảm biến gửi khoảng
 * nửa giây một lần — nên 1000 bản ghi chỉ phủ chừng 8 phút. Yêu cầu "6 giờ"
 * vẫn chỉ nhận về 8 phút cuối.
 *
 * Khi bị cắt, phải gộp theo khoảng THẬT chứ không theo khoảng đã yêu cầu:
 * nếu không, biểu đồ 6 giờ sẽ có 72 ô trống với dữ liệu dồn ở mép phải.
 */
export function effectiveWindow(
  records: SensorData[],
  range: RangeOption,
  now: number = Date.now()
): Window | null {
  const times = records
    .map((r) => new Date(r.timestamp).getTime())
    .filter((t) => !Number.isNaN(t));
  if (times.length === 0) return null;

  const requestedStart = now - range.ms;
  const dataStart = Math.min(...times);
  const dataEnd = Math.max(...times);

  const truncated = records.length >= SERVER_LIMIT && dataStart > requestedStart;
  const start = truncated ? dataStart : requestedStart;
  const end = truncated ? dataEnd : now;

  const span = Math.max(end - start, MIN_BUCKET_MS);
  const buckets = Math.max(1, Math.min(range.buckets, Math.floor(span / MIN_BUCKET_MS)));

  return {
    start,
    end,
    buckets,
    minutes: (dataEnd - dataStart) / 60_000,
    truncated,
  };
}

const pad = (n: number) => n.toString().padStart(2, '0');

function avg(xs: number[]): number | null {
  if (xs.length === 0) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function readExtra(item: SensorData): Record<string, any> {
  if (!item.extra_metrics) return {};
  if (typeof item.extra_metrics === 'string') {
    try {
      return JSON.parse(item.extra_metrics);
    } catch {
      return {};
    }
  }
  return item.extra_metrics;
}

/**
 * Gộp các bản ghi thô thành từng ô thời gian đều nhau.
 * Ô rỗng bị bỏ qua để đường không bị đứt giả.
 */
export function bucketTelemetry(records: SensorData[], win: Window): Bucket[] {
  if (records.length === 0) return [];

  const width = Math.max((win.end - win.start) / win.buckets, MIN_BUCKET_MS);
  const groups = new Map<number, SensorData[]>();

  for (const r of records) {
    const ts = new Date(r.timestamp).getTime();
    if (Number.isNaN(ts) || ts < win.start || ts > win.end) continue;
    const idx = Math.min(win.buckets - 1, Math.floor((ts - win.start) / width));
    if (!groups.has(idx)) groups.set(idx, []);
    groups.get(idx)!.push(r);
  }

  const out: Bucket[] = [];
  for (const [idx, items] of [...groups.entries()].sort((a, b) => a[0] - b[0])) {
    const t = win.start + idx * width;
    const d = new Date(t);
    const extras = items.map(readExtra);

    out.push({
      t,
      label: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
      full: `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
      temperature: avg(items.map((i) => i.temperature).filter((v): v is number => v != null)),
      humidity: avg(items.map((i) => i.humidity).filter((v): v is number => v != null)),
      pm25: avg(items.map((i) => i.pm25).filter((v): v is number => v != null)),
      co2: avg(items.map((i) => i.co2).filter((v): v is number => v != null)),
      voc: avg(extras.map((e) => e.voc_index).filter((v): v is number => typeof v === 'number')),
      nox: avg(extras.map((e) => e.nox_index).filter((v): v is number => typeof v === 'number')),
      n: items.length,
    });
  }

  return out;
}

/** "8 phút" / "1 giờ 12 phút" */
export function formatSpan(minutes: number): string {
  const m = Math.round(minutes);
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h} giờ` : `${h} giờ ${rest} phút`;
}
