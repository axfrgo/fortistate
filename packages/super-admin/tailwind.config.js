module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0f172a',
          secondary: '#1e293b',
          tertiary: '#334155',
        },
        foreground: {
          DEFAULT: '#f1f5f9',
          secondary: '#cbd5e1',
          muted: '#64748b',
        },
        primary: {
          DEFAULT: '#8b5cf6',
          hover: '#7c3aed',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}
