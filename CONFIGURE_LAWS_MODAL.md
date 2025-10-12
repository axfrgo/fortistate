# Configure Ontogenetic Laws Modal - Styling Improvements

## Overview
Replaced the basic `prompt()` dialog with a professional, styled modal for configuring ontogenetic laws on stores.

## Changes Made

### 1. New Modal HTML Structure
**Location**: `src/client/inspectorClient.ts` (lines ~1090-1150)

**Components**:
- Modal overlay with centered dialog
- Professional header with close button
- Three main sections:
  1. **Target Store Display** - Shows which store is being configured
  2. **Law Presets** - Grid of pre-configured law sets
  3. **Custom Configuration** - Manual law selection with options

**Features**:
- Store name displayed in styled badge
- Preset cards with hover effects and selection states
- Individual law checkboxes for custom configs
- Auto-repair and strict mode toggle options
- Action buttons (Cancel/Save) in modal footer

### 2. CSS Styling
**Location**: `src/client/inspectorClient.ts` (lines ~313-468)

**New CSS Classes**:

#### Modal Structure
- `.laws-modal` - Larger modal container (700px max-width)
- `.modal-actions` - Button container in footer with proper spacing

#### Target Store Display
- `.target-store-display` - Container for store name
- `.store-key-badge` - Gradient badge showing store key

#### Preset System
- `.preset-grid` - Grid layout for preset cards
- `.preset-card` - Individual preset card with hover effects
- `.preset-card.selected` - Selected state with checkmark
- `.preset-card-header` - Card title section
- `.preset-card-title` - Preset name styling
- `.preset-card-description` - Preset description text
- `.preset-card-laws` - Container for law tags
- `.law-tag` - Individual law identifier badge

#### Custom Configuration
- `.law-checkboxes` - Scrollable grid of law checkboxes
- `.checkbox-group` - Vertical checkbox group
- `.checkbox-label` - Styled checkbox label with hover
- `.form-checkbox` - Checkbox input styling

**Visual Features**:
- Semi-transparent backgrounds with glassmorphism
- Smooth transitions and hover effects
- Selected state with checkmark indicator
- Gradient accents matching inspector theme
- Proper spacing and visual hierarchy
- Scrollable sections for long lists

### 3. JavaScript Functions

#### Core Functions
**Location**: `src/client/inspectorClient.ts` (lines ~2035-2190)

##### `configureLawsForStore(storeKey)`
- Opens modal for the specified store
- Loads existing configuration if available
- Populates preset grid and law checkboxes
- Shows store name in header

##### `selectLawPreset(index)`
- Highlights selected preset card
- Auto-checks corresponding law checkboxes
- Updates options based on preset config
- Provides visual feedback

##### `closeLawConfigModal()`
- Closes modal and resets state
- Clears selection state
- Called on cancel or after save

##### `saveLawConfiguration()`
- Validates selection (at least one law required)
- Creates configuration object (preset or custom)
- Saves to localStorage
- Shows success toast notification
- Closes modal automatically

#### Event Listeners
**Location**: `src/client/inspectorClient.ts` (lines ~2487-2500)

- Close button click handler
- Click-outside-to-close handler
- Matches behavior of help modal

## Design System

### Color Scheme
```css
/* Primary Accent */
--accent-primary: #a855f7 (Purple)
--accent-secondary: #a78bfa (Light Purple)

/* Backgrounds */
Card Background: rgba(255, 255, 255, 0.02)
Hover Background: rgba(167, 139, 250, 0.05)
Selected Background: rgba(167, 139, 250, 0.1)

/* Borders */
Default: rgba(255, 255, 255, 0.1)
Hover: #a78bfa
Selected: #a855f7
```

### Typography
- **Store Badge**: 16px, bold, monospace (Fira Code)
- **Preset Title**: 15px, semi-bold
- **Descriptions**: 13px, muted color
- **Law Tags**: 11px, uppercase, monospace

### Spacing
- Modal padding: 20px
- Section margins: 16px bottom
- Card padding: 16px
- Button gaps: 12px
- Form element spacing: 10-12px

### Interactive States
1. **Preset Cards**:
   - Default: Subtle border
   - Hover: Purple border, slight elevation, glow
   - Selected: Bold border, checkmark, stronger glow

2. **Checkboxes**:
   - Grouped in styled containers
   - Hover effects on labels
   - Purple accent color when checked

3. **Buttons**:
   - Primary: Gradient background
   - Secondary: Transparent with border
   - Hover: Elevation and glow effects

## User Experience Improvements

### Before (prompt-based)
- ❌ Basic text-only prompts
- ❌ No visual preset preview
- ❌ Multiple sequential prompts
- ❌ No law descriptions
- ❌ Difficult to see all options
- ❌ Text-based law IDs only
- ❌ Limited context

### After (Modal-based)
- ✅ Professional modal dialog
- ✅ Visual preset cards with descriptions
- ✅ Single-screen configuration
- ✅ Hover previews and tooltips
- ✅ All options visible at once
- ✅ Checkboxes with labels
- ✅ Store context always visible
- ✅ Preset selection with visual feedback
- ✅ Custom configuration flexibility
- ✅ Persistent configuration display

## Usage Flow

### Opening the Modal
1. User clicks "⚙️ Configure" button on a store card
2. Modal opens with store name displayed
3. Existing configuration is loaded and shown
4. All presets and laws are visible

### Selecting a Preset
1. User clicks on a preset card
2. Card highlights with checkmark
3. Law checkboxes update automatically
4. Options update based on preset

### Custom Configuration
1. User manually checks desired laws
2. Preset selection clears (custom mode)
3. Toggle auto-repair and strict mode
4. All selections preserved

### Saving Configuration
1. User clicks "💾 Save Configuration"
2. Validation runs (at least one law required)
3. Configuration saved to localStorage
4. Success toast shows confirmation
5. Modal closes automatically

## Testing Checklist

### Visual Testing
- [ ] Modal centers properly on all screen sizes
- [ ] Store badge displays correctly
- [ ] Preset cards layout in grid
- [ ] Hover effects work on preset cards
- [ ] Selected state shows checkmark
- [ ] Checkboxes display in scrollable grid
- [ ] Law tags wrap properly
- [ ] Buttons styled correctly
- [ ] Modal closes on outside click
- [ ] Close button (X) works

### Functional Testing
- [ ] Modal opens with correct store name
- [ ] Existing config loads properly
- [ ] Preset selection highlights card
- [ ] Preset selection updates checkboxes
- [ ] Custom law selection works
- [ ] Options toggles function
- [ ] Validation prevents empty selection
- [ ] Configuration saves to localStorage
- [ ] Success toast appears
- [ ] Modal closes after save
- [ ] Cancel button works
- [ ] Configuration persists across sessions

### Integration Testing
- [ ] Open inspector
- [ ] Register a store from demo app
- [ ] Click "⚙️ Configure" on store card
- [ ] Select different presets
- [ ] Create custom configuration
- [ ] Save and verify toast
- [ ] Reopen modal to see saved config
- [ ] Change configuration
- [ ] Verify localStorage updates

## Data Structure

### Saved Configuration Format
```javascript
{
  "storeKey": {
    "id": "strict-validation" | "custom",
    "name": "Strict Validation",
    "description": "All rules with auto-repair",
    "laws": ["LAW_ID_1", "LAW_ID_2", ...],
    "config": {
      "autoRepair": true,
      "strictMode": false
    }
  }
}
```

### localStorage Key
```
fortistate-store-law-configs
```

## Accessibility Features

- ✅ Close button has `aria-label`
- ✅ Modal has proper heading hierarchy
- ✅ Buttons have descriptive text
- ✅ Checkboxes properly labeled
- ✅ Keyboard accessible (Tab, Enter, Escape)
- ✅ Click-outside-to-close behavior
- ✅ Focus management

## Browser Compatibility

- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ CSS Grid and Flexbox
- ✅ CSS Variables (Custom Properties)
- ✅ localStorage API
- ✅ ES6+ JavaScript

## Performance Considerations

- Minimal re-renders (event delegation)
- Efficient DOM updates
- CSS transitions for smooth animations
- No external dependencies
- Lightweight modal implementation

## Future Enhancements

### Potential Improvements
- [ ] Search/filter laws in custom mode
- [ ] Law descriptions on hover
- [ ] Preset comparison view
- [ ] Import/export configurations
- [ ] Share configurations via URL
- [ ] Law dependency visualization
- [ ] Configuration templates
- [ ] Bulk apply to multiple stores
- [ ] Configuration history/undo
- [ ] Dark/light theme toggle

## Related Files

- `src/client/inspectorClient.ts` - Modal HTML, CSS, and JavaScript
- `src/stores/gameLaws.ts` - Law definitions (if using game example)
- `examples/my-nextjs-app/src/components/SpaceShooterGame.tsx` - Demo integration

## Notes

- Configuration stored in localStorage (per-browser, not persisted server-side)
- Modal uses existing `.modal-overlay` and `.modal` base classes
- Styled to match preset panel design system
- Compatible with existing inspector theme and color scheme
- No breaking changes to existing functionality
- Graceful fallback if localStorage unavailable
