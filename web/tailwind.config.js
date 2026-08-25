/** @type {import('tailwindcss').Config} */
export default {
  // ThemeContext luôn ghi data-theme tường minh, nên biến thể dark: luôn khớp với token.
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ground: 'rgb(var(--ground) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        sunken: 'rgb(var(--sunken) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          2: 'rgb(var(--ink-2) / <alpha-value>)',
        },
        // Màu duy nhất mang nghĩa "có tải đang bật"
        live: 'rgb(var(--live) / <alpha-value>)',
        // Thang chất lượng không khí
        air: {
          good: 'rgb(var(--air-good) / <alpha-value>)',
          ok: 'rgb(var(--air-ok) / <alpha-value>)',
          bad: 'rgb(var(--air-bad) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontSize: {
        // Số đo lớn trên dashboard — đọc được từ bên kia phòng
        reading: ['3.5rem', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '600' }],
      },
    },
  },
  plugins: [],
}
