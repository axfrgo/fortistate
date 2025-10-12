# Inspector Timeline & Preset Panel Improvements

## Overview
This document outlines the improvements made to the Fortistate Inspector's timeline functionality and preset configuration panel.

## Changes Made

### 1. Timeline History Tracking (Server-Side)

#### Added History Buffer System
- **Location**: `src/inspector.ts` (lines ~148-189)
- **Features**:
  - History buffer with 200-entry capacity (circular buffer)
  - `recordHistory()` function to track store operations
  - Real-time WebSocket broadcasting of history events
  - Automatic buffer management (FIFO when capacity exceeded)

#### Added `/history` Endpoint
- **Route**: `GET /history`
- **Authentication**: Requires observer role (or legacy token)
- **Response**: JSON array of history entries
- **Format**:
  ```json
  [
    {
      "action": "register|change",
      "ts": 1696607923000,
      "key": "gameState",
      "value": {...},
      "initial": {...}
    }
  ]
  ```

#### Updated Store Endpoints
- **`/register` endpoint**: Now records history when stores are registered
- **`/change` endpoint**: Now records history when stores are updated
- Both emit `history:add` WebSocket events for real-time updates

### 2. Timeline UI Improvements (Client-Side)

#### Real-Time History Updates
- **Location**: `src/client/inspectorClient.ts` (lines ~2000-2025)
- **Features**:
  - WebSocket listener for `history:add` events
  - Automatic history buffer sync with server
  - Live timeline rendering when panel is visible
  - 200-entry client-side buffer matching server capacity

#### Timeline Panel
- **Components**:
  - Replay controls (Prev, Play, Next)
  - History list with timestamp and action details
  - Automatic status updates during replay
  - Click/keyboard navigation for history entries

### 3. Preset Configuration Panel Styling

#### Visual Improvements
- **Location**: `src/client/inspectorClient.ts` (lines ~356-520)
- **New CSS Classes**:
  - `.preset-config-panel` - Container styling
  - `.config-section` - Grouped configuration sections with hover effects
  - `.section-title` - Section headers with icons
  - `.section-description` - Explanatory text for sections
  - `.form-group` - Form field grouping
  - `.form-label` - Styled form labels with uppercase styling
  - `.form-input` / `.form-select` - Enhanced form controls
  - `.button-group` - Flex button layouts
  - `.token-input-group` - Token input with inline buttons
  - `.token-status` - Status indicator styling
  - `.preset-description` - Highlighted preset descriptions

#### UI Structure
- **Three Main Sections**:
  1. **Configuration Presets** - Apply presets to stores
  2. **Authentication** - Token management
  3. **Law Configuration Presets** - Apply law enforcement rules

#### Design Features
- Semi-transparent sections with subtle borders
- Hover effects for better interactivity
- Proper form labeling and accessibility
- Icon-enhanced buttons
- Responsive layouts with flexbox
- Consistent spacing and visual hierarchy

### 4. Button Enhancements

#### New Button Styles
- `.btn-icon` - Icon wrapper for button icons
- `.btn.full-width` - Full-width button variant
- Enhanced primary/secondary button states
- Better hover effects and shadows

## Testing Checklist

### Timeline Functionality
- [ ] Open inspector at `http://localhost:4000`
- [ ] Click "⏱️ Timeline" button to show timeline panel
- [ ] Perform actions in demo app (move player, spawn enemies, etc.)
- [ ] Verify history entries appear in timeline in real-time
- [ ] Test "▶ Play" button to replay history
- [ ] Test "◀ Prev" and "Next ▶" buttons for navigation
- [ ] Verify WebSocket updates work without refresh

### Preset Panel Styling
- [ ] Open inspector and click "🎨 Presets" button
- [ ] Verify three distinct sections are visible
- [ ] Check hover effects on sections
- [ ] Verify form labels are properly styled
- [ ] Test preset selection dropdown
- [ ] Verify target store auto-detection works
- [ ] Test "Apply Preset" and "Install CSS" buttons
- [ ] Check token input display and buttons
- [ ] Test law preset dropdown and apply button

### Integration Testing
- [ ] Start inspector: `npm run inspect`
- [ ] Start demo app: `cd examples/my-nextjs-app && npm run dev`
- [ ] Open demo at `http://localhost:3000`
- [ ] Open inspector at `http://localhost:4000`
- [ ] Play Space Shooter demo
- [ ] Verify all actions appear in timeline
- [ ] Apply different presets from preset panel
- [ ] Verify real-time updates work across both panels

## API Reference

### New Endpoints

#### GET /history
Retrieve the timeline history buffer.

**Authentication**: Observer role or legacy token

**Response**:
```json
[
  {
    "action": "register",
    "ts": 1696607923000,
    "key": "gameState",
    "initial": {...}
  },
  {
    "action": "change",
    "ts": 1696607925000,
    "key": "gameState",
    "value": {...}
  }
]
```

### WebSocket Messages

#### history:add
Broadcasted when a new history entry is recorded.

```json
{
  "type": "history:add",
  "entry": {
    "action": "change",
    "ts": 1696607925000,
    "key": "gameState",
    "value": {...}
  }
}
```

## Architecture

### History Flow
```
Client Action
    ↓
POST /change or /register
    ↓
Server: recordHistory()
    ↓
History Buffer (200 entries)
    ↓
WebSocket Broadcast (history:add)
    ↓
Client: Update historyEntries[]
    ↓
Timeline UI: renderHistory()
```

### Preset Panel Structure
```
Preset Panel
├── Configuration Presets Section
│   ├── Preset Select Dropdown
│   ├── Target Store Input (auto-detected)
│   ├── Description Display
│   └── Action Buttons (Apply, Install CSS)
├── Authentication Section
│   ├── Token Input (readonly, auto-detected)
│   ├── Clear/Manual Buttons
│   └── Status Display
└── Law Configuration Presets Section
    ├── Law Preset Dropdown
    ├── Description Display
    └── Apply Button
```

## Future Enhancements

### Timeline
- [ ] Add filtering by action type (register/change)
- [ ] Add filtering by store key
- [ ] Add export history as JSON
- [ ] Add time-based scrubbing/slider
- [ ] Add diff view between history entries
- [ ] Add undo/redo functionality
- [ ] Add bookmark/favorite history entries

### Preset Panel
- [ ] Add preset creation/editing UI
- [ ] Add preset import/export
- [ ] Add preset validation feedback
- [ ] Add recent presets quick access
- [ ] Add preset search/filtering
- [ ] Add custom CSS theme editor

## Notes

- History buffer is in-memory only (not persisted to disk)
- Maximum 200 entries kept in memory (circular buffer)
- WebSocket required for real-time updates
- Preset panel auto-detects target store from selection
- Token auto-detection from URL params or localStorage
- All endpoints require proper authentication
- CORS configured for cross-origin access

## Related Files

- `src/inspector.ts` - Server-side history tracking
- `src/client/inspectorClient.ts` - Client-side timeline and preset UI
- `examples/my-nextjs-app/src/components/SpaceShooterGame.tsx` - Demo integration
- `examples/my-nextjs-app/src/hooks/useClientStore.ts` - Client store with inspector integration
