# CORRECT ARCHITECTURE - Three App System

## Overview
This document clarifies the CORRECT architecture for the Fortistate three-app system after fixing the misunderstanding.

## The Three Apps and Their Purposes

### 1. Visual Studio (The Main Product) - Port 5173
**Purpose**: The actual IDE/state management tool that ALL users use

**Who Uses It**:
- ✅ Solo developers (free tier)
- ✅ Team members (paid tier)
- ✅ Enterprise users (enterprise tier)
- **EVERYONE** can use Visual Studio

**Authentication**:
- Uses **Clerk** (simple, standard authentication)
- No special tokens or complex auth needed
- Just regular user sign-in

**Features**:
- Canvas for building state machines
- Code generation
- Collaboration features
- Marketplace
- Billing integration
- **This is the product we're selling**

**Key Point**: Visual Studio is NOT connected to User Admin or Super Admin for authentication. It's a standalone product.

---

### 2. User Admin Panel (Enterprise Feature) - Port 4300
**Purpose**: Allows enterprise organizations to manage their teams

**Who Uses It**:
- ✅ Organization administrators (org_admin role)
- ✅ ONLY orgs that Super Admin grants access to
- ❌ NOT for solo developers
- ❌ NOT for regular team users

**Authentication**:
- Uses **@fortistate/auth** with org_admin role
- Must be granted access by Super Admin
- Checks if logged-in user's org has enterprise access

**Features**:
- Manage team members within the organization
- Assign roles and permissions
- View organization settings
- Manage billing/subscription
- View organization usage/analytics

**Key Point**: User Admin is a **premium enterprise feature**. Organizations pay for access to this panel to manage their teams.

---

### 3. Super Admin Panel (Platform Control) - Port 4200
**Purpose**: Platform-level control for Fortistate owners/administrators

**Who Uses It**:
- ✅ Platform administrators only (platform_admin role)
- ❌ NOT for organization admins
- ❌ NOT for regular users

**Authentication**:
- Uses **@fortistate/auth** with platform_admin role
- Highest level of access
- Can impersonate any organization

**Features**:
- Create/manage organizations
- Grant User Admin access to organizations
- Assign org_admin roles
- Platform-wide analytics
- System health monitoring
- Global audit logs

**Key Point**: Super Admin controls which organizations get access to User Admin panel.

---

## The Correct Connection Flow

```
┌─────────────────┐
│  Super Admin    │  (Platform Control)
│   Port 4200     │
└────────┬────────┘
         │
         │ Controls/Grants Access
         ▼
┌─────────────────┐
│  User Admin     │  (Enterprise Feature)
│   Port 4300     │  - Manages teams
└─────────────────┘  - Org settings
                     - Team permissions

         ⚠️ NO CONNECTION ⚠️
                     
┌─────────────────┐
│ Visual Studio   │  (The Product)
│   Port 5173     │  - Everyone uses this
└─────────────────┘  - Simple Clerk auth
```

---

## What I Built Wrong ❌

### Incorrect Implementation (REVERTED)
1. ❌ Made Visual Studio require tokens from User Admin
2. ❌ Created "VS Access" management in User Admin
3. ❌ Made Visual Studio only usable by team members
4. ❌ Locked solo developers out
5. ❌ Created complex token-based auth for VS
6. ❌ Built VSAuthContext and VSLogin components
7. ❌ Made User Admin generate tokens for VS access

**Why This Was Wrong**:
- Visual Studio is the product - it should be accessible to everyone
- User Admin is for managing teams, not for controlling product access
- Solo developers need Visual Studio without joining an organization
- This narrowed the product to teams-only, which defeats the purpose

---

## What I Should Have Built ✅

### Correct Implementation (TO BUILD)

#### 1. Super Admin Features
- Organization management UI (create/edit/delete orgs)
- Grant enterprise access (gives org User Admin panel access)
- Assign org_admin role to organization owners
- View all organizations and their status
- Platform-wide settings and monitoring

#### 2. User Admin Access Control
- Check if logged-in user's org has enterprise access
- If not enterprise: show upgrade page or redirect
- If enterprise: show team management features
- Validate org_admin role on all endpoints

#### 3. User Admin Team Management
- Manage team members within the organization
- Assign roles (org_member, team_lead, etc.)
- Team permissions and access control
- Organization settings and billing
- **NOT** related to Visual Studio access at all

---

## User Journeys

### Solo Developer Journey
1. Signs up for Fortistate
2. Uses **Clerk** to authenticate
3. Opens **Visual Studio** (port 5173)
4. Starts building with Fortistate
5. **No need for User Admin or team features**

### Enterprise Organization Journey
1. Company signs up for Fortistate Enterprise
2. **Super Admin** creates their organization
3. **Super Admin** grants User Admin access
4. **Super Admin** assigns org_admin role to company admin
5. Company admin logs into **User Admin** (port 4300)
6. Company admin invites team members
7. Company admin manages roles and permissions
8. All team members use **Visual Studio** (port 5173) with their own Clerk accounts
9. **Visual Studio works the same for everyone** - enterprise features are in User Admin

---

## Authentication Flow

### Visual Studio Authentication (Simple)
```
User → Clerk Sign-In → Visual Studio
```
- No tokens from User Admin
- No org verification needed
- Just regular authentication
- Works for solo devs and teams

### User Admin Authentication (Enterprise)
```
User → Logs In
     → Check org has enterprise access (from Super Admin)
     → If yes: show User Admin panel
     → If no: show upgrade page
```

### Super Admin Authentication (Platform)
```
Platform Admin → @fortistate/auth JWT
              → platform_admin role required
              → Full platform access
```

---

## Database/API Communication

### Super Admin → User Admin
**Purpose**: Sync organization data

**Flow**:
1. Super Admin creates organization
2. API call to User Admin: `POST /api/organizations`
3. User Admin stores org data
4. Super Admin grants enterprise access
5. API call: `PATCH /api/organizations/:id { hasEnterpriseAccess: true }`
6. User Admin updates org record

**Shared Data**:
- Organization ID
- Organization name
- Enterprise access status
- Subscription tier
- org_admin assignments

### User Admin ← → Visual Studio
**Connection**: NONE

- Visual Studio operates independently
- User Admin doesn't control VS access
- No data syncing needed
- Completely separate concerns

---

## Role Hierarchy (Correct)

```
platform_admin (Level 4) - Super Admin panel only
    ↓
org_admin (Level 3) - User Admin panel access
    ↓
org_member (Level 2) - Team member (managed in User Admin)
    ↓
(No vs_user role - this was wrong)
```

**vs_user role should be REMOVED** - it doesn't make sense in the correct architecture.

---

## Files to Revert/Remove

### Visual Studio (REVERTED ✅)
- ✅ Removed `src/contexts/VSAuthContext.tsx`
- ✅ Removed `src/components/VSLogin.tsx`
- ✅ Restored Clerk authentication in `main.tsx`
- ✅ Restored `UserButton` in `App.tsx`
- ✅ Removed all token validation logic

### User Admin (TO REMOVE ⏳)
- ⏳ Remove `src/app/dashboard/visual-studio/page.tsx`
- ⏳ Remove `src/stores/vsAccessStore.ts`
- ⏳ Remove `src/app/api/vs/*` endpoints
- ⏳ Remove `VisualStudioAccess` and `VisualStudioSession` from Prisma schema
- ⏳ Remove VS Access navigation item

---

## Files to Build

### Super Admin
- `src/app/dashboard/organizations/page.tsx` - Org management UI
- `src/app/api/organizations/route.ts` - CRUD endpoints
- `src/app/api/organizations/[id]/grant-enterprise/route.ts` - Grant enterprise access
- `src/stores/organizationsStore.ts` - Org state management

### User Admin
- `src/middleware.ts` - Check enterprise access on all routes
- `src/app/dashboard/upgrade/page.tsx` - Upgrade prompt for non-enterprise
- Update existing team management to check org permissions

---

## Summary

### The Three Apps Do NOT Connect Like This ❌:
```
Super Admin → User Admin → Visual Studio
```

### The Three Apps Connect Like This ✅:
```
Super Admin → User Admin (grants enterprise access)

Visual Studio (standalone, separate, for everyone)
```

### Key Takeaways:
1. **Visual Studio** = The product everyone uses (Clerk auth)
2. **User Admin** = Enterprise feature for team management
3. **Super Admin** = Platform control for Fortistate owners
4. Visual Studio and User Admin **are NOT connected**
5. Super Admin controls which orgs get User Admin access
6. Solo developers use Visual Studio without teams
7. Enterprise orgs use Visual Studio + User Admin
8. User Admin is for managing teams, NOT for controlling VS access

---

## Next Steps (In Order)

1. ✅ **DONE**: Revert Visual Studio authentication changes
2. ⏳ Remove VS Access features from User Admin
3. ⏳ Build Super Admin organization management
4. ⏳ Add enterprise access check to User Admin
5. ⏳ Build API communication: Super Admin → User Admin
6. ⏳ Update all documentation

This is the CORRECT architecture that maintains the value proposition: a state management tool for solo developers AND teams.
