# Fortistate Design System

Shared design system for Fortistate applications with VS Code aesthetic.

## 📦 Package Contents

- **Design Tokens** - Color, typography, spacing, shadows, etc.
- **Tailwind Config** - Pre-configured Tailwind preset
- **Global Styles** - VS Code-inspired component classes and utilities

## 🚀 Installation

```bash
# From within the monorepo
npm install
```

## 💻 Usage

### Import Design Tokens (JavaScript/TypeScript)

```javascript
import { colors, typography, spacing } from '@fortistate/design-system';

// Or import specific tokens
import { designTokens } from '@fortistate/design-system/tokens';

// Use in your components
const MyComponent = () => (
  <div style={{ color: colors.accent.primary, padding: spacing[6] }}>
    Hello World
  </div>
);
```

### Use Tailwind Config

In your `tailwind.config.js`:

```javascript
const fortiDesign = require('@fortistate/design-system/tailwind');

module.exports = {
  presets: [fortiDesign],
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  // Your custom config here
};
```

### Import Global Styles

In your app entry point:

```javascript
import '@fortistate/design-system/css';
```

## 🎨 Design Tokens

### Colors

```javascript
colors.accent.primary          // rgba(167, 139, 250, 1) - Purple accent
colors.accent.secondary        // rgba(236, 72, 153, 1) - Pink accent
colors.status.success          // #89d185 - Green
colors.status.warning          // #cca700 - Amber
colors.status.error            // #f48771 - Red
colors.status.info             // #007acc - Blue
```

### Typography

```javascript
typography.fontFamily.sans     // System font stack
typography.fontSize.base       // 13px
typography.fontWeight.medium   // 500
```

### Spacing (4px grid)

```javascript
spacing[1]  // 4px
spacing[2]  // 8px
spacing[3]  // 12px
spacing[6]  // 24px
```

## 🎯 Utility Classes

### VS Code Components

```html
<!-- Panel with blur effect -->
<div class="vscode-panel">...</div>

<!-- Interactive card -->
<div class="vscode-card">...</div>

<!-- Button -->
<button class="vscode-button">Click me</button>

<!-- Input -->
<input class="vscode-input" placeholder="Type here..." />
```

### Effects

```html
<!-- Backdrop blur -->
<div class="backdrop-blur-strong">...</div>

<!-- Text gradient -->
<span class="text-gradient-primary">Gradient Text</span>

<!-- Hover effects -->
<div class="hover-lift">Lifts on hover</div>
<div class="hover-scale">Scales on hover</div>
```

### Status Indicators

```html
<span class="status-dot success"></span>
<span class="status-dot warning"></span>
<span class="status-dot error"></span>
<span class="status-dot info"></span>
```

## 📚 Documentation

Full design system documentation available at:
`packages/visual-studio/DESIGN_SYSTEM.md`

## 🔗 Integration

This design system is used by:
- **Visual Studio** - Fortistate Visual Studio Code extension
- **User Admin** - Organization-facing admin dashboard
- **Super Admin** - Platform-wide admin dashboard (partial)

## 🎨 Design Principles

1. **VS Code Aesthetic** - Matches VS Code Dark+ theme
2. **Purple Accent** - Primary interactive color (#a78bfa)
3. **Glassmorphism** - Translucent backgrounds with backdrop blur
4. **4px Grid** - All spacing uses 4px increments
5. **Smooth Transitions** - 200ms cubic-bezier animations
6. **Accessibility** - WCAG AA compliant contrast ratios

## 📝 License

MIT
