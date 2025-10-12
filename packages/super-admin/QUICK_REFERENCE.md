# Quick Reference - Super Admin Dashboard

## 🚀 Getting Started

### Start Development Server
```bash
cd c:\Users\alexj\Desktop\fortistate\packages\super-admin
npm run dev
```

### Access Dashboard
- URL: http://localhost:4200
- Login Secret: `dev-secret-key-change-in-production-please`
- IP: Automatically whitelisted for `127.0.0.1` and `::1`

## 📁 Project Structure

```
packages/super-admin/
├── src/
│   ├── app/
│   │   ├── api/                    # API Routes
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   └── logout/route.ts
│   │   │   ├── users/route.ts
│   │   │   ├── organizations/route.ts
│   │   │   ├── universes/route.ts
│   │   │   ├── security/events/route.ts
│   │   │   ├── revenue/route.ts
│   │   │   ├── ai-usage/route.ts
│   │   │   ├── feature-flags/route.ts
│   │   │   ├── system-health/route.ts
│   │   │   ├── audit-logs/route.ts
│   │   │   └── deployments/route.ts
│   │   ├── dashboard/              # Pages
│   │   │   ├── page.tsx            # Global Overview
│   │   │   ├── layout.tsx          # Dashboard Layout
│   │   │   ├── users/page.tsx
│   │   │   ├── organizations/page.tsx
│   │   │   ├── universes/page.tsx
│   │   │   ├── security/page.tsx
│   │   │   ├── revenue/page.tsx
│   │   │   ├── ai-usage/page.tsx
│   │   │   ├── feature-flags/page.tsx
│   │   │   ├── health/page.tsx
│   │   │   ├── audit/page.tsx
│   │   │   └── deployments/page.tsx
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── auth.ts                 # Auth utilities
│   │   └── prisma.ts               # Prisma client
│   └── middleware.ts               # Auth middleware
├── prisma/
│   └── schema.prisma               # Database schema
├── .env.local                      # Environment variables
└── package.json
```

## 🔐 Authentication Flow

1. **Login:** POST `/api/auth/login` with secret key
2. **Session:** JWT stored in httpOnly cookie
3. **Middleware:** Verifies JWT on all `/dashboard/*` routes
4. **Logout:** POST `/api/auth/logout` clears cookie

## 📡 API Endpoints

### Authentication Required
All `/api/*` endpoints (except `/api/auth/login`) require valid JWT cookie.

### Response Format
```typescript
// Success
{ "data": [...], "success": true }

// Error
{ "error": "message", "status": 401 }
```

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users` | GET | List all users |
| `/api/organizations` | GET | List all organizations |
| `/api/universes` | GET | List all universes |
| `/api/security/events` | GET | Security events |
| `/api/revenue` | GET | Revenue analytics |
| `/api/ai-usage` | GET | AI usage stats |
| `/api/feature-flags` | GET | Feature flags |
| `/api/system-health` | GET | System metrics |
| `/api/audit-logs` | GET | Audit log entries |
| `/api/deployments` | GET | Deployment history |

## 🎨 UI Components

### Pages Include:
- Search bars with real-time filtering
- Status badges (active, suspended, etc.)
- Data tables with sorting
- Stats cards with metrics
- Alert banners for critical events
- Loading spinners
- Empty states

### Color Coding:
- **Green:** Success, active, healthy
- **Red:** Error, suspended, critical
- **Amber:** Warning, pending, degraded
- **Purple:** Primary actions, links
- **Slate:** Neutral, disabled

## 🔧 Common Tasks

### Add New API Endpoint
1. Create `src/app/api/your-endpoint/route.ts`
2. Add JWT verification:
```typescript
const token = cookies().get('admin_session')?.value;
const session = await verifySession(token);
if (!session) return NextResponse.json({error: 'Unauthorized'}, {status: 401});
```
3. Return JSON data

### Add New Dashboard Page
1. Create `src/app/dashboard/your-page/page.tsx`
2. Add to navigation in `src/app/dashboard/layout.tsx`
3. Implement useEffect with fetch call
4. Handle loading/error states

### Connect to Database
1. Ensure PostgreSQL is running
2. Update `.env.local` with database URL
3. Run `npx prisma generate`
4. Replace mock data with Prisma queries:
```typescript
const users = await prisma.user.findMany({...});
```

## 🐛 Troubleshooting

### Issue: Cannot reach database
**Solution:** Database calls are commented out. App works without PostgreSQL.

### Issue: Login fails
**Check:**
- Using correct secret key
- IP is whitelisted (127.0.0.1 auto-allowed in dev)
- Cookies enabled in browser

### Issue: API returns 401
**Check:**
- Still logged in (check cookie in DevTools)
- JWT not expired (8-hour limit)
- Middleware running correctly

### Issue: 404 on dashboard route
**Check:**
- Route name matches navigation
- Page file exists at correct path
- Dev server restarted after file creation

## 📊 Mock Data

All API endpoints currently return mock data. To see different data:

1. Edit the API route file (e.g., `/api/users/route.ts`)
2. Modify the mock array
3. API will immediately return new data (no restart needed in dev)

## 🚢 Deployment Checklist

- [ ] Change `ADMIN_SECRET_KEY` in production
- [ ] Configure IP whitelist for production IPs
- [ ] Connect PostgreSQL database
- [ ] Replace all mock data with database queries
- [ ] Enable HTTPS only
- [ ] Set secure cookie flags
- [ ] Configure CORS if needed
- [ ] Set up logging/monitoring
- [ ] Run `npm run build` to test production build
- [ ] Set `NODE_ENV=production`

## 📞 Support

- **Documentation:** See `API_INTEGRATION_COMPLETE.md`
- **Schema:** See `prisma/schema.prisma`
- **Auth Logic:** See `src/lib/auth.ts`
- **Middleware:** See `src/middleware.ts`

---

**Last Updated:** October 6, 2025  
**Status:** ✅ Fully Functional with Mock Data
