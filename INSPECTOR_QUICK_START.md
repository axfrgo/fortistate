# Inspector Quick Start Guide

## ✅ Fixed: Store Isolation Issue

The inspector now correctly isolates stores per directory! No more seeing stale demo data from other projects.

## 🚀 How to Use

### Step 1: Start the Inspector

```powershell
cd c:\Users\alexj\Desktop\fortistate\packages\visual-studio
npm run inspect
```

Expected output:
```
[fortistate][inspector] listening http://localhost:4000
[fortistate][inspector] config loaded (startup): 0 plugin stores
Inspector running - open http://localhost:4000
```

### Step 2: Start the Visual Studio App

```powershell
# In a new terminal
cd c:\Users\alexj\Desktop\fortistate\packages\visual-studio
npm run dev
```

After ~2 seconds, check browser console:
```
[Inspector] Initializing client integration...
[Inspector] Registered store: integration
[Inspector] Registered store: universeRegistry
[Inspector] Registered store: session
[Inspector] Registered store: subscription
[Inspector] Registered 4 stores
[Inspector] View at http://localhost:4000
```

### Step 3: Open the Inspector

Open `http://localhost:4000` in your browser

You should see:
- ✅ **integration** store (your OAuth accounts and bindings)
- ✅ **universeRegistry** store (your saved universes)
- ✅ **session** store (your session data)
- ✅ **subscription** store (subscription state)
- ❌ NO stale/demo data from other directories

## 🎨 Aurora White Theme

The inspector now features a beautiful Aurora White theme with:
- Clean white background with soft pastels
- Aurora-inspired gradients (purple → pink → green)
- Glassmorphic cards with frosted blur
- Real-time store updates
- Dark text on light for better readability

## 🔍 What You Can Do

### View Store State
Click any store to see its current value in JSON format

### Monitor Changes
Make changes in the app (e.g., connect OAuth account) and watch the store update in real-time

### Inspect OAuth Integrations
The `integration` store shows:
- All connected accounts
- OAuth credentials (demo mode vs real)
- Account bindings to personas/contexts
- Connection status

### Debug Issues
If stores aren't updating:
1. Check browser console for `[Inspector]` logs
2. Verify inspector server is running on port 4000
3. Make sure app is in development mode

## 📁 Directory Structure

```
fortistate/
├── .fortistate/
│   └── remote-stores-visual-studio.json  ← Stores for visual-studio
│
packages/
└── visual-studio/
    ├── src/
    │   ├── utils/
    │   │   └── inspectorClient.ts  ← New inspector integration
    │   └── main.tsx  ← Initializes inspector
    └── package.json  ← "inspect" script
```

## 🎯 Key Changes

1. **CLI Enhancement**: Added `--cwd` flag to scope inspector to specific directory
2. **Inspector Client**: Automatically registers browser stores with inspector server
3. **Package Script**: `npm run inspect` launches inspector scoped to current package
4. **Aurora Theme**: Beautiful white theme with aurora gradients

## 🐛 Troubleshooting

### No stores showing
- Wait 2-3 seconds after app starts (stores need time to initialize)
- Check browser console for `[Inspector] Registered X stores`
- Verify inspector is running on port 4000

### Stale data showing
- Delete `.fortistate/remote-stores-*.json` files
- Restart inspector: `npm run inspect`
- Hard refresh browser (Ctrl+Shift+R)

### CORS errors
- Start inspector with: `npm run inspect -- --allow-origin *`
- Or set `FORTISTATE_INSPECTOR_ALLOW_ORIGIN=*`

## 📚 Documentation

- **Full Fix Details**: `INSPECTOR_STORE_ISOLATION_FIX.md`
- **Aurora Theme**: `INSPECTOR_AURORA_WHITE_THEME.md`
- **OAuth Setup**: `packages/visual-studio/REAL_OAUTH_SETUP.md`

Enjoy your fresh, isolated, beautifully themed inspector! 🌌✨
