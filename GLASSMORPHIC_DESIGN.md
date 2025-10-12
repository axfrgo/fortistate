# 🌊 Glassmorphic Design System

## Overview
This document outlines the glassmorphic (frosted glass) design system applied to the Visual Studio side menus (Universe Tree and Sidebar). This style creates a modern, translucent interface with depth and visual hierarchy.

## Core Principles

### 1. **Transparency & Blur**
The glassmorphic effect relies on semi-transparent backgrounds combined with backdrop blur to create a frosted glass appearance.

```css
background: linear-gradient(135deg,
  rgba(240, 245, 255, 0.12) 0%,
  rgba(230, 235, 250, 0.08) 100%);
backdrop-filter: blur(24px) saturate(180%);
-webkit-backdrop-filter: blur(24px) saturate(180%);
```

### 2. **Layered Depth**
Multiple layers of transparency create visual depth:
- **Base Layer**: 8-12% opacity with 24px blur
- **Interactive Elements**: 4-8% opacity with 16px blur
- **Active States**: 16-22% opacity with 20px blur

### 3. **Subtle Borders**
Glass panels use light, semi-transparent borders to define edges without harsh lines:
```css
border: 1px solid rgba(167, 139, 250, 0.18);
```

## Color Palette

### Base Backgrounds
- **Primary Glass**: `rgba(240, 245, 255, 0.12)` → Light blue-white tint
- **Secondary Glass**: `rgba(230, 235, 250, 0.08)` → Subtle purple-tint
- **Accent Glass**: `rgba(167, 139, 250, 0.08)` → Purple highlight

### Interactive States
- **Hover**: Increase opacity by 4-6%, enhance blur to 20px
- **Active**: Increase opacity to 16-22%, add colored glow
- **Focus**: Add stronger border color with higher saturation

### Text Colors (Dark on Light Glass)
- **Primary Text**: `rgba(40, 40, 70, 0.9)` - Deep blue-gray
- **Secondary Text**: `rgba(60, 60, 100, 0.75)` - Medium blue-gray
- **Tertiary Text**: `rgba(80, 80, 120, 0.65)` - Light blue-gray

## Shadow System

### Elevation Levels
```css
/* Level 1: Subtle presence */
box-shadow: 
  0 2px 8px rgba(0, 0, 0, 0.04),
  inset 0 1px 0 rgba(255, 255, 255, 0.1);

/* Level 2: Interactive hover */
box-shadow: 
  0 6px 20px rgba(139, 92, 246, 0.15),
  inset 0 1px 0 rgba(255, 255, 255, 0.15);

/* Level 3: Active/focused */
box-shadow: 
  0 0 24px rgba(139, 92, 246, 0.3),
  0 4px 16px rgba(167, 139, 250, 0.2),
  inset 0 1px 0 rgba(255, 255, 255, 0.2);
```

## Component Recipes

### Floating Action Buttons (Agent Insights, Code Generator)
```css
.button {
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.08) 100%);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(167, 139, 250, 0.25);
  box-shadow: 
    0 4px 16px rgba(139, 92, 246, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.button:hover {
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.18) 0%,
    rgba(255, 255, 255, 0.12) 100%);
  backdrop-filter: blur(24px) saturate(200%);
  transform: translateY(-3px) scale(1.05);
  box-shadow: 
    0 8px 24px rgba(139, 92, 246, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
```

### Context Menu (Right-Click Menu)
```css
.context-menu {
  background: linear-gradient(135deg,
    rgba(240, 245, 255, 0.14) 0%,
    rgba(230, 235, 250, 0.1) 100%);
  backdrop-filter: blur(24px) saturate(180%);
  border: 2px solid rgba(167, 139, 250, 0.25);
  border-radius: 14px;
  box-shadow: 
    0 12px 40px rgba(139, 92, 246, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.context-menu-item:hover {
  background: linear-gradient(135deg,
    rgba(167, 139, 250, 0.18) 0%,
    rgba(167, 139, 250, 0.12) 100%);
  backdrop-filter: blur(16px);
}
```

### Universe Tree Menu
```css
.universe-tree {
  background: linear-gradient(135deg, 
    rgba(240, 245, 255, 0.12) 0%, 
    rgba(230, 235, 250, 0.08) 100%);
  backdrop-filter: blur(24px) saturate(180%);
  border-right: 1px solid rgba(167, 139, 250, 0.18);
  box-shadow: 
    2px 0 20px rgba(139, 92, 246, 0.08),
    inset 0 0 60px rgba(255, 255, 255, 0.03);
}
```

### Branch/Card Elements
```css
.branch-content {
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.04) 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px) saturate(120%);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.branch-content:hover {
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.14) 0%,
    rgba(255, 255, 255, 0.08) 100%);
  backdrop-filter: blur(20px) saturate(140%);
  border-color: rgba(167, 139, 250, 0.35);
  transform: translateX(6px) scale(1.02);
}
```

### Template Cards
```css
.template-card {
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.04) 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px) saturate(120%);
}

.template-card:hover {
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.14) 0%,
    rgba(255, 255, 255, 0.08) 100%);
  backdrop-filter: blur(20px) saturate(140%);
  transform: translateY(-3px) scale(1.02);
}
```

## Interaction Patterns

### Hover Behavior
1. **Increase Background Opacity**: +4-6% opacity
2. **Enhance Blur**: 16px → 20px
3. **Strengthen Border**: Increase alpha by 0.1-0.15
4. **Add Transform**: Slight translation + scale (1.02)
5. **Elevate Shadow**: Add colored glow with purple accent

### Active/Selected State
1. **Maximum Opacity**: 16-22% for clear visibility
2. **Strong Border**: Purple accent with 0.5 alpha
3. **Prominent Glow**: Multiple shadow layers with 0.3 alpha
4. **Saturated Blur**: 160% saturation for richness

### Transition Timing
```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

## Browser Compatibility

### Backdrop Filter Support
```css
backdrop-filter: blur(24px) saturate(180%);
-webkit-backdrop-filter: blur(24px) saturate(180%);
```

Always include both standard and webkit-prefixed versions for maximum compatibility.

### Fallback Strategy
For browsers that don't support backdrop-filter, the semi-transparent backgrounds will still work, just without the blur effect.

## Contrast with Neumorphic Design

The app uses **two complementary design systems**:

### Glassmorphic (Side Menus)
- ✨ Transparent backgrounds
- 🌫️ Backdrop blur effects
- 🎨 Light tinted glass
- 📏 Subtle borders
- 🔮 Layered depth

### Neumorphic (Main Panels)
- ⚪ Solid light backgrounds
- 🌓 Dual-direction shadows
- 💡 Raised/inset effects
- 🎭 Soft, touchable surfaces
- 🧊 Sculptural depth

This combination creates visual hierarchy where:
- **Glass menus** = Navigation & browsing (ethereal, floating)
- **Neumorphic panels** = Content & actions (solid, interactive)

## Accessibility Considerations

### Text Contrast
All text colors maintain WCAG AA contrast ratios:
- Primary text: 4.5:1 minimum
- Secondary text: 3:1 minimum
- Interactive elements: Clear hover/focus states

### Focus Indicators
Always provide visible focus states with stronger borders and glows:
```css
.element:focus-visible {
  outline: none;
  border-color: rgba(167, 139, 250, 0.6);
  box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.2);
}
```

## Performance Tips

1. **Limit Blur Radius**: Use 16-24px max to avoid performance issues
2. **Use Transform**: Prefer `transform` over position changes for animations
3. **GPU Acceleration**: Blur effects are GPU-accelerated in modern browsers
4. **Layer Count**: Keep backdrop-filter layers to minimum necessary

## Files Using Glassmorphic Design

### Side Panels & Navigation
- `packages/visual-studio/src/components/UniverseTree.css` - Universe/narrative side menu
- `packages/visual-studio/src/components/Sidebar.css` - Left template menu  
- `packages/visual-studio/src/components/NarrativePanel.css` - Right narrative execution panel

### Interactive Elements
- `packages/visual-studio/src/App.css` - Agent Insights toggle button
- `packages/visual-studio/src/components/CodeGenerator.css` - Generate Code toggle button
- `packages/visual-studio/src/components/ContextMenu.css` - Right-click context menu

## Future Enhancements

- [ ] Add glassmorphic tooltips
- [ ] Create glassmorphic dropdown menus
- [ ] Design glassmorphic modal overlays
- [ ] Implement glass loading states
- [ ] Add glass success/error notifications

---

**Style Guide Version**: 1.0  
**Last Updated**: 2024  
**Maintainer**: Visual Studio Team
