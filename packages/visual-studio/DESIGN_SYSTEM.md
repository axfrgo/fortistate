# Visual Studio Design System Documentation

**Extracted:** October 2025  
**Purpose:** Foundation for User-Facing Admin Dashboard styling alignment

---

## 🎨 Color Palette

### Background Colors
```css
/* Primary Backgrounds */
--bg-primary: linear-gradient(135deg, #0f0c29 0%, #171b34 25%, #24243e 50%, #302b63 75%, #24243e 100%)
--bg-app: #242424 (fallback solid)

/* Panel Backgrounds */
--bg-panel: rgba(20, 20, 31, 0.85)
--bg-header: rgba(10, 10, 15, 0.6)
--bg-section-highlight: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)

/* Card/Interactive Backgrounds */
--bg-card: rgba(255, 255, 255, 0.03)
--bg-card-hover: rgba(255, 255, 255, 0.06)
--bg-button: rgba(255, 255, 255, 0.04)
--bg-button-hover: rgba(167, 139, 250, 0.12)
```

### Accent Colors
```css
/* Primary Accent (Purple) */
--accent-primary: #a78bfa (rgb(167, 139, 250))
--accent-primary-light: rgba(167, 139, 250, 0.5)
--accent-primary-subtle: rgba(167, 139, 250, 0.12)

/* Secondary Accent (Pink) */
--accent-secondary: #ec4899 (rgb(236, 72, 153))

/* Interactive Blue */
--accent-blue: #646cff
--accent-blue-hover: #535bf2

/* Link Color */
--link-color: #646cff
--link-hover: #535bf2
```

### Text Colors
```css
/* Primary Text */
--text-primary: #ffffff
--text-primary-muted: rgba(255, 255, 255, 0.87)
--text-secondary: rgba(255, 255, 255, 0.7)
--text-tertiary: rgba(255, 255, 255, 0.5)

/* Specific Use Cases */
--text-heading: #ffffff
--text-brand: linear-gradient(135deg, #ffffff 0%, #a78bfa 100%)
```

### Border Colors
```css
--border-default: rgba(255, 255, 255, 0.06)
--border-accent: rgba(167, 139, 250, 0.15)
--border-hover: rgba(167, 139, 250, 0.25)
--border-focus: rgba(167, 139, 250, 0.4)
```

### Status Colors
```css
/* Success (Green) - use from VS Code */
--status-success: #89d185

/* Warning (Amber) - use from VS Code */
--status-warning: #cca700

/* Error (Red) - use from VS Code */
--status-error: #f48771

/* Info (Blue) */
--status-info: #007acc
```

---

## 🔤 Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Roboto', sans-serif;
/* Alternative: system-ui, Avenir, Helvetica, Arial, sans-serif */
```

### Font Sizes
```css
--text-xs: 11px      /* Product subtitle, meta info */
--text-sm: 12px      /* Panel toggles, small labels */
--text-base: 13px    /* Body text, template names */
--text-md: 15px      /* Brand name, section headers */
--text-lg: 18px      /* Icon labels */
--text-xl: 32px      /* Large icons */
--text-2xl: 3.2em    /* Headings (h1) */
```

### Font Weights
```css
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
```

### Letter Spacing
```css
--tracking-tight: -0.02em  /* Brand name */
--tracking-normal: 0
--tracking-wide: 0.05em    /* Product name, uppercase labels */
```

### Line Heights
```css
--leading-none: 1
--leading-tight: 1.1
--leading-snug: 1.3
--leading-normal: 1.5
```

---

## 📐 Spacing System

### Base Unit: 4px

```css
/* Spacing Scale */
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
--space-8: 32px
--space-10: 40px
--space-12: 48px
--space-14: 56px

/* Common Gaps */
--gap-xs: 6px
--gap-sm: 8px
--gap-md: 12px
--gap-lg: 20px
--gap-xl: 24px
```

### Component Padding
```css
/* Header */
--header-height: 56px
--header-padding: 0 24px

/* Sidebar */
--sidebar-width: 320px
--sidebar-padding: 24px

/* Cards */
--card-padding: 16px 12px
--button-padding: 6px 12px
```

---

## 🎯 Border Radius

```css
--radius-sm: 4px      /* Scrollbars */
--radius-md: 8px      /* Cards, buttons, inputs */
--radius-lg: 12px     /* Larger panels */
--radius-full: 9999px /* Circular elements */
```

---

## 🌈 Effects & Filters

### Backdrop Blur (Glassmorphism)
```css
/* Strong Blur */
backdrop-filter: blur(40px) saturate(180%);
-webkit-backdrop-filter: blur(40px) saturate(180%);

/* Medium Blur */
backdrop-filter: blur(20px) saturate(180%);
-webkit-backdrop-filter: blur(20px) saturate(180%);

/* Light Blur */
backdrop-filter: blur(10px);
```

### Box Shadows
```css
/* Elevation Levels */
--shadow-sm: 0 2px 8px rgba(167, 139, 250, 0.2)
--shadow-md: 0 4px 12px rgba(167, 139, 250, 0.15)
--shadow-lg: 0 4px 16px rgba(167, 139, 250, 0.4)
--shadow-xl: 2px 0 24px rgba(0, 0, 0, 0.3)

/* Inner Shadows (Inset) */
box-shadow: 0 1px 0 0 rgba(255, 255, 255, 0.03) inset;
```

### Drop Shadow (for icons)
```css
filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
```

---

## 🎬 Animations & Transitions

### Transition Timing
```css
/* Standard Transitions */
transition: all 0.2s ease;
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
transition: border-color 0.25s;
transition: transform 0.2s ease;

/* Slide In Animation */
animation: slideInFromLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1);

@keyframes slideInFromLeft {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

### Hover Effects
```css
/* Lift Effect */
:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(167, 139, 250, 0.15);
}

/* Scale Effect */
:hover {
  transform: scale(1.05);
}

/* Card Hover */
:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}
```

### Active States
```css
:active {
  transform: translateY(0);
}
```

---

## 🖱️ Interactive Elements

### Buttons
```css
.button {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  user-select: none;
}

.button:hover {
  background: rgba(167, 139, 250, 0.12);
  border-color: rgba(167, 139, 250, 0.25);
  color: rgba(255, 255, 255, 0.95);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(167, 139, 250, 0.15);
}

.button:active {
  transform: translateY(0);
}

.button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}
```

### Cards
```css
.card {
  padding: 16px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}
```

### Logo/Icon
```css
.logo-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%);
  border-radius: 8px;
  border: 1px solid rgba(167, 139, 250, 0.3);
  box-shadow: 0 2px 8px rgba(167, 139, 250, 0.2);
  transition: all 0.3s ease;
}

.logo-icon:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(167, 139, 250, 0.4);
}
```

---

## 📜 Scrollbars

```css
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

::-webkit-scrollbar-thumb {
  background: rgba(167, 139, 250, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(167, 139, 250, 0.5);
}
```

---

## 🎨 Gradient Patterns

### Background Gradients
```css
/* Main App Background */
background: linear-gradient(135deg, #0f0c29 0%, #171b34 25%, #24243e 50%, #302b63 75%, #24243e 100%);

/* Section Highlight */
background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);

/* Logo Background */
background: linear-gradient(135deg, rgba(167, 139, 250, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%);

/* Text Gradient */
background: linear-gradient(135deg, #ffffff 0%, #a78bfa 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
```

### Border Gradients
```css
/* Decorative Header Border */
background: linear-gradient(90deg, 
  transparent 0%,
  rgba(167, 139, 250, 0.5) 50%,
  transparent 100%);
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First Approach */
--breakpoint-sm: 640px
--breakpoint-md: 768px
--breakpoint-lg: 1024px
--breakpoint-xl: 1280px
--breakpoint-2xl: 1536px
```

---

## ♿ Accessibility

### Focus States
```css
:focus,
:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}
```

### User Select
```css
user-select: none; /* For interactive UI elements */
```

### Font Smoothing
```css
font-synthesis: none;
text-rendering: optimizeLegibility;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

---

## 🎭 Component Patterns

### Panel/Sidebar Structure
```
.sidebar
  ├── background: rgba(20, 20, 31, 0.85)
  ├── backdrop-filter: blur(20px) saturate(180%)
  ├── border-right: 1px solid rgba(167, 139, 250, 0.15)
  ├── width: 320px
  ├── padding: 24px
  └── animation: slideInFromLeft 0.3s
```

### Header Structure
```
.header
  ├── background: rgba(10, 10, 15, 0.6)
  ├── backdrop-filter: blur(40px) saturate(180%)
  ├── height: 56px
  ├── border-bottom: 1px solid rgba(167, 139, 250, 0.12)
  └── z-index: 100
```

### Grid Layout (2-column)
```css
display: grid;
grid-template-columns: repeat(2, minmax(0, 1fr));
gap: 12px;
```

---

## 🎨 VS Code Color Mapping

For User Admin Dashboard alignment:

| Visual Studio | VS Code Equivalent | Hex |
|--------------|-------------------|-----|
| Purple Accent (#a78bfa) | Editor Selection | #264f78 |
| Blue Link (#646cff) | Links | #3794ff |
| Success Green | Terminal Green | #89d185 |
| Warning Amber | Warning | #cca700 |
| Error Red | Error | #f48771 |
| Panel BG | Editor BG Dark+ | #1e1e1e |
| Sidebar BG | Sidebar BG | #252526 |
| Status Bar BG | Status Bar BG | #007acc |

---

## 📦 Reusable Token Structure

```typescript
export const designTokens = {
  colors: {
    accent: {
      primary: 'rgba(167, 139, 250, 1)',
      primaryLight: 'rgba(167, 139, 250, 0.5)',
      primarySubtle: 'rgba(167, 139, 250, 0.12)',
      secondary: 'rgba(236, 72, 153, 1)',
    },
    background: {
      panel: 'rgba(20, 20, 31, 0.85)',
      card: 'rgba(255, 255, 255, 0.03)',
      cardHover: 'rgba(255, 255, 255, 0.06)',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      tertiary: 'rgba(255, 255, 255, 0.5)',
    },
    border: {
      default: 'rgba(255, 255, 255, 0.06)',
      accent: 'rgba(167, 139, 250, 0.15)',
      hover: 'rgba(167, 139, 250, 0.25)',
    },
  },
  spacing: {
    xs: '6px',
    sm: '8px',
    md: '12px',
    lg: '20px',
    xl: '24px',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
  shadows: {
    sm: '0 2px 8px rgba(167, 139, 250, 0.2)',
    md: '0 4px 12px rgba(167, 139, 250, 0.15)',
    lg: '0 4px 16px rgba(167, 139, 250, 0.4)',
  },
};
```

---

## ✅ Usage Guidelines for User Admin

1. **Import this design system** - All colors, spacing, typography must match
2. **Maintain purple accent** - Primary interactive color is #a78bfa
3. **Use glassmorphism** - Backdrop blur + translucent backgrounds
4. **Animate transitions** - All interactions should have smooth 0.2s transitions
5. **Follow spacing grid** - 4px base unit for all margins/padding
6. **Match scrollbar styling** - Purple-tinted scrollbars with hover state
7. **Replicate hover effects** - Lift, scale, and glow on interactive elements
8. **Use gradient patterns** - For backgrounds, text, and borders
9. **Maintain accessibility** - Focus states, font smoothing, proper contrast
10. **Test responsiveness** - Ensure mobile-first design with collapsible elements

---

**Next Steps:**
- Create `/packages/design-system` with exportable tokens
- Build Tailwind config that generates these classes
- Create component library with these patterns
- Ensure User Admin imports and extends this system
