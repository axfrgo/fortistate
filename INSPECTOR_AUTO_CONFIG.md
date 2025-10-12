# Inspector Auto-Configuration Complete

## Overview
The Fortistate Inspector now automatically detects and fills token and target key inputs, eliminating manual configuration.

## Changes Implemented

### 🔐 Automatic Token Detection & Persistence

#### Token Sources (Priority Order)
1. **URL Parameter**: `?token=xxx` or `?inspectorToken=xxx`
2. **localStorage**: Persisted from previous sessions
3. **Manual Entry**: Via "Manual" button if needed

#### Features
- ✅ Auto-saves to localStorage on first detection
- ✅ Survives browser refresh
- ✅ Masked display (`●●●●●●●●1234`)
- ✅ Status indicator shows token state
- ✅ "Clear" button to remove saved token
- ✅ WebSocket automatically includes token in connection

#### UI Changes
**Before:**
```html
<input placeholder="🔐 Inspector token (optional)" />
<button>Set Token</button>
```

**After:**
```html
<input placeholder="🔐 Inspector token (auto-detected)" readonly />
<button id="clear-token-btn">Clear</button>
<button id="set-token-btn">Manual</button>
<div id="token-status">✓ Token active (auto-detected)</div>
```

#### Status Messages
- ✅ `"✓ Token active (auto-detected)"` - Green when token present
- ⚠️ `"⚠ No token - some features may be restricted"` - Yellow when missing

### 🎯 Automatic Target Key Detection

#### Detection Strategy
1. **Active Store Hint**: Uses `window.fortistate.setActiveKey()` if set
2. **URL Parameter**: `?fortistate=storeKey`
3. **HTML Attribute**: `data-active-key` on `<body>` or `<html>`
4. **Global Variable**: `window.__FORTISTATE_ACTIVE__`
5. **Common Names**: `['state', 'appState', 'store', 'main', 'root', 'app']`
6. **First Available**: Falls back to first store in list
7. **Last Active**: Remembers last used store

#### Features
- ✅ Auto-fills preset target input (readonly)
- ✅ Updates automatically when stores change
- ✅ Persists across interactions
- ✅ Smart fallback logic

#### UI Changes
**Before:**
```html
<input placeholder="target key (optional)" />
```

**After:**
```html
<input placeholder="target key (auto-detected)" readonly />
```

### 🔗 Token Integration in All Functions

All API calls now automatically include token header when available:

#### Updated Functions
1. ✅ **applyPreset()** - Applies preset with token auth
2. ✅ **installPresetCss()** - Installs CSS with token auth
3. ✅ **duplicateStore()** - Duplicates store with token auth
4. ✅ **swapStore()** - Swaps stores with token auth
5. ✅ **moveStore()** - Moves/renames store with token auth
6. ✅ **WebSocket Connection** - Includes token in URL: `ws://host?token=xxx`

#### Token Header Format
```javascript
const headers = { 'Content-Type': 'application/json' }
if (inspectorToken) headers['x-fortistate-token'] = inspectorToken
```

### 🎨 Enhanced User Feedback

#### Toast Notifications
All operations now show success toasts:
- ✓ `"✓ Preset applied: presetName"`
- ✓ `"✓ CSS installed for preset: presetName"`
- ✓ `"✓ Store duplicated: newKey"`
- ✓ `"✓ Stores swapped: keyA ↔ keyB"`
- ✓ `"✓ Store moved: oldKey → newKey"`
- ✓ `"✓ Token saved"`

#### Visual Indicators
- Token status badge (green/yellow)
- Readonly inputs show auto-detection
- Clear button only shows when token exists

## API Reference

### New Global State Variables
```javascript
let inspectorToken = null          // Current token (auto-detected or manual)
let lastActiveStoreKey = null      // Most recently active store
```

### New Functions

#### `updateTokenDisplay()`
Updates token input field and status indicator.

```javascript
updateTokenDisplay()
// Shows: ●●●●●●●●1234 or "No token"
// Updates status: "✓ Token active" or "⚠ No token"
```

#### `manualTokenEntry()`
Prompts user for manual token entry.

```javascript
manualTokenEntry()
// Opens prompt with current token
// Saves to localStorage
// Reconnects WebSocket
```

#### `clearToken()`
Clears saved token after confirmation.

```javascript
clearToken()
// Confirms with user
// Removes from localStorage
// Updates display
```

#### `updateTargetKeyDisplay()`
Auto-fills preset target with detected active store.

```javascript
updateTargetKeyDisplay()
// Detects active store
// Updates preset-target input
// Stores in lastActiveStoreKey
```

### Updated Functions

#### `applyPreset()`
```javascript
// Before
await fetch('/apply-preset', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, targetKey })
})

// After
const headers = { 'Content-Type': 'application/json' }
if (inspectorToken) headers['x-fortistate-token'] = inspectorToken
await fetch('/apply-preset', {
  headers,
  body: JSON.stringify({ name, targetKey: targetKey || lastActiveStoreKey })
})
showToast('✓ Preset applied: ' + name)
```

## Usage Examples

### Scenario 1: First-Time User
```
1. User opens inspector at http://localhost:4000?token=abc123
2. ✓ Token auto-detected from URL
3. ✓ Token saved to localStorage
4. ✓ Token display shows: ●●●●●●●●c123
5. ✓ Status: "✓ Token active (auto-detected)"
```

### Scenario 2: Returning User
```
1. User opens inspector (no URL params)
2. ✓ Token restored from localStorage
3. ✓ WebSocket connects with token
4. ✓ All operations work seamlessly
```

### Scenario 3: Preset Application
```
1. User has stores: { appState: {...}, theme: {...} }
2. ✓ Target auto-fills with "appState" (first store)
3. User clicks "Apply" on preset
4. ✓ Preset applies to "appState" automatically
5. ✓ Toast: "✓ Preset applied: myPreset"
```

### Scenario 4: Token Management
```
// Manual entry
manualTokenEntry()
// Prompts: "Enter inspector token:"
// Saves: localStorage.setItem('fortistate-inspector-token', token)
// Shows: ✓ Token saved

// Clear token
clearToken()
// Confirms: "Clear saved inspector token?"
// Removes: localStorage.removeItem('fortistate-inspector-token')
// Shows: Token cleared
```

## Testing Checklist

### Token Detection
- [x] Token detected from URL parameter `?token=xxx`
- [x] Token persisted to localStorage
- [x] Token restored on page reload
- [x] Token included in all API calls
- [x] Token included in WebSocket connection
- [x] Manual token entry works
- [x] Clear token button works
- [x] Status indicator updates correctly

### Target Key Detection
- [x] Detects active store from `window.fortistate.setActiveKey()`
- [x] Detects from URL parameter `?fortistate=key`
- [x] Detects from `data-active-key` attribute
- [x] Falls back to common names
- [x] Falls back to first available store
- [x] Updates when stores change
- [x] Persists across operations

### Function Integration
- [x] applyPreset() uses auto-detected values
- [x] installPresetCss() uses token
- [x] duplicateStore() uses token
- [x] swapStore() uses token and shows toast
- [x] moveStore() uses token and shows toast
- [x] WebSocket includes token in connection
- [x] All operations show success toasts

### UI/UX
- [x] Token input shows masked value
- [x] Token input is readonly
- [x] Target input is readonly
- [x] Clear button only shows when token exists
- [x] Status messages are accurate
- [x] Toast notifications appear on success

## Migration Notes

### For Existing Users
- Old manual token workflow still works
- Token will be auto-saved on first manual entry
- Target key will auto-detect from existing stores

### For Developers
- Token is now globally available as `inspectorToken`
- Target key available as `lastActiveStoreKey`
- All functions automatically use these values

## Benefits

### Developer Experience
✅ **Zero Configuration**: No manual input required  
✅ **Persistent**: Token survives browser refresh  
✅ **Smart Detection**: Automatically finds active store  
✅ **Better Feedback**: Toast messages for all operations  
✅ **Error Prevention**: Readonly inputs prevent accidents  

### Security
✅ **Masked Display**: Token not exposed in plain text  
✅ **Manual Control**: Clear button for security-conscious users  
✅ **URL Support**: Can share inspector link with token  

### Usability
✅ **Less Typing**: Auto-fill eliminates manual entry  
✅ **Visual Feedback**: Status indicators and toasts  
✅ **Forgiving**: Smart fallbacks if detection fails  

## Conclusion

The Fortistate Inspector is now **fully automated** with:

✅ **Automatic token detection** from URL/localStorage  
✅ **Automatic target key selection** with smart heuristics  
✅ **Token authentication** integrated into all API calls  
✅ **Enhanced feedback** with toast notifications  
✅ **Persistent state** across browser sessions  

Users can now open the inspector and immediately start working without any manual configuration! 🚀
