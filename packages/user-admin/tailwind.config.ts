import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  
  theme: {
    extend: {
      colors: {
        // Accent colors
        'accent-primary': 'rgba(167, 139, 250, 1)',
        'accent-secondary': 'rgba(236, 72, 153, 1)',
        
        // Status colors
        'status-success': '#89d185',
        'status-warning': '#cca700',
        'status-error': '#f48771',
        'status-info': '#007acc',
        
        // VS Code themed colors
        'vscode-background': '#242424',
        'vscode-panel': 'rgba(20, 20, 31, 0.85)',
        'vscode-sidebar': '#252526',
        'vscode-card': 'rgba(255, 255, 255, 0.03)',
        'vscode-card-hover': 'rgba(255, 255, 255, 0.06)',
        'vscode-button': 'rgba(255, 255, 255, 0.04)',
        'vscode-button-hover': 'rgba(167, 139, 250, 0.12)',
        'vscode-text': 'rgba(255, 255, 255, 0.9)',
        'vscode-text-secondary': 'rgba(255, 255, 255, 0.7)',
        'vscode-text-tertiary': 'rgba(255, 255, 255, 0.5)',
        'vscode-border': 'rgba(255, 255, 255, 0.1)',
        'vscode-border-hover': 'rgba(167, 139, 250, 0.3)',
        'vscode-border-focus': 'rgba(167, 139, 250, 0.6)',
      },
      
      fontFamily: {
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      
      boxShadow: {
        'glow-sm': '0 0 10px rgba(167, 139, 250, 0.3)',
        'glow-md': '0 0 20px rgba(167, 139, 250, 0.4)',
        'glow-lg': '0 0 30px rgba(167, 139, 250, 0.5)',
      },
      
      animation: {
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      
      keyframes: {
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(167, 139, 250, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(167, 139, 250, 0.6)' },
        },
      },
    },
  },
  
  plugins: [],
};

export default config;
