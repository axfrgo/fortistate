# 🔍 Word Replacer Feature - TypeScript Code Generator

## Overview
Added a powerful find-and-replace tool to the TypeScript code generator modal, allowing users to search and replace text in generated code in real-time.

## Features

### 1. **Find Text**
- Search for any text pattern in generated code
- Live match counter shows number of occurrences
- Works across all code tabs (Full Module, Laws Only, Composition)

### 2. **Replace Text**
- Replace all occurrences with custom text
- Preview changes in real-time
- Disabled until matches are found

### 3. **Case Sensitivity Toggle**
- Case-insensitive search by default
- Optional case-sensitive matching
- Updates results immediately

### 4. **Live Preview**
- Code updates automatically as you type
- See replacements before committing
- No need to click "Replace All" to preview

## How to Use

### Step 1: Open Code Generator
Click the **"</> Code"** button at the bottom-right of the screen.

### Step 2: Toggle Find & Replace
Click the **🔍** icon in the top-right of the code modal header.

### Step 3: Enter Search Terms
```
Find text:     state
Replace with:  data
```

### Step 4: See Live Updates
The code viewer automatically shows what the code will look like with replacements.

### Step 5: View Match Count
See how many occurrences were found:
```
✓ 12 matches
```

### Step 6: Case Sensitivity (Optional)
Check the "Case sensitive" box to match exact casing:
```
☑ Case sensitive
```

### Step 7: Apply Changes
Click **"Replace All"** to confirm the replacements.

## Example Use Cases

### 1. **Rename Variables**
```typescript
Find:    userAlice
Replace: customerAlice

// Before:
const userAlice = BEGIN('user:alice', { ... })

// After:
const customerAlice = BEGIN('user:alice', { ... })
```

### 2. **Change Entity Names**
```typescript
Find:    user:alice
Replace: customer:alice

// Before:
BEGIN('user:alice', { balance: 100 })

// After:
BEGIN('customer:alice', { balance: 100 })
```

### 3. **Update Property Names**
```typescript
Find:    balance
Replace: accountBalance

// Before:
{ balance: 100, tier: 'basic' }

// After:
{ accountBalance: 100, tier: 'basic' }
```

### 4. **Modify Function Names**
```typescript
Find:    transform
Replace: mutate

// Before:
BECOME('user', { transform: state => state })

// After:
BECOME('user', { mutate: state => state })
```

### 5. **Adjust Import Paths**
```typescript
Find:    fortistate/ontogenesis
Replace: @fortistate/ontogenesis

// Before:
import { BEGIN } from 'fortistate/ontogenesis'

// After:
import { BEGIN } from '@fortistate/ontogenesis'
```

## Technical Details

### State Management
- Uses React `useMemo` for efficient re-computation
- Tracks find/replace text, case sensitivity, and match count
- Updates happen in real-time as you type

### Regex Safety
- Escapes special regex characters to prevent errors
- Uses global flag for replace-all behavior
- Case-insensitive by default (`gi` flag)

### Performance
- Memoized calculations prevent unnecessary re-renders
- Regex compilation happens once per text change
- No performance impact on large code files

## UI Components

### Replacer Panel
```
┌─────────────────────────────────────────┐
│ [Find text...]            [12 matches]  │
│ [Replace with...]         [Replace All] │
│ ☑ Case sensitive                        │
└─────────────────────────────────────────┘
```

### Match Counter
- **"No matches"** - Search term not found
- **"1 match"** - Single occurrence found
- **"12 matches"** - Multiple occurrences found

### Replace Button States
- **Disabled** - No search text or no matches
- **Enabled** - Ready to replace matches
- **Hover** - Visual feedback on hover

## Code Structure

### New State Variables
```typescript
const [showReplacer, setShowReplacer] = useState(false)
const [findText, setFindText] = useState('')
const [replaceText, setReplaceText] = useState('')
const [caseSensitive, setCaseSensitive] = useState(false)
```

### Computed Values
```typescript
// Apply replacements
const codeByTab = useMemo(() => {
  const regex = new RegExp(findText, flags)
  return baseCode.replace(regex, replaceText)
}, [generatedCode, activeTab, findText, replaceText, caseSensitive])

// Count matches
const findMatches = useMemo(() => {
  const matches = code.match(regex)
  return matches ? matches.length : 0
}, [generatedCode, activeTab, findText, caseSensitive])
```

## Styling

### CSS Classes
- `.replacer-toggle` - Search icon button in header
- `.replacer-panel` - Collapsible find/replace panel
- `.replacer-row` - Input row with find/replace fields
- `.replacer-input` - Styled text inputs
- `.match-count` - Badge showing match count
- `.replacer-btn` - Replace all button
- `.replacer-option` - Checkbox with label

### Color Scheme
- **Primary**: Purple gradient (`#667eea` → `#764ba2`)
- **Inputs**: Dark background with purple border
- **Focus**: Purple glow effect
- **Disabled**: 40% opacity

## Keyboard Shortcuts (Future Enhancement)
- `Ctrl+F` / `Cmd+F` - Open find panel
- `Enter` - Replace all
- `Escape` - Close replacer panel

## Accessibility
- Proper label associations
- Keyboard navigation support
- Focus indicators on inputs
- Disabled state for button

## Future Enhancements
- [ ] Find next/previous navigation
- [ ] Replace single occurrence
- [ ] Regex pattern support
- [ ] Search history
- [ ] Highlight matches in editor
- [ ] Keyboard shortcuts
- [ ] Undo/redo support

## Testing Checklist
✅ Find text updates match count
✅ Replace text updates preview
✅ Case sensitivity toggle works
✅ Empty search shows "No matches"
✅ Button disabled when no matches
✅ Works across all tabs
✅ Regex special chars escaped
✅ Build passes without errors

---

**Status**: ✅ Complete and functional
**Build**: ✅ Passing
**Performance**: ⚡ Optimized with memoization
