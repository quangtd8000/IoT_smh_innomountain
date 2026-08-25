import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Bucket } from '../../lib/telemetry';
import { ChartPalette } from '../../lib/chartColors';

export interface MetricChartProps {
  data: Bucket[];
  dataKey: keyof Bucket;
  name: string;
  unit: string;
  color: string;
  palette: ChartPalette;
  /** Số chữ số thập phân khi hiển thị */
  digits?: number;
  height?: number;
}

/**
 * Một chỉ số, một biểu đồ, một thang y riêng.
 *
 * Trước đây cả bốn chỉ số vẽ chung một trục: CO2 chạy tới 1516 còn nhiệt độ
 * nằm trong 25–29, nên nhiệt độ chiếm 0,25% chiều cao — một đường thẳng.
 *
 * Dùng đường chứ không phải vùng tô: vùng tô ngụ ý độ lớn tính từ 0, mà các
 * chỉ số này là khoảng giá trị chứ không phải số đếm. Thang y bám sát dữ liệu
 * kèm chút đệm, không ép về 0.
 */
export const MetricChart: React.FC<MetricChartProps> = ({
  data,
  dataKey,
  name,
  unit,
  color,
  palette,
  digits = 1,
  height = 150,
}) => {
  const values = data
    .map((d) => d[dataKey])
    .filter((v): v is number => typeof v === 'number');

  if (values.length === 0) {
    return (
      <div className="border border-line rounded-md p-4">
        <p className="text-sm text-ink">{name}</p>
        <p className="text-sm text-ink-2 mt-1">Không có số liệu.</p>
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  // Đệm 8% mỗi đầu để đường không dính mép; dữ liệu phẳng vẫn có chiều cao
  const pad = Math.max((max - min) * 0.08, Math.abs(max) * 0.01, 0.5);
  const latest = values[values.length - 1];

  const fmt = (v: number) => v.toFixed(digits);

  return (
    <div className="border border-line rounded-md p-4">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span
            aria-hidden="true"
            className="h-0.5 w-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <h3 className="text-sm text-ink truncate">{name}</h3>
        </div>
        {/* Nhãn trực tiếp cho giá trị mới nhất, thay cho việc ghi số lên mọi điểm */}
        <span className="text-sm text-ink tnum flex-shrink-0">
          {fmt(latest)} <span className="text-ink-2">{unit}</span>
        </span>
      </div>

      <p className="text-xs text-ink-2 tnum mb-2">
        thấp nhất {fmt(min)} · cao nhất {fmt(max)} {unit}
      </p>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={palette.grid} vertical={false} />
            <XAxis
              dataKey="label"
              stroke={palette.axis}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: palette.grid }}
              minTickGap={28}
            />
            <YAxis
              stroke={palette.axis}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={44}
              domain={[min - pad, max + pad]}
              tickFormatter={(v: number) => fmt(v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: palette.surface,
                border: `1px solid ${palette.grid}`,
                borderRadius: '0.5rem',
                fontSize: '13px',
                color: palette.ink,
              }}
              labelStyle={{ color: palette.axis }}
              // Mốc thời gian đầy đủ, không chỉ HH:MM
              labelFormatter={(_l: string, payload: any[]) =>
                payload?.[0]?.payload?.full ?? ''
              }
              formatter={(v: number) => [`${fmt(v)} ${unit}`, name]}
            />
            <Line
              type="monotone"
              dataKey={dataKey as string}
              name={name}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
