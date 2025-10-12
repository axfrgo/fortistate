import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme colors
        background: {
          DEFAULT: '#0f172a', // slate-900
          secondary: '#1e293b', // slate-800
          tertiary: '#334155', // slate-700
        },
        foreground: {
          DEFAULT: '#f1f5f9', // slate-100
          secondary: '#cbd5e1', // slate-300
          muted: '#64748b', // slate-500
        },
        primary: {
          DEFAULT: '#8b5cf6', // violet-500
          hover: '#7c3aed', // violet-600
        },
        success: '#10b981', // emerald-500
        warning: '#f59e0b', // amber-500
        danger: '#ef4444', // red-500
        info: '#3b82f6', // blue-500
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
