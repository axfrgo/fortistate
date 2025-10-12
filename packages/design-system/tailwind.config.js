/**
 * Fortistate Design System - Tailwind Configuration
 * Provides Tailwind CSS config that can be extended by consuming applications
 * 
 * Usage in consuming app's tailwind.config.js:
 * ```js
 * const fortiDesign = require('@fortistate/design-system/tailwind');
 * module.exports = {
 *   presets: [fortiDesign],
 *   // Your custom config here
 * }
 * ```
 */

module.exports = {
  theme: {
    extend: {
      colors: {
        // Accent colors
        'accent-primary': 'rgba(167, 139, 250, 1)',
        'accent-primary-light': 'rgba(167, 139, 250, 0.5)',
        'accent-primary-subtle': 'rgba(167, 139, 250, 0.12)',
        'accent-secondary': 'rgba(236, 72, 153, 1)',
        
        // Status colors
        'status-success': '#89d185',
        'status-warning': '#cca700',
        'status-error': '#f48771',
        'status-info': '#007acc',
        
        // Link colors
        'link': '#646cff',
        'link-hover': '#535bf2',
        
        // VS Code color aliases
        'vscode': {
          bg: '#1e1e1e',
          fg: '#d4d4d4',
          sidebar: '#252526',
          statusbar: '#007acc',
          selection: '#264f78',
          border: 'rgba(255, 255, 255, 0.06)',
        },
      },
      
      backgroundColor: {
        'panel': 'rgba(20, 20, 31, 0.85)',
        'header': 'rgba(10, 10, 15, 0.6)',
        'card': 'rgba(255, 255, 255, 0.03)',
        'card-hover': 'rgba(255, 255, 255, 0.06)',
        'button': 'rgba(255, 255, 255, 0.04)',
        'button-hover': 'rgba(167, 139, 250, 0.12)',
      },
      
      textColor: {
        'primary': '#ffffff',
        'primary-muted': 'rgba(255, 255, 255, 0.87)',
        'secondary': 'rgba(255, 255, 255, 0.7)',
        'tertiary': 'rgba(255, 255, 255, 0.5)',
      },
      
      borderColor: {
        'default': 'rgba(255, 255, 255, 0.06)',
        'subtle': 'rgba(255, 255, 255, 0.05)',
        'accent': 'rgba(167, 139, 250, 0.15)',
        'accent-hover': 'rgba(167, 139, 250, 0.25)',
        'accent-focus': 'rgba(167, 139, 250, 0.4)',
      },
      
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Inter',
          'Roboto',
          'sans-serif',
        ],
        mono: ['Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      
      fontSize: {
        'xs': '11px',
        'sm': '12px',
        'base': '13px',
        'md': '15px',
        'lg': '18px',
        'xl': '32px',
      },
      
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '14': '56px',
      },
      
      gap: {
        'xs': '6px',
        'sm': '8px',
        'md': '12px',
        'lg': '20px',
        'xl': '24px',
      },
      
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'DEFAULT': '8px',
      },
      
      boxShadow: {
        'sm': '0 2px 8px rgba(167, 139, 250, 0.2)',
        'md': '0 4px 12px rgba(167, 139, 250, 0.15)',
        'lg': '0 4px 16px rgba(167, 139, 250, 0.4)',
        'xl': '2px 0 24px rgba(0, 0, 0, 0.3)',
        'inset': '0 1px 0 0 rgba(255, 255, 255, 0.03) inset',
        'glow': '0 0 20px rgba(167, 139, 250, 0.5)',
      },
      
      backdropBlur: {
        'strong': '40px',
        'medium': '20px',
        'light': '10px',
      },
      
      transitionDuration: {
        'fast': '200ms',
        'medium': '300ms',
      },
      
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      
      animation: {
        'slide-in-left': 'slideInFromLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      
      keyframes: {
        slideInFromLeft: {
          'from': {
            transform: 'translateX(-100%)',
            opacity: '0',
          },
          'to': {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        pulseGlow: {
          '0%, 100%': {
            boxShadow: '0 0 10px rgba(167, 139, 250, 0.3)',
          },
          '50%': {
            boxShadow: '0 0 20px rgba(167, 139, 250, 0.6)',
          },
        },
      },
    },
  },
  plugins: [],
};
