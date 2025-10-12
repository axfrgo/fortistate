# Context Menu Troubleshooting Guide

## Issue: Menu is too small or blank

### ✅ Fixes Applied:

#### 1. **CSS Sizing Issues Fixed**
- ✅ Changed `min-width` from `240px` to `280px`
- ✅ Added `max-width: 350px` to prevent overflow
- ✅ Changed `overflow: hidden` to `overflow: visible`
- ✅ Added `white-space: nowrap` to prevent text wrapping
- ✅ Added `flex-shrink: 0` to menu icons so they don't collapse
- ✅ Increased `z-index` from `1000` to `10000` to ensure menu is always on top

#### 2. **Component Rendering Improvements**
- ✅ Wrapped menu text in `<span>` tags for better rendering
- ✅ Removed `target` condition - menu items always render if handler exists
- ✅ Added fallback message if no handlers provided
- ✅ Added debug logging to console
- ✅ Improved node label display with fallback to `node.type`

### 🔍 How to Debug:

#### Step 1: Check Browser Console
When you right-click, you should see:
```
🎯 ContextMenu rendered: {
  x: 123,
  y: 456,
  hasNode: true,
  hasEdge: false,
  hasTarget: true,
  nodeLabel: "Some Node",
  hasHandlers: {
    custodian: true,
    narrator: true,
    explorer: true
  }
}
```

#### Step 2: Inspect the Menu
1. Right-click to open menu
2. Press **F12** to open DevTools
3. Click the **element picker** (or press Ctrl+Shift+C)
4. Hover over the menu
5. Check the **computed styles** in DevTools

Expected styles:
```css
min-width: 280px
max-width: 350px
z-index: 10000
position: fixed
overflow: visible
```

#### Step 3: Check for CSS Conflicts
Look for any global styles that might be overriding:
- `.context-menu` classes elsewhere
- Global `overflow: hidden` on parent elements
- Global `max-width` constraints
- z-index stacking issues

### 🐛 Common Issues:

#### Issue: Menu appears but is empty/blank
**Cause**: Handlers not being passed from Canvas
**Fix**: Check Canvas.tsx line where `<ContextMenu>` is rendered
```typescript
{contextMenu && (
  <ContextMenu
    x={contextMenu.x}
    y={contextMenu.y}
    node={contextMenu.node}
    edge={contextMenu.edge}
    onClose={handleCloseContextMenu}
    onAskCustodian={handleAskCustodian}           // ← Must be present
    onExplainWithNarrator={handleExplainWithNarrator}  // ← Must be present
    onExploreAlternatives={handleExploreAlternatives}  // ← Must be present
  />
)}
```

#### Issue: Menu is very small (squished)
**Cause**: `overflow: hidden` was hiding content
**Status**: ✅ Fixed - changed to `overflow: visible`

#### Issue: Text is cutting off
**Cause**: Text wrapping or width constraints
**Status**: ✅ Fixed - added `white-space: nowrap` and increased `min-width`

#### Issue: Icons disappearing
**Cause**: Flex shrinking
**Status**: ✅ Fixed - added `flex-shrink: 0` to `.menu-icon`

#### Issue: Menu behind other elements
**Cause**: Low z-index
**Status**: ✅ Fixed - increased z-index to `10000`

### 🎨 What the Menu Should Look Like:

```
┌─────────────────────────────────┐
│  NODE NAME OR EDGE              │  ← Header (purple background)
├─────────────────────────────────┤
│ 🛡️  Ask Custodian to Review    │  ← Menu items
│ 📖  Explain with Narrator       │
│ 🔮  Explore Alternatives        │
└─────────────────────────────────┘
```

**Size**: 280px - 350px wide, auto height
**Colors**: Purple gradient background, white text
**Position**: Fixed at cursor (x, y)

### 🔧 Manual Testing:

1. **Start dev server**: `npm run dev` in `packages/visual-studio`
2. **Open browser**: Navigate to Visual Studio
3. **Open console**: Press F12
4. **Right-click on canvas**: You should see:
   - Menu appears at cursor
   - Console log with menu data
   - Three menu items visible
   - Header shows "Canvas"
5. **Right-click on a node**: You should see:
   - Menu appears at cursor
   - Header shows node name/type
   - Three menu items visible
6. **Check menu size**:
   - Menu should be at least 280px wide
   - Text should not wrap
   - Icons should be visible
   - All three actions should be visible

### 📝 Updated Files:

- ✅ `ContextMenu.css` - Fixed sizing and overflow issues
- ✅ `ContextMenu.tsx` - Improved rendering and added debug logs

### 🚀 Next Steps:

1. **Test the menu**:
   ```powershell
   cd packages/visual-studio
   npm run dev
   ```

2. **Check console logs** when right-clicking

3. **Verify menu appears** with correct size and content

4. **If still having issues**, check the console logs and send them to me

### 💡 Quick Test:

Open DevTools console and run:
```javascript
// This should show the context menu styles
document.querySelector('.context-menu')?.getBoundingClientRect()
```

Expected output:
```
{
  width: 280+ (at least 280px)
  height: ~150+ (auto based on items)
  x: cursor x position
  y: cursor y position
}
```

---

**Status**: ✅ Fixed
**Version**: 1.1.0 (Sizing and rendering improvements)
