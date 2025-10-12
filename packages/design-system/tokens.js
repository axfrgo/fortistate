/**
 * Fortistate Design System - Design Tokens
 * Based on Visual Studio package with VS Code aesthetic
 * 
 * NOTE: These tokens are READ-ONLY exports. They do not modify the Visual Studio package.
 * They are extracted references for use in other applications (User Admin, etc.)
 */

export const designTokens = {
  // Color System
  colors: {
    // Primary Accent (Purple)
    accent: {
      primary: 'rgba(167, 139, 250, 1)',
      primaryLight: 'rgba(167, 139, 250, 0.5)',
      primarySubtle: 'rgba(167, 139, 250, 0.12)',
      primaryBorder: 'rgba(167, 139, 250, 0.15)',
      primaryHover: 'rgba(167, 139, 250, 0.25)',
      primaryFocus: 'rgba(167, 139, 250, 0.4)',
      secondary: 'rgba(236, 72, 153, 1)', // Pink accent
    },
    
    // Backgrounds
    background: {
      app: '#242424',
      panel: 'rgba(20, 20, 31, 0.85)',
      header: 'rgba(10, 10, 15, 0.6)',
      card: 'rgba(255, 255, 255, 0.03)',
      cardHover: 'rgba(255, 255, 255, 0.06)',
      button: 'rgba(255, 255, 255, 0.04)',
      buttonHover: 'rgba(167, 139, 250, 0.12)',
      sectionHighlight: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
    },
    
    // Text Colors
    text: {
      primary: '#ffffff',
      primaryMuted: 'rgba(255, 255, 255, 0.87)',
      secondary: 'rgba(255, 255, 255, 0.7)',
      tertiary: 'rgba(255, 255, 255, 0.5)',
    },
    
    // Border Colors
    border: {
      default: 'rgba(255, 255, 255, 0.06)',
      subtle: 'rgba(255, 255, 255, 0.05)',
      accent: 'rgba(167, 139, 250, 0.15)',
      hover: 'rgba(167, 139, 250, 0.25)',
      focus: 'rgba(167, 139, 250, 0.4)',
    },
    
    // Status Colors (VS Code inspired)
    status: {
      success: '#89d185',
      warning: '#cca700',
      error: '#f48771',
      info: '#007acc',
    },
    
    // Link Colors
    link: {
      default: '#646cff',
      hover: '#535bf2',
    },
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Roboto', sans-serif",
      mono: "'Consolas', 'Monaco', 'Courier New', monospace",
    },
    fontSize: {
      xs: '11px',
      sm: '12px',
      base: '13px',
      md: '15px',
      lg: '18px',
      xl: '32px',
      '2xl': '3.2em',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    letterSpacing: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.05em',
    },
    lineHeight: {
      none: 1,
      tight: 1.1,
      snug: 1.3,
      normal: 1.5,
    },
  },
  
  // Spacing (4px base unit)
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    14: '56px',
  },
  
  // Gap (common spacing between elements)
  gap: {
    xs: '6px',
    sm: '8px',
    md: '12px',
    lg: '20px',
    xl: '24px',
  },
  
  // Border Radius
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    sm: '0 2px 8px rgba(167, 139, 250, 0.2)',
    md: '0 4px 12px rgba(167, 139, 250, 0.15)',
    lg: '0 4px 16px rgba(167, 139, 250, 0.4)',
    xl: '2px 0 24px rgba(0, 0, 0, 0.3)',
    inset: '0 1px 0 0 rgba(255, 255, 255, 0.03) inset',
  },
  
  // Effects
  effects: {
    backdropBlur: {
      strong: 'blur(40px) saturate(180%)',
      medium: 'blur(20px) saturate(180%)',
      light: 'blur(10px)',
    },
    dropShadow: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
  },
  
  // Transitions
  transitions: {
    fast: 'all 0.2s ease',
    medium: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 0.3s ease',
    border: 'border-color 0.25s',
    transform: 'transform 0.2s ease',
  },
  
  // Component-specific sizes
  components: {
    header: {
      height: '56px',
      padding: '0 24px',
    },
    sidebar: {
      width: '320px',
      padding: '24px',
    },
    card: {
      padding: '16px 12px',
    },
    button: {
      padding: '6px 12px',
    },
  },
};

// Export individual token categories for convenience
export const { colors, typography, spacing, gap, radius, shadows, effects, transitions, components } = designTokens;

export default designTokens;
