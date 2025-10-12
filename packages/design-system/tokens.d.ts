/**
 * Fortistate Design System - TypeScript Definitions
 */

export interface DesignTokens {
  colors: {
    accent: {
      primary: string;
      primaryLight: string;
      primarySubtle: string;
      primaryBorder: string;
      primaryHover: string;
      primaryFocus: string;
      secondary: string;
    };
    background: {
      app: string;
      panel: string;
      header: string;
      card: string;
      cardHover: string;
      button: string;
      buttonHover: string;
      sectionHighlight: string;
    };
    text: {
      primary: string;
      primaryMuted: string;
      secondary: string;
      tertiary: string;
    };
    border: {
      default: string;
      subtle: string;
      accent: string;
      hover: string;
      focus: string;
    };
    status: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
    link: {
      default: string;
      hover: string;
    };
  };
  typography: {
    fontFamily: {
      sans: string;
      mono: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    letterSpacing: {
      tight: string;
      normal: string;
      wide: string;
    };
    lineHeight: {
      none: number;
      tight: number;
      snug: number;
      normal: number;
    };
  };
  spacing: {
    [key: string]: string;
  };
  gap: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    inset: string;
  };
  effects: {
    backdropBlur: {
      strong: string;
      medium: string;
      light: string;
    };
    dropShadow: string;
  };
  transitions: {
    fast: string;
    medium: string;
    slow: string;
    border: string;
    transform: string;
  };
  components: {
    header: {
      height: string;
      padding: string;
    };
    sidebar: {
      width: string;
      padding: string;
    };
    card: {
      padding: string;
    };
    button: {
      padding: string;
    };
  };
}

export declare const designTokens: DesignTokens;
export declare const colors: DesignTokens['colors'];
export declare const typography: DesignTokens['typography'];
export declare const spacing: DesignTokens['spacing'];
export declare const gap: DesignTokens['gap'];
export declare const radius: DesignTokens['radius'];
export declare const shadows: DesignTokens['shadows'];
export declare const effects: DesignTokens['effects'];
export declare const transitions: DesignTokens['transitions'];
export declare const components: DesignTokens['components'];

export default designTokens;
