# Fortistate Comprehensive DemoThis is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).



This Next.js application demonstrates **all features** of Fortistate delivered across **Epics 1-5**, showcasing the transformation into a production-ready, collaborative state management platform.## Getting Started



## 🎯 What This Demo ShowsFirst, run the development server:



### Epic 1-3: Authentication & Developer Experience```bash

- **Unified auth system** with `createRoleEnforcer`npm run dev

- **Role-based access control** (observer/editor/admin)# or

- **Session management** with create/list/revoke operationsyarn dev

- **JWT tokens** with TTL (time-to-live)# or

- **CLI integration** for session workflowspnpm dev

# or

### Epic 4: Audit Loggingbun dev

- **Log rotation** (size and age-based)```

- **Multiple export formats** (JSON, CSV, plain text)

- **Complete audit trail** of all admin actionsOpen [http://localhost:3000](http://localhost:3000) with your browser to see the result.

- **Compliance-ready** logging system

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### Epic 5: Multi-User Collaboration

- **Real-time presence tracking** of connected usersThis project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

- **WebSocket protocol** for live updates

- **Active store awareness** - see what others are viewing## Learn More

- **Cursor tracking** through state tree navigation

- **Automatic idle cleanup** after 5 minutesTo learn more about Next.js, take a look at the following resources:



### Core Features- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

- **Reactive state stores** with instant updates- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

- **Type-safe** TypeScript support

- **Nested objects and arrays** You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

- **Real-time inspector** integration

## Deploy on Vercel

---

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

## 🚀 Quick Start

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### 1. Install Dependencies

```bash
cd examples/my-nextjs-app
npm install
```

### 2. Build Fortistate (if not already built)

```bash
cd ../../
npm run build
cd examples/my-nextjs-app
```

### 3. Start the Inspector

In one terminal:

```bash
# From the fortistate root
npm run inspect

# Optional: specify a custom port
npm run inspect -- --port 5173

# Allow the Next.js app (port 3000) to talk to the inspector
npm run inspect -- --allow-origin http://localhost:3000

# Combine flags as needed (port + allow-origin, etc.)
```

By default the inspector listens on **http://localhost:4000**. If you override the port or need to allow multiple origins, pass the flags shown above so the browser can reach it.

> ℹ️ The demo now proxies REST calls through `/api/fortistate`, so listing sessions or fetching audit logs works even when the inspector omits CORS headers. You'll still want `--allow-origin http://localhost:3000` to keep the Presence WebSocket happy.

### 4. Configure the Demo (if needed)

The demo reads `NEXT_PUBLIC_INSPECTOR_URL` from `.env.local`. We ship a default file pointing to `http://localhost:4000`. If you changed the inspector port, update the variable:

```bash
echo NEXT_PUBLIC_INSPECTOR_URL=http://localhost:5173 > .env.local
```

### 5. Run the Next.js App

In another terminal:

```bash
# From examples/my-nextjs-app
npm run dev
```

The app will start on `http://localhost:3000`

### 6. Open Both in Your Browser

- **Demo App**: http://localhost:3000
- **Inspector**: http://localhost:4000 (or your configured port)

---

## 📖 Using the Demo

### Overview Tab (📊)

The landing page provides:
- Summary of all 5 epics and their features
- Quick navigation to different sections
- Quick start guide
- Feature highlights

### Sessions Tab (🔐)

**Test authentication and session management:**

1. **Create a Session**
   - Select a role: `observer` (read-only), `editor` (can modify), or `admin` (full control)
   - Add a label (e.g., "Alice", "Bob", "Test User")
   - Choose TTL (1h, 24h, 7d, 30d)
   - Click "Create Session"
   - **Save the token** - it's stored in localStorage

2. **List Active Sessions**
   - Click "List Active Sessions"
   - See all currently active sessions
   - View session details (role, expiry, ID)

3. **Revoke Sessions**
   - Click "Revoke" next to any session
   - Requires admin privileges

**What to test:**
- Create sessions with different roles
- Try accessing features with observer role (should be limited)
- Create an admin session to access audit logs
- Revoke old sessions

### Stores Tab (🗄️)

**Interact with reactive state stores:**

#### Counter Store
- Click **Increment/Decrement** to modify the counter
- Watch the count update in real-time
- See the action history
- Click **Reset** to clear

#### Cart Store
- Click **Add Random Item** to add products
- Remove items from the cart
- See total price calculation
- Demonstrates nested arrays and objects

#### User Store
- Edit the name and email fields
- Change theme preference
- Toggle notifications
- Demonstrates nested object updates

**What to test:**
- Make changes in the demo
- Open the inspector at `localhost:4000` (or your configured port)
- See changes reflected in real-time
- Edit state directly in the inspector
- See changes flow back to the demo

### Presence Tab (👥)

**Experience real-time collaboration:**

1. **Connect to Inspector**
   - Ensure you have a valid session token
   - WebSocket connection establishes automatically
   - Green dot indicates connected status

2. **Select Active Store**
   - Choose which store you're "viewing"
   - This broadcasts to all connected users

3. **Test Cursor Updates**
   - Click "Test Cursor Update" to simulate navigation
   - Simulates moving through the state tree

4. **See Other Users**
   - Open multiple browser windows/tabs
   - Create different sessions in each
   - Select different active stores
   - See all users in real-time

**What to test:**
- Open 2-3 browser tabs with different sessions
- Select different stores in each tab
- Watch presence updates in real-time
- See activity status (Active/Idle/Away)
- Test cursor tracking

### Audit Tab (📝)

**View system audit logs:**

1. **Select Export Format**
   - **JSON**: Structured data with metadata
   - **CSV**: Excel-compatible spreadsheet
   - **Plain**: Tab-separated for grep/awk

2. **Fetch Audit Log**
   - Requires admin role
   - Shows all logged actions
   - Includes timestamps, sessions, roles

3. **Download Logs**
   - Click "Download" to save logs
   - Use for compliance reporting
   - Analyze with external tools

**What to test:**
- Create sessions (generates audit entries)
- Revoke sessions (logged action)
- Try all three export formats
- Download and open in Excel (CSV)
- Check log rotation after size/time thresholds

---

## 🧪 Testing Collaboration Features

### Multi-User Scenario

**Setup:**
1. Open **3 browser windows** side-by-side
2. In each window:
   - Go to http://localhost:3000
   - Navigate to **Sessions** tab
   - Create a session with different roles and labels:
     - Window 1: Admin named "Alice"
     - Window 2: Editor named "Bob"
     - Window 3: Observer named "Charlie"

**Test Presence:**
1. Go to **Presence** tab in all windows
2. Select different stores in each window
3. See all users appear in the connected users list
4. Watch real-time updates as users change stores
5. Close one window and see the user disappear

**Test State Sync:**
1. Go to **Stores** tab in Window 1 (Alice - Admin)
2. Increment the counter
3. Watch the counter update in Window 2 and 3
4. Add items to cart in Window 2 (Bob - Editor)
5. See cart update in all windows

**Test Audit:**
1. In Window 1 (Alice - Admin), go to **Audit** tab
2. Fetch audit logs
3. See all the actions from all sessions
4. Create/revoke sessions and watch entries appear

---

## 🔧 Configuration

### Inspector Port

Change the inspector port by updating `.env.local` (all demo components read from `NEXT_PUBLIC_INSPECTOR_URL` and the proxy forwards to that host):

```bash
echo NEXT_PUBLIC_INSPECTOR_URL=http://localhost:5173 > .env.local
```

No source changes are required—`SessionManager`, `PresenceViewer`, and `AuditLogViewer` all pick up the new value automatically.

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
