/**
 * Recharts nhận giá trị màu thật, không nhận class Tailwind, nên bảng màu
 * biểu đồ phải khai báo bằng hex ở đây thay vì bằng token CSS.
 *
 * Bốn màu chọn cách xa nhau cả về sắc (teal / đất / mận / olive) lẫn độ
 * sáng, nên vẫn phân biệt được khi in đen trắng hoặc với người mù màu
 * đỏ-lục. Bản tối sáng hơn để đủ tương phản trên nền than.
 */
export const CHART = {
  light: {
    series: ['#2F6B6B', '#B26A3C', '#7A5C86', '#6E7A3C'],
    grid: '#DDE1DC',
    axis: '#5E6663',
    surface: '#FFFFFF',
    ink: '#17191A',
  },
  dark: {
    series: ['#6FB2AE', '#D9915F', '#A98CB5', '#A3AF6E'],
    grid: '#2C302C',
    axis: '#9AA29B',
    surface: '#1D201D',
    ink: '#EDEFEA',
  },
} as const;

export type ChartPalette = (typeof CHART)['light'];
