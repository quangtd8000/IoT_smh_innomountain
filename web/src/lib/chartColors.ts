/**
 * Bảng màu biểu đồ. Recharts nhận giá trị màu thật nên không dùng token CSS được.
 *
 * Bốn màu này đã qua validator của quy trình trực quan hoá ở CẢ hai chế độ:
 * dải độ sáng, ngưỡng chroma, tách biệt với người mù màu (ΔE ≥ 8), ngưỡng
 * phân biệt với mắt thường (ΔE ≥ 15), và tương phản với nền (≥ 3:1).
 *
 * Đừng chỉnh bằng mắt. Bản trước đó trông ổn nhưng trượt: ba màu dưới ngưỡng
 * chroma (đọc ra thành xám) và cặp tím↔cam chỉ ΔE 14,2 ở nền tối.
 * Sửa xong thì chạy lại:
 *   node scripts/validate_palette.js "<hex,...>" --mode light|dark
 */
export interface ChartPalette {
  /** Bốn màu chuỗi số liệu, gán theo thứ tự cố định, không xoay vòng */
  series: readonly string[];
  grid: string;
  axis: string;
  surface: string;
  ink: string;
}

export const CHART: Record<'light' | 'dark', ChartPalette> = {
  light: {
    series: ['#00897B', '#C1591F', '#8A4B9E', '#6F8A16'],
    grid: '#DDE1DC',
    axis: '#5E6663',
    surface: '#FFFFFF',
    ink: '#17191A',
  },
  dark: {
    series: ['#0F9C88', '#C4682F', '#9C5FAE', '#7C9128'],
    grid: '#2C302C',
    axis: '#9AA29B',
    surface: '#1D201D',
    ink: '#EDEFEA',
  },
};
