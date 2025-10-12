# Inspector Law Control System

## Overview
Replaced swap/move/duplicate functionality with ontogenetic law controls, allowing users to apply and configure law presets to manage state validation and compliance.

## Changes Made

### 🗑️ Removed Features

**Old Store Controls:**
- ❌ Duplicate button - Created store copies
- ❌ Swap button - Swapped store values
- ❌ Move button - Renamed stores

**Removed Functions:**
- `duplicateStore(sourceKey)` 
- `swapStore(keyA)`
- `moveStore(oldKey)`

### ⚖️ New Law Control System

**New Store Controls:**
- ✅ **⚖️ Apply Laws** - Validate store against selected laws
- ✅ **🔧 Configure** - Set up law configuration for store

**New Functions:**
```javascript
applyLawsToStore(storeKey)        // Apply laws to individual store
configureLawsForStore(storeKey)   // Configure law settings for store
applyLawPresetToTarget()          // Apply preset to target store
```

## Law Configuration Presets

### Available Presets

#### 1. Strict Validation
```javascript
{
  id: 'strict-validation',
  name: 'Strict Validation',
  description: 'Enforces all validation rules with auto-repair',
  laws: ['INS-001', 'INS-002', 'INS-003', 'INS-004', 'INS-005'],
  config: { autoRepair: true, strictMode: true }
}
```
**Use Case:** Maximum compliance, production-critical applications

#### 2. Production Ready
```javascript
{
  id: 'production-ready',
  name: 'Production Ready',
  description: 'Essential laws for production deployment',
  laws: ['INS-001', 'INS-002', 'INS-004'],
  config: { autoRepair: false, strictMode: true }
}
```
**Use Case:** Production deployments, essential validation only

#### 3. Development Friendly
```javascript
{
  id: 'development-friendly',
  name: 'Development Friendly',
  description: 'Relaxed rules for rapid development',
  laws: ['INS-001'],
  config: { autoRepair: true, strictMode: false }
}
```
**Use Case:** Rapid prototyping, local development

#### 4. Quality Assurance
```javascript
{
  id: 'quality-assurance',
  name: 'Quality Assurance',
  description: 'Focus on metadata and lifecycle tracking',
  laws: ['INS-002', 'INS-003', 'INS-005'],
  config: { autoRepair: false, strictMode: false }
}
```
**Use Case:** QA testing, documentation requirements

#### 5. Size Optimization
```javascript
{
  id: 'size-optimization',
  name: 'Size Optimization',
  description: 'Monitors and controls state size',
  laws: ['INS-004'],
  config: { autoRepair: false, strictMode: true, maxSize: 50000 }
}
```
**Use Case:** Performance optimization, memory constraints

## Inspector Laws Reference

### INS-001: JSON Serialization
- **Category:** Structural
- **Severity:** Error
- **Validates:** State is JSON-serializable
- **Detects:** Functions, circular refs, symbols

### INS-002: Descriptive Keys
- **Category:** Semantic
- **Severity:** Warning
- **Validates:** Store keys are descriptive (3+ chars)
- **Detects:** Single-letter keys, vague names

### INS-003: Lifecycle Tracking
- **Category:** Ontogenetic
- **Severity:** Info
- **Validates:** State tracks lifecycle (status/phase)
- **Detects:** Missing lifecycle fields

### INS-004: Size Limits
- **Category:** Operational
- **Severity:** Warning
- **Validates:** State size < 100KB
- **Detects:** Oversized states

### INS-005: Metadata
- **Category:** Quality
- **Severity:** Info
- **Validates:** State includes timestamps/version
- **Detects:** Missing metadata fields

## User Workflows

### Workflow 1: Apply Laws to Single Store

**Via Store Card:**
```
1. Click "⚖️ Apply Laws" on store card
2. Enter law IDs or "all"
3. View validation results
4. Check console for details
5. Optional: Auto-fix suggestions
```

**Example:**
```javascript
// User clicks "Apply Laws" on store "appState"
// Enters: "all"
// Results:
✓ Store "appState" complies with all 5 laws!
```

### Workflow 2: Configure Laws for Store

**Via Store Card:**
```
1. Click "🔧 Configure" on store card
2. Select preset (1-5) or "custom"
3. Configuration saved to localStorage
4. Validation runs automatically
5. Results shown in toast + console
```

**Example:**
```javascript
// User clicks "Configure" on store "userState"
// Selects: 2 (Production Ready)
// Results:
✓ Applied "Production Ready" to "userState"
⚠ 1 violation(s) found (see console)
```

### Workflow 3: Apply Preset from Panel

**Via Presets Panel:**
```
1. Click "🎨 Presets" in navbar
2. Select law preset from dropdown
3. View preset description
4. Target key auto-detected
5. Click "Apply to Target Store"
6. Configuration saved & validated
```

**UI Flow:**
```
┌─────────────────────────────────────────┐
│ ⚖️ Law Configuration Presets            │
├─────────────────────────────────────────┤
│ [Select preset ▼]                       │
│   ├─ Strict Validation                  │
│   ├─ Production Ready                   │
│   ├─ Development Friendly               │
│   ├─ Quality Assurance                  │
│   └─ Size Optimization                  │
│                                         │
│ [Apply to Target Store]                 │
│                                         │
│ Description:                            │
│ Essential laws for production           │
│ Laws: INS-001, INS-002, INS-004         │
│ Config: {"autoRepair":false,...}        │
└─────────────────────────────────────────┘
```

## Persistence

### localStorage Keys

**Law Configurations:**
```javascript
// Key: 'fortistate-store-law-configs'
// Value: { [storeKey]: preset }

{
  "appState": {
    "id": "production-ready",
    "name": "Production Ready",
    "laws": ["INS-001", "INS-002", "INS-004"],
    "config": { "autoRepair": false, "strictMode": true }
  },
  "userState": {
    "id": "quality-assurance",
    "name": "Quality Assurance",
    "laws": ["INS-002", "INS-003", "INS-005"],
    "config": { "autoRepair": false, "strictMode": false }
  }
}
```

## UI Changes

### Before (Old Controls)
```
┌──────────────────────────────────────┐
│ 💾 storeKey                          │
│ object                               │
│ { "value": 123 }                     │
│                                      │
│ [Duplicate] [Swap] [Move]           │
└──────────────────────────────────────┘
```

### After (Law Controls)
```
┌──────────────────────────────────────┐
│ 💾 storeKey                          │
│ object                               │
│ { "value": 123 }                     │
│                                      │
│ [⚖️ Apply Laws] [🔧 Configure]       │
└──────────────────────────────────────┘
```

### Presets Panel Addition
```
🎨 Presets & Configuration
├─ Preset Dropdown
├─ Target Key (auto)
├─ [Apply] [Install CSS]
├─ Token Management
└─ ⚖️ Law Configuration Presets  ← NEW
   ├─ Preset Dropdown
   ├─ [Apply to Target Store]
   └─ Description Display
```

## Benefits

### Law-Based State Management
✅ **Declarative Validation:** Define once, validate everywhere  
✅ **Preset Configurations:** Common patterns built-in  
✅ **Auto-Repair Capability:** Fix violations automatically  
✅ **Persistent Config:** Saved per-store in localStorage  

### Developer Experience
✅ **Guided Compliance:** Clear law descriptions  
✅ **Quick Application:** One-click preset application  
✅ **Visual Feedback:** Toast notifications + console logs  
✅ **Flexible Configuration:** Custom or preset modes  

### Production Readiness
✅ **Quality Gates:** Enforce production standards  
✅ **Size Monitoring:** Prevent memory issues  
✅ **Lifecycle Tracking:** Monitor state evolution  
✅ **Metadata Requirements:** Ensure auditability  

## API Integration

### Apply Laws Endpoint (Future)
```javascript
POST /apply-laws
{
  "storeKey": "appState",
  "laws": ["INS-001", "INS-002"],
  "config": { "autoRepair": true }
}

Response:
{
  "valid": false,
  "violations": [
    {
      "lawId": "INS-002",
      "message": "Store key 'x' is too short",
      "suggestion": "Use descriptive key (3+ chars)"
    }
  ]
}
```

## Testing Checklist

### Functionality
- [x] Apply Laws button validates store
- [x] Configure button opens preset dialog
- [x] Law preset dropdown shows descriptions
- [x] Apply to Target button works
- [x] localStorage persistence works
- [x] Toast notifications appear
- [x] Console logging provides details
- [x] Auto-fix suggestions offered

### UI/UX
- [x] Old Duplicate/Swap/Move buttons removed
- [x] New law control buttons visible
- [x] Law presets panel in Presets section
- [x] Preset descriptions update on select
- [x] Target key auto-detection works
- [x] Proper button styling

### Edge Cases
- [x] No laws selected → Alert shown
- [x] Store not found → Alert shown
- [x] Invalid preset number → Alert shown
- [x] localStorage failure → Error handling
- [x] No violations → Success message

## Migration Notes

### For Users
- Old Duplicate/Swap/Move features removed
- Use Presets panel for similar operations
- New law-based validation system
- Configure laws per-store basis

### For Developers
- Law configurations stored in localStorage
- `LAW_PRESETS` array defines available configs
- `INSPECTOR_LAWS` array defines validation rules
- Console provides detailed violation info

## Conclusion

The inspector now provides a **law-based state management system** replacing manual store manipulation with declarative validation:

✅ **5 preset configurations** for common use cases  
✅ **5 inspector laws** for comprehensive validation  
✅ **Per-store configuration** with localStorage persistence  
✅ **Visual feedback** via toasts and console logs  
✅ **Auto-fix suggestions** for violated laws  

This empowers users to enforce ontogenetic constraints and maintain state quality through declarative rules rather than imperative operations! ⚖️
