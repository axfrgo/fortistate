# 🎉 FortiState 3.0 - Collaborative Inspector Edition

**Release Date:** October 11, 2025

FortiState 3.0 introduces powerful collaboration features, enhanced IDE integration, and a completely redesigned inspector experience. This major release transforms FortiState from a developer tool into a team collaboration platform.

---

## 🌟 Major Features

### 1. **📸 Share Store Snapshots**
Share state snapshots instantly with your team or save them for later analysis.

**Features:**
- One-click shareable URLs with base64-encoded store data
- Multiple sharing methods:
  - 📋 Copy link to clipboard
  - 📧 Email snapshots
  - 🐦 Tweet state for community help
  - 📄 Download as JSON
  - 📊 Export as CSV for data analysis
- Live snapshot preview in modal
- Automatic URL generation and encoding

**Use Cases:**
- Bug reporting with exact state reproduction
- Team collaboration and debugging
- State persistence across sessions
- Data export for analytics

---

### 2. **🔍 Locate Store in Code**
Find where stores are defined and used in your codebase with intelligent search.

**Features:**
- **Automatic VS Code Integration** - Opens files directly in your editor
- Search pattern generation for multiple scenarios:
  - Store creation patterns (`createStore('storeName')`)
  - Store usage patterns (`.get('storeName')`, `['storeName']`)
  - Variable naming patterns (`storeNameStore`)
- IDE integration for:
  - 📝 VS Code (with auto-open)
  - 💡 WebStorm/IntelliJ
  - 🐙 GitHub search
- Suggests common file locations
- Copy search patterns to clipboard

**Backend Endpoint:**
- `POST /open-in-vscode` - Intelligently locates and opens store files
- Searches common paths and uses grep fallback
- Works with `code` CLI command

---

### 3. **👥 Invite Team to Inspector**
Share your inspector session with teammates for real-time collaboration.

**Features:**
- Shareable inspector session URL
- Multiple invite methods:
  - 📋 Copy inspector URL
  - 📧 Email invitation with instructions
  - 📱 QR code for mobile access
- Comprehensive collaborator instructions
- Security warnings for network sharing
- Session persistence across team members

**Collaboration Features:**
- Real-time store synchronization
- All team members see changes instantly
- Shared state inspection and debugging
- Perfect for pair programming
- Remote debugging support

---

## 🎨 Enhanced Inspector UI

### Aurora White Theme
Beautiful, professional interface with:
- Soft pastel colors inspired by northern lights
- Glassmorphism effects
- Clean white background
- Gradient accents (purple, pink, blue, green)
- Professional button styling
- Improved readability

### UX Improvements
- Auto-closing temporary modals
- Toast notifications for actions
- Loading states and feedback
- Error handling with helpful messages
- Keyboard shortcuts support
- Responsive design for all screen sizes

---

## 🔧 Technical Improvements

### Backend Enhancements
- New `/open-in-vscode` endpoint for IDE integration
- Improved store discovery with grep fallback
- Better error handling and logging
- Session management for collaboration
- CORS support for cross-origin requests

### Client-Side Improvements
- Eliminated template string conflicts
- Cleaner event listener management
- Better modal management
- Clipboard API with fallbacks
- Network request error handling
- Proper escaping for HTML injection prevention

### Directory-Scoped Inspector
- `--cwd` flag for workspace isolation
- Prevents cross-contamination between projects
- Namespace-based store persistence
- Per-directory configuration

---

## 🚀 VS Code Extension Ready

FortiState 3.0 is designed to work seamlessly with the FortiState VS Code Extension:

**Extension Features:**
- View all store snapshots in sidebar
- Click to navigate directly to store definitions
- Real-time state updates
- Integrated debugging tools
- Quick access to inspector features

**Installation:**
Search for "FortiState" in VS Code Extensions marketplace

---

## 📦 Installation

### NPM
```bash
npm install fortistate@3.0.0
```

### Yarn
```bash
yarn add fortistate@3.0.0
```

### pnpm
```bash
pnpm add fortistate@3.0.0
```

---

## 🎯 Quick Start

### 1. Create a Store
```typescript
import { createStore } from 'fortistate'

const counterStore = createStore('counter', { count: 0 })
```

### 2. Start the Inspector
```bash
npx fortistate inspect
```

### 3. Register Your Store (Browser)
```typescript
import 'fortistate/inspector-client'

// Your stores will automatically register with the inspector
```

### 4. Open Inspector
Navigate to `http://localhost:4000`

### 5. Use New Features
- Click **📸** on any store to share snapshots
- Click **🔍** to locate store in your code
- Click **👥 Invite** to share with your team

---

## 🔄 Migration from 2.x

FortiState 3.0 is **fully backward compatible** with 2.x. No breaking changes!

### What's New
All 2.x features continue to work exactly as before. The new features are additive:
- New inspector UI buttons (Share, Locate, Invite)
- New backend endpoint (`/open-in-vscode`)
- Enhanced modals and UX

### Upgrade Steps
1. Update package:
   ```bash
   npm install fortistate@3.0.0
   ```

2. Rebuild your project:
   ```bash
   npm run build
   ```

3. Restart the inspector:
   ```bash
   npx fortistate inspect
   ```

That's it! All new features are immediately available.

---

## 📊 What's Included

### Core Library
- ✅ Reactive state management
- ✅ React hooks (`useStore`)
- ✅ Vue composables
- ✅ Vanilla JS support
- ✅ TypeScript support
- ✅ Zero-config setup

### Inspector Features (New in 3.0)
- ✅ Share store snapshots
- ✅ Locate stores in code
- ✅ Invite team collaboration
- ✅ Real-time sync
- ✅ History tracking
- ✅ Ontogenetic laws
- ✅ Preset configurations
- ✅ OAuth authentication
- ✅ Session management

### Advanced Features
- ✅ Physics engine integration
- ✅ Temporal debugging
- ✅ Preset system
- ✅ Plugin architecture
- ✅ Telemetry streaming
- ✅ Universe manager
- ✅ Constraint runtime

---

## 🐛 Bug Fixes

- Fixed store cross-contamination in multi-project workspaces
- Fixed template string escaping in inspector client
- Improved clipboard API fallback support
- Better error messages for missing stores
- Fixed modal z-index conflicts
- Improved WebSocket reconnection logic

---

## 📚 Documentation

- [Getting Started](./GETTING_STARTED.md)
- [Inspector Guide](./docs/INSPECTOR.md)
- [Collaboration Features](./docs/COLLABORATION.md)
- [API Reference](./docs/API.md)
- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=axfrgo.fortistate)

---

## 🙏 Acknowledgments

Special thanks to all contributors and the community for feedback and suggestions that made 3.0 possible!

---

## 📄 License

ISC License - See [LICENSE](./LICENSE) file for details

---

## 🔗 Links

- **GitHub:** https://github.com/axfrgo/fortistate
- **NPM:** https://www.npmjs.com/package/fortistate
- **Issues:** https://github.com/axfrgo/fortistate/issues
- **Discussions:** https://github.com/axfrgo/fortistate/discussions

---

## 🎊 Thank You!

Thank you for using FortiState! We're excited to see what you build with these powerful new collaboration features.

Happy coding! 🚀

---

**Version:** 3.0.0  
**Released:** October 11, 2025  
**Maintainer:** axfrgo
