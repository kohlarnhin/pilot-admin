/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Open Sans Variable"', '"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        // 后台信息密度的主力字号：13px 正文 / 控件，行高 20px
        '13': ['13px', '20px'],
      },
      colors: {
        // 统一中性焦点色（slate-500），几何与原有控件保持一致。
        focus: "#64748B",
        // 小面积品牌信号；交互控件仍使用中性 primary / slate。
        brand: {
          50: "#FFF8EB",
          100: "#FEF4D4",
          200: "#FED680",
          500: "#FDA92D",
          DEFAULT: "#FDA92D",
          600: "#F59E0B",
          700: "#A85D13", // 白底对比度 4.95:1，用于品牌色文字。
          800: "#793908",
        },
        primary: {
          lighter: "#F8FAFC",
          light: "#F1F5F9",
          DEFAULT: "#0F172A",
          dark: "#1E293B",
          darker: "#020617",
        },
        success: {
          lighter: "#D8FBDE",
          light: "#86E8AB",
          DEFAULT: "#36B37E",
          dark: "#1B806A",
          darker: "#0A5554",
        },
        warning: {
          lighter: "#FFF5CC",
          light: "#FFD666",
          DEFAULT: "#FFAB00",
          dark: "#B76E00",
          darker: "#7A4100",
        },
        error: {
          lighter: "#FFE9D5",
          light: "#FFAC82",
          DEFAULT: "#FF5630",
          dark: "#B71D18",
          darker: "#7A0916",
        },
        info: {
          lighter: "#CAFDF5",
          light: "#61F3F3",
          DEFAULT: "#00B8D9",
          dark: "#006C9C",
          darker: "#003768",
        },
        gray: {
          50: "#FAFBFC",
          100: "#F9FAFB",
          200: "#F4F6F8",
          300: "#DFE3E8",
          400: "#C4CDD5",
          500: "#919EAB",
          600: "#637381",
          700: "#454F5B",
          800: "#1C252E",
          900: "#141A21",
        },
        // 语义线条：控件边框 / 数据行分隔 / 区块内弱分隔
        line: {
          DEFAULT: "#E2E8F0",
          row: "#EDF1F5",
          soft: "#F1F5F9",
        },
      },
      boxShadow: {
        '2xs': '0 1px 1px 0 rgba(15, 23, 42, 0.03)',
        xs: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        card: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        pop: '0 10px 32px -8px rgba(15, 23, 42, 0.16), 0 2px 6px -2px rgba(15, 23, 42, 0.06)',
        overlay: '0 24px 48px -12px rgba(15, 23, 42, 0.22), 0 4px 12px -4px rgba(15, 23, 42, 0.08)',
      },
      keyframes: {
        'overlay-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'overlay-out': { from: { opacity: '1' }, to: { opacity: '0' } },
        'dialog-in': {
          from: { opacity: '0', transform: 'translate(-50%, -48%) scale(0.98)' },
          to: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        },
        'dialog-out': {
          from: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
          to: { opacity: '0', transform: 'translate(-50%, -48%) scale(0.98)' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'translateY(-2px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'drawer-in': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'drawer-out': { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(100%)' } },
      },
      animation: {
        'overlay-in': 'overlay-in 160ms ease-out',
        'overlay-out': 'overlay-out 120ms ease-in',
        'dialog-in': 'dialog-in 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'dialog-out': 'dialog-out 120ms ease-in',
        'pop-in': 'pop-in 140ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'drawer-in': 'drawer-in 240ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'fade-up': 'fade-up 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'drawer-out': 'drawer-out 180ms ease-in',
      },
    },
  },
  plugins: [],
}
