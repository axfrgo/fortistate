# Fortistate Next.js Demo - Ontogenetic Edition# Fortistate Comprehensive DemoThis is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).



A comprehensive demonstration of Fortistate state management with **ontogenetic laws** - rules that govern how state should evolve over time.



## 🎮 FeaturesThis Next.js application demonstrates **all features** of Fortistate delivered across **Epics 1-5**, showcasing the transformation into a production-ready, collaborative state management platform.## Getting Started



### 1. Space Shooter Game with Law Enforcement

- **10 Ontogenetic Laws** governing game state

- Real-time law validation and violation detection## 🎯 What This Demo ShowsFirst, run the development server:

- Auto-fix capability for law violations

- Interactive game with health, score, levels, enemies, and power-ups

- Visual law enforcement panel showing violations and suggestions

### Epic 1-3: Authentication & Developer Experience```bash

### 2. Full Inspector Integration

- Automatic store detection and exposure- **Unified auth system** with `createRoleEnforcer`npm run dev

- Real-time state monitoring

- Law validation with presets (strict, production, development, minimal, none)- **Role-based access control** (observer/editor/admin)# or

- Timeline view of all state mutations

- Telemetry data for law enforcement metrics- **Session management** with create/list/revoke operationsyarn dev

- WebSocket connection for live updates

- **JWT tokens** with TTL (time-to-live)# or

### 3. Complete Feature Demo

- **Authentication & Sessions**: Role-based access control- **CLI integration** for session workflowspnpm dev

- **Audit Logging**: Complete history of all state changes

- **Collaboration**: Real-time presence tracking# or

- **State Management**: Reactive stores with type safety

### Epic 4: Audit Loggingbun dev

## 🚀 Quick Start

- **Log rotation** (size and age-based)```

### 1. Install Dependencies

```bash- **Multiple export formats** (JSON, CSV, plain text)

npm install

```- **Complete audit trail** of all admin actionsOpen [http://localhost:3000](http://localhost:3000) with your browser to see the result.



### 2. Start the Demo App- **Compliance-ready** logging system

```bash

npm run devYou can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

```

### Epic 5: Multi-User Collaboration

The app will be available at [http://localhost:3000](http://localhost:3000)

- **Real-time presence tracking** of connected usersThis project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

### 3. Start the Inspector (in a separate terminal)

From the root of the fortistate project:- **WebSocket protocol** for live updates

```bash

npm run inspect- **Active store awareness** - see what others are viewing## Learn More

```

- **Cursor tracking** through state tree navigation

The inspector will open at [http://localhost:4000](http://localhost:4000)

- **Automatic idle cleanup** after 5 minutesTo learn more about Next.js, take a look at the following resources:

## 🔍 Inspector Integration



### Automatic Store Detection

The app automatically exposes these stores to the inspector:### Core Features- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

- `gameState` - Space shooter game state with ontogenetic laws

- `counter` - Simple counter demo- **Reactive state stores** with instant updates- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

- `cart` - Shopping cart with nested objects

- `user` - User profile and preferences- **Type-safe** TypeScript support

- `collaboration` - Real-time presence data

- `session` - Authentication session- **Nested objects and arrays** You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

- `audit` - Audit log entries

- **Real-time inspector** integration

### Inspector Features

## Deploy on Vercel

#### 1. **Store Monitoring**

- View all stores in real-time---

- See current state values

- Filter stores by nameThe easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

- Auto-refresh on changes

## 🚀 Quick Start

#### 2. **Ontogenetic Laws**

The inspector includes 10 game-specific laws:Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

- **GAME-001**: Player health bounds (0 to maxHealth)

- **GAME-002**: Score must be non-negative### 1. Install Dependencies

- **GAME-003**: Level must be positive integer

- **GAME-004**: Resources should not exceed capacity```bash

- **GAME-005**: Game pause time limit (5 minutes)cd examples/my-nextjs-app

- **GAME-006**: Player position within boundsnpm install

- **GAME-007**: High score tracking```

- **GAME-008**: Enemy count sync with array length

- **GAME-009**: Power-up expiration times### 2. Build Fortistate (if not already built)

- **GAME-010**: State mutation validation

```bash

#### 3. **Law Presets**cd ../../

Apply pre-configured law enforcement levels:npm run build

- **Strict**: All laws enforced (development/testing)cd examples/my-nextjs-app

- **Production**: Production-safe rules only```

- **Development**: Balanced for active development

- **Minimal**: Essential laws only### 3. Start the Inspector

- **None**: Disable law enforcement

In one terminal:

#### 4. **Timeline**

- View complete history of state changes```bash

- Track which actions triggered mutations# From the fortistate root

- Replay state changesnpm run inspect

- Debug time-based issues

# Optional: specify a custom port

#### 5. **Telemetry**npm run inspect -- --port 5173

- Monitor law violation counts

- See which laws fail most often# Allow the Next.js app (port 3000) to talk to the inspector

- Performance metrics for validationnpm run inspect -- --allow-origin http://localhost:3000

- Real-time charts and graphs

# Combine flags as needed (port + allow-origin, etc.)

#### 6. **Auto-Fix**```

- Automatically repair law violations

- Apply fixes with one clickBy default the inspector listens on **http://localhost:4000**. If you override the port or need to allow multiple origins, pass the flags shown above so the browser can reach it.

- See before/after state comparison

> ℹ️ The demo now proxies REST calls through `/api/fortistate`, so listing sessions or fetching audit logs works even when the inspector omits CORS headers. You'll still want `--allow-origin http://localhost:3000` to keep the Presence WebSocket happy.

## 🎮 Playing the Game

### 4. Configure the Demo (if needed)

### Game Controls

- **Arrow Buttons**: Move player (left, right, up, down)The demo reads `NEXT_PUBLIC_INSPECTOR_URL` from `.env.local`. We ship a default file pointing to `http://localhost:4000`. If you changed the inspector port, update the variable:

- **Shoot**: Fire at enemies (costs ammo)

- **Spawn Enemy**: Add new enemy to the game```bash

- **+Score**: Increase score by 100echo NEXT_PUBLIC_INSPECTOR_URL=http://localhost:5173 > .env.local

- **Level Up**: Advance to next level```

- **Take Damage**: Reduce player health by 20

- **Collect Resources**: Gain ammo, shields, or energy### 5. Run the Next.js App

- **Speed Boost**: Activate temporary speed power-up

- **Pause/Resume**: Toggle game stateIn another terminal:

- **Reset**: Start a new game

```bash

### Law Violation Triggers# From examples/my-nextjs-app

Test the inspector's law enforcement by clicking these buttons:npm run dev

- **Break Health Law**: Set health above maxHealth```

- **Break Score Law**: Set negative score

- **Break Level Law**: Set non-integer levelThe app will start on `http://localhost:3000`

- **Break Resource Law**: Exceed resource capacity

- **Break Position Law**: Move player out of bounds### 6. Open Both in Your Browser

- **Break Enemy Count**: Desync enemy count

- **Demo App**: http://localhost:3000

After triggering violations:- **Inspector**: http://localhost:4000 (or your configured port)

1. Open the inspector

2. Check the "Laws" panel---

3. See violations highlighted in red/yellow

4. Click "Auto-Fix" to repair violations## 📖 Using the Demo

5. Watch the state correct itself in real-time

### Overview Tab (📊)

## 📊 Inspector Workflow

The landing page provides:

### Typical Usage- Summary of all 5 epics and their features

1. **Start both services**: Demo app on :3000, Inspector on :4000- Quick navigation to different sections

2. **Navigate to Game Demo**: Click "🎮 Game Demo" in the app- Quick start guide

3. **Open Inspector**: Auto-detects running app and stores- Feature highlights

4. **Play the game**: Move around, shoot enemies, collect resources

5. **Trigger violations**: Click law violation buttons### Sessions Tab (🔐)

6. **Monitor inspector**: Watch real-time violations appear

7. **Apply law presets**: Configure enforcement level**Test authentication and session management:**

8. **Auto-fix issues**: Click repair button

9. **View timeline**: See complete mutation history1. **Create a Session**

10. **Check telemetry**: Analyze law enforcement metrics   - Select a role: `observer` (read-only), `editor` (can modify), or `admin` (full control)

   - Add a label (e.g., "Alice", "Bob", "Test User")

### Law Preset Configuration   - Choose TTL (1h, 24h, 7d, 30d)

1. In the inspector, click "🎨 Presets"   - Click "Create Session"

2. Select a preset from the dropdown   - **Save the token** - it's stored in localStorage

3. Click "Apply to Target Store"

4. The preset configuration is saved to localStorage2. **List Active Sessions**

5. Laws are enforced according to the selected preset   - Click "List Active Sessions"

   - See all currently active sessions

### Inspector Help   - View session details (role, expiry, ID)

- Click "❓ Help" button in the inspector

- Comprehensive guide to all features3. **Revoke Sessions**

- Tips for efficient workflow   - Click "Revoke" next to any session

- Links to additional documentation   - Requires admin privileges



## 🏗️ Architecture**What to test:**

- Create sessions with different roles

### State Management- Try accessing features with observer role (should be limited)

```- Create an admin session to access audit logs

App- Revoke old sessions

├── gameState (with ontogenetic laws)

│   ├── player { health, position, speed }### Stores Tab (🗄️)

│   ├── score, highScore, level

│   ├── enemies [...], enemyCount**Interact with reactive state stores:**

│   ├── resources { energy, shields, ammo }

│   └── activePowerUps [...]#### Counter Store

├── counter- Click **Increment/Decrement** to modify the counter

├── cart- Watch the count update in real-time

├── user- See the action history

├── collaboration- Click **Reset** to clear

├── session

└── audit#### Cart Store

```- Click **Add Random Item** to add products

- Remove items from the cart

### Law Enforcement Flow- See total price calculation

```- Demonstrates nested arrays and objects

1. User action (e.g., move player)

2. State mutation via useStore.gameState.set()#### User Store

3. Law validation (GAME_LAWS.validate())- Edit the name and email fields

4. Violation detection- Change theme preference

5. Inspector notification- Toggle notifications

6. Display in inspector UI- Demonstrates nested object updates

7. Optional: Auto-fix application

```**What to test:**

- Make changes in the demo

### Inspector Communication- Open the inspector at `localhost:4000` (or your configured port)

```- See changes reflected in real-time

Demo App (localhost:3000)- Edit state directly in the inspector

      ↓ WebSocket- See changes flow back to the demo

      ↓ Store mutations

Inspector Server (localhost:4000)### Presence Tab (👥)

      ↓ HTTP/WebSocket

Inspector UI (browser)**Experience real-time collaboration:**

```

1. **Connect to Inspector**

## 🧪 Testing Law Enforcement   - Ensure you have a valid session token

   - WebSocket connection establishes automatically

### Example: Health Bounds Law (GAME-001)   - Green dot indicates connected status

```typescript

// Violate the law2. **Select Active Store**

useStore.gameState.set({   - Choose which store you're "viewing"

  ...gameState,   - This broadcasts to all connected users

  player: { ...player, health: 150 } // maxHealth is 100

});3. **Test Cursor Updates**

   - Click "Test Cursor Update" to simulate navigation

// Inspector shows:   - Simulates moving through the state tree

// 🚨 GAME-001: Player health (150) must be between 0 and 100

// 💡 Suggestion: Set health to a value between 0 and 1004. **See Other Users**

   - Open multiple browser windows/tabs

// Auto-fix applies:   - Create different sessions in each

// player.health = Math.min(100, 150) // = 100 ✅   - Select different active stores

```   - See all users in real-time



### Example: Score Law (GAME-002)**What to test:**

```typescript- Open 2-3 browser tabs with different sessions

// Violate the law- Select different stores in each tab

useStore.gameState.set({- Watch presence updates in real-time

  ...gameState,- See activity status (Active/Idle/Away)

  score: -100 // Negative score- Test cursor tracking

});

### Audit Tab (📝)

// Inspector shows:

// 🚨 GAME-002: Score (-100) cannot be negative**View system audit logs:**

// 💡 Suggestion: Set score to 0 or positive value

1. **Select Export Format**

// Auto-fix applies:   - **JSON**: Structured data with metadata

// score = Math.max(0, -100) // = 0 ✅   - **CSV**: Excel-compatible spreadsheet

```   - **Plain**: Tab-separated for grep/awk



## 📚 Additional Resources2. **Fetch Audit Log**

   - Requires admin role

- **Fortistate Documentation**: `../../docs/`   - Shows all logged actions

- **Inspector API**: `../../docs/API.md`   - Includes timestamps, sessions, roles

- **Ontogenetic Laws Guide**: `../../docs/EMERGENCE.md`

- **Epic Review**: `../../docs/EPIC_1-5_REVIEW.md`3. **Download Logs**

- **Production Guide**: `../../docs/PRODUCTION.md`   - Click "Download" to save logs

   - Use for compliance reporting

## 🐛 Troubleshooting   - Analyze with external tools



### Inspector not connecting?**What to test:**

1. Ensure both services are running (`npm run dev` and `npm run inspect`)- Create sessions (generates audit entries)

2. Check ports: Demo on :3000, Inspector on :4000- Revoke sessions (logged action)

3. Check browser console for connection errors- Try all three export formats

4. Try refreshing both browser tabs- Download and open in Excel (CSV)

- Check log rotation after size/time thresholds

### Stores not appearing in inspector?

1. Check browser console for "Exposed stores" log---

2. Verify `InspectorInit` component is loaded

3. Wait a few seconds for WebSocket connection## 🧪 Testing Collaboration Features

4. Manually refresh the inspector

### Multi-User Scenario

### Law violations not showing?

1. Ensure you clicked a "Break X Law" button**Setup:**

2. Open the "Laws" panel in the inspector1. Open **3 browser windows** side-by-side

3. Check that the `gameState` store is selected2. In each window:

4. Verify laws are enabled (not "none" preset)   - Go to http://localhost:3000

   - Navigate to **Sessions** tab

### Auto-fix not working?   - Create a session with different roles and labels:

1. Some laws don't have auto-fix implementations     - Window 1: Admin named "Alice"

2. Check if the violation is an "info" level (can't auto-fix)     - Window 2: Editor named "Bob"

3. Try applying a different law preset     - Window 3: Observer named "Charlie"

4. Manually correct the state via inspector

**Test Presence:**

## 📝 Scripts1. Go to **Presence** tab in all windows

2. Select different stores in each window

```bash3. See all users appear in the connected users list

# Development4. Watch real-time updates as users change stores

npm run dev              # Start Next.js app on :30005. Close one window and see the user disappear

npm run build            # Build for production

npm run start            # Start production server**Test State Sync:**

npm run lint             # Run ESLint1. Go to **Stores** tab in Window 1 (Alice - Admin)

```2. Increment the counter

3. Watch the counter update in Window 2 and 3

From the root fortistate directory:4. Add items to cart in Window 2 (Bob - Editor)

```bash5. See cart update in all windows

npm run inspect          # Start inspector on :4000

```**Test Audit:**

1. In Window 1 (Alice - Admin), go to **Audit** tab

## 🎯 What's Next?2. Fetch audit logs

3. See all the actions from all sessions

Try these advanced features:4. Create/revoke sessions and watch entries appear

1. Create custom ontogenetic laws

2. Implement law enforcement in your own stores---

3. Use law presets for different environments

4. Integrate inspector into your development workflow## 🔧 Configuration

5. Build multi-player features with collaboration stores

6. Implement audit logging in production### Inspector Port



## 📄 LicenseChange the inspector port by updating `.env.local` (all demo components read from `NEXT_PUBLIC_INSPECTOR_URL` and the proxy forwards to that host):



Part of the Fortistate project. See main LICENSE file.```bash

echo NEXT_PUBLIC_INSPECTOR_URL=http://localhost:5173 > .env.local

---```



**Built with ❤️ using Fortistate + Next.js + Ontogenetic Laws**No source changes are required—`SessionManager`, `PresenceViewer`, and `AuditLogViewer` all pick up the new value automatically.


### Environment Variables

Set these in your inspector environment:

```bash
# Session secret (for persistent tokens)
export FORTISTATE_SESSION_SECRET="your-secret-key"

# Audit log rotation
export FORTISTATE_AUDIT_MAX_SIZE=10485760  # 10MB in bytes
export FORTISTATE_AUDIT_ROTATE_DAYS=30     # 30 days
```

---

## 📚 Documentation Links

- **[EPIC_1-5_REVIEW.md](../../docs/EPIC_1-5_REVIEW.md)** - Comprehensive review of all epics
- **[EPIC_SUMMARY.md](../../docs/EPIC_SUMMARY.md)** - Executive summary with metrics
- **[COLLABORATION.md](../../docs/COLLABORATION.md)** - Collaboration features guide
- **[AUTHENTICATION.md](../../docs/AUTHENTICATION.md)** - Auth and security documentation
- **[EPICS.md](../../docs/EPICS.md)** - Epic tracking and changelogs

---

## 🐛 Troubleshooting

### "No authentication token" Error

**Problem:** Components can't connect to inspector

**Solution:**
1. Go to **Sessions** tab
2. Create a new session
3. Token is automatically saved to localStorage
4. Refresh the page if needed

### WebSocket Connection Failed

**Problem:** Presence viewer shows "Disconnected"

**Solution:**
1. Ensure inspector is running on `localhost:4000` (or your configured port)
2. If Presence keeps disconnecting, restart the inspector with `--allow-origin http://localhost:3000`
2. Check that you have a valid session token
3. Look for CORS issues in browser console
4. Try creating a new session

### Audit Log Access Denied

**Problem:** "Failed to fetch audit log: 403"

**Solution:**
1. Audit logs require **admin role**
2. Go to **Sessions** tab
3. Create a new session with role = "admin"
4. Return to **Audit** tab and try again

### Stores Not Updating

**Problem:** Changes don't appear in inspector

**Solution:**
1. Check inspector is running
2. Open browser console for errors
3. Verify stores are registered
4. Try refreshing both demo and inspector

---

## 🎓 Learning Paths

### For Backend Developers

Focus on:
1. **Sessions** - Authentication and authorization patterns
2. **Audit** - Compliance logging and export formats
3. Review `SessionManager.tsx` and `AuditLogViewer.tsx`

### For Frontend Developers

Focus on:
1. **Stores** - Reactive state management patterns
2. **Presence** - Real-time WebSocket communication
3. Review `StoreDemo.tsx` and `PresenceViewer.tsx`

### For Full-Stack Developers

Explore everything:
1. Start with **Overview** to understand architecture
2. Try all features in sequence
3. Open inspector to see backend integration
4. Review source code for implementation patterns

---

## 📊 Metrics

- **107 total tests** (48 new + 59 existing) - 100% pass rate ✅
- **3,500+ lines** of documentation
- **Zero breaking changes** - fully backward compatible
- **4 major components** showcasing all features
- **5 strategic epics** completed

---

## 🎉 What's Next

This demo provides the foundation for:

- **Epic 6**: Presence UI Components (visual avatars, cursor indicators)
- **Epic 7**: Time-Travel Debugging (state history, replay)
- **Epic 8**: Performance Monitoring (metrics, alerts)
- **Epic 9**: Plugin System Enhancement (marketplace, custom panels)

---

## 💬 Feedback

Have questions or suggestions? Check the main documentation or open an issue.

**Fortistate v1.0.3** - Production-ready collaborative state management platform
