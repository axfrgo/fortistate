# Quick Reference - Super Admin & User Admin Integration

## 🚀 Quick Start

### Super Admin - Create Organization with Enterprise Access

1. Login to Super Admin: `http://localhost:4200`
2. Navigate to **Organizations** page
3. Click **"Create Organization"** button
4. Fill form:
   - **Name**: Your Company Name
   - **Slug**: your-company (URL-friendly)
   - **Plan**: free / pro / enterprise
   - **Org Admin Email**: admin@company.com
   - ✅ **Check "Grant User Admin Panel Access"**
5. Click **"Create Organization"**
6. ✅ Organization created with enterprise badge
7. ✅ Organization synced to User Admin

### User Admin - Access Dashboard

1. User logs in: `http://localhost:4300/auth/login`
2. If org has enterprise access → Dashboard loads ✅
3. If org lacks enterprise → Redirected to `/upgrade` 🔒

---

## 🔑 Environment Variables

Copy these to your `.env` files:

### Super Admin `.env`
```env
USER_ADMIN_URL=http://localhost:4300
SUPER_ADMIN_API_KEY=change-this-to-a-secure-random-string
```

### User Admin `.env`
```env
SUPER_ADMIN_API_KEY=change-this-to-a-secure-random-string
```

⚠️ **Both must use the SAME API key!**

---

## 📡 API Endpoints

### Super Admin

**Create Organization**
```bash
POST http://localhost:4200/api/organizations
Content-Type: application/json
Cookie: admin_session=<token>

{
  "name": "Acme Corp",
  "slug": "acme-corp",
  "plan": "enterprise",
  "orgAdminEmail": "admin@acme.com",
  "grantEnterpriseAccess": true
}
```

**Grant Enterprise Access**
```bash
POST http://localhost:4200/api/organizations/{orgId}/grant-enterprise
Cookie: admin_session=<token>
```

**Revoke Enterprise Access**
```bash
POST http://localhost:4200/api/organizations/{orgId}/revoke-enterprise
Cookie: admin_session=<token>
```

**List Organizations**
```bash
GET http://localhost:4200/api/organizations
Cookie: admin_session=<token>
```

### User Admin

**Sync Organization (from Super Admin)**
```bash
POST http://localhost:4300/api/admin/sync-organization
Content-Type: application/json
X-Super-Admin-Key: <your-api-key>

{
  "orgId": "org_123abc",
  "name": "Acme Corp",
  "slug": "acme-corp",
  "hasEnterpriseAccess": true,
  "subscriptionTier": "enterprise",
  "orgAdminEmail": "admin@acme.com"
}
```

---

## 🗄️ Database Schema

### Super Admin - Organization Model
```prisma
model Organization {
  id                        String    @id @default(uuid())
  name                      String
  slug                      String    @unique
  plan                      String
  status                    String
  hasEnterpriseAccess       Boolean   @default(false)
  orgAdminEmail             String?
  orgAdminId                String?
  enterpriseAccessGrantedAt DateTime?
  enterpriseAccessGrantedBy String?
  // ... other fields
}
```

### User Admin - Organization Model
```prisma
model Organization {
  id                  String  @id @default(cuid())
  name                String
  slug                String  @unique
  plan                String  @default("free")
  status              String  @default("active")
  subscriptionTier    String  @default("free")
  hasEnterpriseAccess Boolean @default(false)
  // ... other fields
}
```

---

## 🔐 Access Control Flow

```
User Login → User Admin
    ↓
Middleware Checks:
    ↓
1. Valid auth token? → If NO → Redirect to /auth/login
    ↓
2. Org exists? → If NO → Redirect to /auth/login
    ↓
3. Org status active? → If NO → Redirect to /auth/suspended
    ↓
4. Has enterprise access? → If NO → Redirect to /upgrade ⭐
    ↓
5. User is org_admin? → If NO → Redirect to /auth/unauthorized
    ↓
✅ Access Granted → Dashboard
```

---

## 🧪 Testing Commands

### Super Admin
```bash
cd packages/super-admin

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev
# Opens at http://localhost:4200
```

### User Admin
```bash
cd packages/user-admin

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev
# Opens at http://localhost:4300
```

### Visual Studio
```bash
cd packages/visual-studio

# Install dependencies
npm install

# Start dev server
npm run dev
# Opens at http://localhost:5173
```

---

## 🐛 Troubleshooting

### Problem: Prisma client errors
**Solution**: 
```bash
npx prisma generate
# Restart VS Code TypeScript server
```

### Problem: "Invalid Super Admin key"
**Solution**: 
- Check both `.env` files have same `SUPER_ADMIN_API_KEY`
- Restart both servers after changing `.env`

### Problem: User Admin redirects to /upgrade
**Solution**: 
- Check organization has `hasEnterpriseAccess: true` in database
- Grant enterprise access from Super Admin
- Verify sync endpoint was called successfully

### Problem: File lock on Prisma generation
**Solution**: 
- Close all Node processes
- Restart VS Code
- Try generation again

---

## 📋 Pre-Flight Checklist

Before testing the integration:

- [ ] Super Admin `.env` configured with `USER_ADMIN_URL`
- [ ] Both `.env` files have matching `SUPER_ADMIN_API_KEY`
- [ ] Super Admin database migrated
- [ ] User Admin database migrated
- [ ] Super Admin server running on port 4200
- [ ] User Admin server running on port 4300
- [ ] Visual Studio server running on port 5173 (optional)

---

## 🎯 Test Scenarios

### Scenario 1: Create Org with Enterprise Access
1. Login to Super Admin
2. Create organization with enterprise checkbox ✓
3. Check organization has enterprise badge in Super Admin
4. Check organization exists in User Admin database
5. Login to User Admin as org admin
6. Verify dashboard access granted ✅

### Scenario 2: Grant Enterprise to Existing Org
1. Find organization without enterprise access
2. Click "Grant User Admin" button
3. Confirm action
4. Verify enterprise badge appears
5. Test User Admin dashboard access ✅

### Scenario 3: Non-Enterprise Org Access
1. Create organization WITHOUT enterprise checkbox
2. Login to User Admin as member of that org
3. Verify redirect to `/upgrade` page 🔒
4. Check upgrade page displays correctly ✅

### Scenario 4: Revoke Enterprise Access
1. Find organization with enterprise access
2. Click "Revoke User Admin" button
3. Confirm action
4. Verify enterprise badge removed
5. Test User Admin dashboard blocked 🔒

---

## 📞 Support

### Files to Check
- `CORRECT_ARCHITECTURE.md` - Architecture overview
- `ARCHITECTURE_CORRECTION_COMPLETE.md` - What was fixed
- `SUPER_ADMIN_INTEGRATION_PROGRESS.md` - Implementation details
- `INTEGRATION_COMPLETE.md` - Complete summary

### Key Components
- **Super Admin Organizations Page**: `packages/super-admin/src/app/dashboard/organizations/page.tsx`
- **User Admin Middleware**: `packages/user-admin/src/middleware.ts`
- **User Admin Upgrade Page**: `packages/user-admin/src/app/upgrade/page.tsx`
- **Sync Endpoint**: `packages/user-admin/src/app/api/admin/sync-organization/route.ts`

---

## ✅ Success Indicators

You know it's working when:
- ✅ Super Admin shows enterprise badge on org cards
- ✅ User Admin middleware allows enterprise orgs
- ✅ User Admin middleware blocks non-enterprise orgs
- ✅ Upgrade page displays for non-enterprise users
- ✅ Organization data syncs between apps
- ✅ Visual Studio works independently with Clerk

---

**Last Updated**: October 10, 2025  
**Status**: ✅ Production Ready  
**Version**: 1.0
