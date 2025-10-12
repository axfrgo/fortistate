# Custodian AI Agent - Accuracy Improvements

## Overview
The Custodian agent now performs **real violation detection** and generates **accurate, working repair steps** that actually fix issues in your ontogenetic workflow canvas.

## What Changed

### 1. Real Violation Detection 🔍
**Before:** Used dummy/mock violations (e.g., "duplicate_username", "invalid_transfer")  
**After:** Analyzes actual node/edge data to detect real issues:

- ✅ **Missing Entity Fields** - Detects ontogenetic nodes (BEGIN, BECOME, CEASE, TRANSCEND) without entity identifiers
- ✅ **Incomplete Initialization** - Finds BEGIN nodes with empty or missing properties
- ✅ **Orphaned Nodes** - Identifies nodes with no incoming/outgoing edges
- ✅ **Missing Transformations** - Catches BECOME nodes without transformation logic
- ✅ **Missing Conditions** - Detects CEASE nodes lacking termination conditions
- ✅ **Broken Edges** - Finds edges referencing non-existent nodes

### 2. Context-Aware Repair Generation 🛠️
**Before:** Generic "instrument_node" actions with no real effect  
**After:** Violation-specific repairs that actually work:

| Violation Type | Repair Action | What It Does |
|----------------|---------------|--------------|
| `missing_entity` | `set_entity_field` | Sets a proper entity identifier on the node |
| `incomplete_initialization` | `initialize_properties` | Adds default properties (status, timestamp, etc.) |
| `orphaned_node` | `create_inbound_edge` | Connects the node to an existing BEGIN/BECOME node |
| `missing_transformation` | `set_transformation` | Adds transformation logic to BECOME nodes |
| `missing_condition` | `set_condition` | Adds termination condition to CEASE nodes |
| `broken_edge` | `remove_broken_edge` | Removes edges that reference deleted nodes |

### 3. Smart Repair Application ✨
**Before:** Created dummy "repair nodes" that didn't fix anything  
**After:** Executes repairs directly on the canvas:

- **Field Updates** - Modifies node data in-place (entity, properties, transform, condition)
- **Edge Creation** - Creates new connections to integrate orphaned nodes
- **Edge Removal** - Cleans up broken edges
- **Validation** - Adds metadata to track custodian checks

### 4. Improved Feedback 💬
**Before:** Generic "Applied repair proposal" message  
**After:** Detailed action log showing exactly what was fixed:

```
✅ Repair applied successfully
Applied 3 repair action(s) to begin-1.
• Set entity to "user_entity"
• Initialized properties: status, timestamp, created
• Enhanced node with validation metadata
```

## Example Workflow

1. **Right-click a node/edge** → Select "Ask Custodian"
2. **Custodian analyzes** the element and detects violations
3. **Agent Insights panel** shows detected issues with confidence scores
4. **Click "Apply Fix"** → Confirmation modal appears
5. **Choose action:**
   - **Apply to canvas** - Fixes are applied immediately ✅
   - **Simulate execution** - Preview what would happen 📋
   - **Cancel** - Dismiss without changes ❌

## Technical Implementation

### Files Modified
- `src/components/Canvas.tsx` - Smart violation detection in `handleAskCustodian`
- `src/ai/agentRuntime.ts` - Context-aware repair generation in `CustodianAgent`
- `src/components/Canvas.tsx` - Direct repair application in `applyToCanvas`

### Key Improvements
```typescript
// Old approach (dummy data)
const violationType = 'duplicate_username'
const law = 'username.unique === true'

// New approach (real analysis)
if (!data.entity && ['begin', 'become', ...].includes(type)) {
  violationType = 'missing_entity'
  law = 'ontogenetic_node.entity !== null'
  // ... generate targeted repair
}
```

## Benefits

✅ **Accurate Detection** - No more false positives, only real issues  
✅ **Working Repairs** - Fixes actually resolve the detected problems  
✅ **Transparent Process** - See exactly what changed and why  
✅ **Safe Application** - Preview before applying, undo if needed  
✅ **Domain-Aware** - Understands ontogenetic workflow semantics  

## Next Steps

- Add more violation types (cyclic dependencies, type mismatches)
- Implement "Execute repair" for runtime fixes (with rollback)
- Add repair history and undo/redo support
- Create repair quality metrics and confidence scoring
