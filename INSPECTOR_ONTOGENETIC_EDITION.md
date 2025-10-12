# Fortistate Inspector - Ontogenetic Edition

## 🎯 Overview

The **Fortistate Inspector** has been fully upgraded with ontogenetic laws integration, modern UI design, and advanced state management features. This edition brings enterprise-grade validation, real-time monitoring, and a beautiful glassmorphic interface inspired by the Canvas design system.

---

## ✨ What's New

### **1. Modern Ontogenetic Design**
- 🎨 **Glassmorphic UI**: Frosted glass panels with backdrop blur
- 🌌 **Gradient Backgrounds**: Deep purple cosmic theme with animated particles
- 💜 **Purple Accent Theme**: Consistent #a855f7 → #ec4899 gradient throughout
- ✨ **Smooth Animations**: Hover effects, transitions, and micro-interactions
- 📱 **Responsive Design**: Works beautifully on all screen sizes

### **2. Ontogenetic Law Validator**
- ⚖️ **5 Inspector Laws**: Structural, semantic, ontogenetic, operational, quality
- 📊 **Real-time Scoring**: 0-100 quality score with visual circle indicator
- 🔍 **Violation Detection**: Automatic analysis of all remote stores
- 💡 **Smart Suggestions**: Context-aware recommendations for fixes
- 🏷️ **Severity Badges**: Critical, error, warning, info classifications

### **3. Enhanced Panels**
- 💾 **Remote Stores**: Grid layout with glassmorphic cards and shimmer effects
- 🎨 **Presets & Config**: Easy preset application and CSS installation
- ⏱️ **Timeline**: State history with replay functionality
- 📊 **Telemetry**: Law compliance tracking with SSE streaming

### **4. Improved UX**
- 🔍 **Live Filtering**: Instant search across stores, types, and values
- ⌨️ **Keyboard Navigation**: Full accessibility support
- 🎯 **Smart Detection**: Auto-detect active stores from URL/DOM
- 🔄 **Real-time Updates**: WebSocket integration for live changes

---

## 🚀 Quick Start

### **Launch the Inspector**

```bash
# Start the inspector server
npx fortistate inspect --port 4000

# Or with token authentication
npx fortistate inspect --port 4000 --token your-secret-token
```

### **Access the UI**

Open your browser to:
```
http://localhost:4000
```

You'll see the upgraded **Ontogenetic Edition** interface with:
- 🌌 Cosmic gradient background
- 💜 Purple-themed glassmorphic panels
- ⚖️ Law validator toggle button
- 📊 Real-time telemetry stream

---

## 📖 Features Guide

### **Ontogenetic Law Validator**

#### **Accessing the Validator**
Click the **⚖️ Laws** button in the top-right to open the validator panel.

#### **Understanding the Score**
- **Score Circle**: Visual representation of overall quality (0-100)
- **Pass/Fail Badge**: Green ✅ if passed, red ❌ if failed
- **Metrics**: Shows total laws, stores, and violations

#### **Inspector Laws**

| Law ID | Category | Severity | Description |
|--------|----------|----------|-------------|
| **INS-001** | Structural | Error | Store must be JSON-serializable |
| **INS-002** | Semantic | Warning | Store key should be descriptive |
| **INS-003** | Ontogenetic | Info | State should follow BEGIN→BECOME→CEASE |
| **INS-004** | Operational | Warning | Store size should be reasonable (<100KB) |
| **INS-005** | Quality | Info | State should include metadata |

#### **Violation Details**
Each violation shows:
- **Law ID**: e.g., `INS-001`
- **Severity Badge**: Color-coded by importance
- **Message**: What's wrong
- **Suggestion**: How to fix it (💡)

#### **Example Violations**

```
❌ INS-001: Store "invalidStore" contains non-serializable value
💡 Remove functions, circular references, or symbols

⚠️ INS-002: Store key "a" is too short or generic
💡 Use descriptive names like "userProfile" or "cartState"

ℹ️ INS-003: Store "userState" lacks lifecycle tracking
💡 Add status/state/phase field to track entity lifecycle
```

---

### **Remote Stores Panel**

#### **Store Cards**
Each store is displayed in a beautiful glassmorphic card:
- **Key Name**: Purple-colored, bold
- **Type Badge**: Uppercase type label
- **JSON Value**: Syntax-highlighted, scrollable
- **Shimmer Effect**: Animated gradient on hover

#### **Store Actions**
- **Duplicate**: Clone a store to a new key
- **Swap**: Exchange values between two stores
- **Move**: Rename a store key

#### **Filtering**
Use the **🔍 Filter stores** input to search:
- By key name: `user`
- By type: `object`
- By value content: `active`

---

### **Presets & Configuration**

#### **Applying Presets**
1. Select a preset from the dropdown
2. (Optional) Enter a target key
3. Click **Apply**

#### **Installing CSS**
Click **Install CSS** to inject preset styles into your app.

#### **Token Authentication**
1. Enter your inspector token
2. Click **Set Token**
3. Token will be used for authenticated requests

---

### **Timeline Panel**

#### **Viewing History**
Click **⏱️ Timeline** to show state history:
- Each entry shows action, timestamp, and data
- Click an entry to replay that state

#### **Playback Controls**
- **◀ Prev**: Go to previous state
- **▶ Play**: Replay all changes sequentially
- **Next ▶**: Go to next state

#### **Use Cases**
- Debug state transitions
- Understand change sequences
- Replay specific moments
- Time-travel debugging

---

### **Telemetry Panel**

#### **Monitoring Laws**
Click **📊 Telemetry** to stream live events:
- **Real-time updates** via SSE
- **Color-coded dots**: Error (red), warn (yellow), info (green)
- **Law names**: Which law triggered the event
- **Messages**: What happened
- **Details**: Additional context

#### **Event Types**
- `validation`: Law validation results
- `violation`: Law violation detected
- `enforcement`: Law enforcement action
- `compliance`: Compliance check passed

---

## 🎨 Design System

### **Color Palette**

```css
--bg-primary: #0f172a        /* Deep dark blue */
--bg-secondary: #1e293b      /* Slate gray */
--accent-primary: #a855f7    /* Purple */
--accent-secondary: #c084fc  /* Light purple */
--success: #10b981           /* Green */
--warning: #f59e0b           /* Orange */
--error: #ef4444             /* Red */
--info: #3b82f6              /* Blue */
```

### **Typography**
- **Font Family**: Inter, system fonts
- **Headings**: 16-24px, weight 600-700
- **Body**: 12-14px, weight 400-500
- **Code**: SF Mono, Monaco, monospace

### **Effects**
- **Glassmorphism**: `backdrop-filter: blur(10px)`
- **Shadows**: Multi-layer with colored glows
- **Borders**: `rgba(167, 139, 250, 0.2)`
- **Gradients**: 135deg purple-to-pink

---

## 🔧 Advanced Features

### **Auto-Fix (Planned)**
The **🔧 Auto-Fix** button will automatically correct violations:
- Missing metadata → Add timestamp
- Invalid keys → Suggest rename
- Large stores → Split into smaller stores
- Non-serializable → Remove problematic values

### **Law Customization**
Add custom laws by extending `INSPECTOR_LAWS`:

```javascript
INSPECTOR_LAWS.push({
  id: 'CUSTOM-001',
  category: 'custom',
  severity: 'warning',
  description: 'My custom law',
  validate: (key, value) => {
    // Your validation logic
    if (/* condition */) {
      return {
        lawId: 'CUSTOM-001',
        severity: 'warning',
        message: 'Violation message',
        suggestion: 'How to fix'
      }
    }
    return null
  }
})
```

### **WebSocket Integration**
The inspector automatically connects via WebSocket:
- **Auto-reconnect**: Retries on connection loss
- **Multi-host**: Tries localhost:4000 and 127.0.0.1:4000
- **Real-time sync**: Store changes propagate instantly

---

## 📊 Ontogenetic Laws Explained

### **Why Ontogenetic Laws?**
Ontogenetic laws enforce the **BEGIN → BECOME → CEASE** lifecycle pattern from Fortistate's core philosophy. They ensure:
- **Consistency**: All states follow predictable patterns
- **Quality**: Stores meet minimum standards
- **Maintainability**: Easy to understand and debug
- **Reliability**: Fewer runtime errors

### **Law Categories**

#### **1. Structural**
Ensure technical correctness:
- Valid JSON serialization
- Proper data structures
- No circular references

#### **2. Semantic**
Ensure meaningful content:
- Descriptive naming
- Clear intent
- Appropriate types

#### **3. Ontogenetic**
Enforce lifecycle patterns:
- Status tracking (BEGIN/BECOME/CEASE)
- State transitions
- Entity evolution

#### **4. Operational**
Ensure runtime performance:
- Reasonable sizes
- Efficient structures
- Scalability

#### **5. Quality**
Promote best practices:
- Metadata inclusion
- Timestamps
- Version tracking

---

## 🎯 Best Practices

### **Store Design**
```javascript
// ✅ Good
{
  "userProfile": {
    "status": "active",           // Ontogenetic tracking
    "name": "Alice",
    "email": "alice@example.com",
    "timestamp": 1696550400000,   // Metadata
    "version": 2                   // Versioning
  }
}

// ❌ Bad
{
  "a": {                          // Too short
    "x": "Alice"                  // No context
    // Missing status, metadata
  }
}
```

### **Naming Conventions**
- Use camelCase: `userProfile`, `cartState`
- Be descriptive: `activeUsers` not `au`
- Include context: `checkoutSession` not `session`

### **Lifecycle Tracking**
Always include a lifecycle field:
```javascript
{
  "status": "active",    // or "created", "updated", "deleted"
  "phase": "becoming",   // or "begin", "cease", "transcend"
  "state": "processing"  // or "idle", "complete", "error"
}
```

---

## 🚀 Performance

### **Validation Speed**
- **< 10ms** for typical stores (5-20 stores)
- **O(N * L)** complexity (N stores, L laws)
- **Non-blocking**: Runs in background

### **UI Rendering**
- **60 FPS** smooth animations
- **Lazy loading**: Only visible elements rendered
- **Virtual scrolling**: For large store lists

### **WebSocket**
- **< 50ms** latency for updates
- **Automatic batching**: Multiple changes grouped
- **Reconnection**: 200ms retry intervals

---

## 📱 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus store filter |
| `Esc` | Clear filter |
| `L` | Toggle law validator |
| `T` | Toggle timeline |
| `M` | Toggle telemetry |
| `?` | Show help |

---

## 🔍 Troubleshooting

### **No Stores Found**
1. Ensure inspector server is running: `npx fortistate inspect`
2. Check port: Default is 4000
3. Verify URL: `http://localhost:4000`
4. Check CORS settings if embedded

### **WebSocket Not Connecting**
1. Check firewall settings
2. Try explicit host: `ws://localhost:4000`
3. Verify inspector server logs
4. Check browser console for errors

### **Law Validator Not Working**
1. Click **⚖️ Laws** to open panel
2. Check if stores are loaded
3. Manually trigger: Click filter input
4. Refresh page if needed

---

## 🎓 Examples

### **Example 1: Validating User Stores**
```javascript
// Inspector detects this store
{
  "currentUser": {
    "id": 123,
    "name": "Alice"
    // ⚠️ INS-003: Lacks lifecycle tracking
    // ℹ️ INS-005: Lacks metadata
  }
}

// Improved version
{
  "currentUser": {
    "id": 123,
    "name": "Alice",
    "status": "active",          // ✅ Lifecycle
    "createdAt": 1696550400000,  // ✅ Metadata
    "version": 1                 // ✅ Versioning
  }
}
```

### **Example 2: Large Store Warning**
```javascript
// ⚠️ INS-004: Store is 150KB
{
  "productCatalog": {
    "items": [ /* 1000+ products */ ]
  }
}

// Better: Split into smaller stores
{
  "productCatalog_page1": { /* 50 items */ },
  "productCatalog_page2": { /* 50 items */ },
  // ...
}
```

---

## 🌟 Future Enhancements

### **Planned Features**
- [ ] Visual state flow diagrams
- [ ] AWS fix orchestrator integration
- [ ] Historical validation trends
- [ ] Collaborative presence indicators
- [ ] Export validation reports (PDF/JSON)
- [ ] Custom law profiles
- [ ] Integration with JIT compiler

---

## 📚 Related Documentation

- [Ontogenetic Laws Guide](./STORYTELLER_LAWS_GUIDE.md)
- [AWS Implementation](./ONTOGENETIC_AWS_GUIDE.md)
- [Canvas Design System](./packages/visual-studio/src/components/Canvas.css)
- [Inspector API](./docs/INSPECTOR.md)

---

## 💬 Support

For help with the Inspector:
1. Check browser console for errors
2. Review validation messages
3. Check inspector server logs
4. Consult this guide
5. File an issue with screenshots

---

**Built with ontogenetic precision for the Fortistate ecosystem** 🌌✨

---

## 🎉 Summary

The **Ontogenetic Edition** of the Fortistate Inspector brings:

✅ **Modern UI** with glassmorphism and purple theme  
✅ **Law Validator** with 5 categories and real-time scoring  
✅ **Enhanced Panels** for stores, presets, timeline, telemetry  
✅ **Improved UX** with filtering, keyboard nav, live updates  
✅ **Future-ready** architecture for advanced features  

**Ready to inspect your state with style and precision!** 🚀
