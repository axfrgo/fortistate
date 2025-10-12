# Fortistate Multi-App Integration Plan

## Architecture Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN (Port 4200)                        │
│  Role: Platform-wide god-mode control                            │
│  ─────────────────────────────────────────────────────────────   │
│  Features:                                                        │
│  • Monitor ALL organizations                                     │
│  • View system health metrics                                    │
│  • Impersonate org admins                                        │
│  • Platform-wide billing & analytics                             │
│  • Suspend/activate organizations                                │
│  • View all user activity across platform                        │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                   Controls & Monitors
                            │
                            ↓
┌───────────────────────────────────────────────────────────────────┐
│                    USER ADMIN (Port 4300)                         │
│  Role: Organization-scoped team management                        │
│  ─────────────────────────────────────────────────────────────   │
│  Features:                                                        │
│  • Manage team members within organization                       │
│  • Invite users to Visual Studio                                 │
│  • Assign roles (viewer/editor/admin)                            │
│  • Monitor team activity in Visual Studio                        │
│  • Org-specific billing & analytics                              │
│  • Control Visual Studio access tokens                           │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                    Manages Access To
                            │
                            ↓
┌───────────────────────────────────────────────────────────────────┐
│                   VISUAL STUDIO (Port 5173)                       │
│  Role: User-facing state management IDE                          │
│  ─────────────────────────────────────────────────────────────   │
│  Features:                                                        │
│  • Canvas & node-based state design                              │
│  • Execution engine                                              │
│  • Real-time collaboration                                       │
│  • Project management                                            │
│  • User session tracking                                         │
│  • Validates access via User Admin                               │
└───────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

### Authentication Flow

```
┌─────────────┐
│ Super Admin │ (platform_admin JWT)
└──────┬──────┘
       │ 1. Login with platform credentials
       ↓
┌──────────────────────┐
│ Platform Auth System │
└──────┬───────────────┘
       │ 2. Issues JWT with role: platform_admin
       ↓
┌─────────────┐
│ Super Admin │ → Can impersonate any org
└──────┬──────┘
       │ 3. Select organization to manage
       ↓
┌──────────────────────┐
│  User Admin (as org) │ (org_admin JWT with org_id)
└──────┬───────────────┘
       │ 4. Manage users, create Visual Studio tokens
       ↓
┌─────────────────┐
│ Visual Studio   │ (user JWT with org_id + user_id)
└─────────────────┘
```

### Token Structure

#### Platform Admin Token (Super Admin)
```json
{
  "sub": "admin_user_id",
  "role": "platform_admin",
  "permissions": ["*"],
  "exp": 1234567890
}
```

#### Org Admin Token (User Admin)
```json
{
  "sub": "org_admin_user_id",
  "role": "org_admin",
  "org_id": "org_123",
  "permissions": ["manage_users", "view_analytics", "manage_billing"],
  "exp": 1234567890
}
```

#### User Token (Visual Studio)
```json
{
  "sub": "user_456",
  "role": "editor",
  "org_id": "org_123",
  "permissions": ["edit_projects", "execute", "collaborate"],
  "issued_by": "org_admin_user_id",
  "exp": 1234567890
}
```

## Database Schema

### Shared Tables

```sql
-- Platform admins (Super Admin users)
CREATE TABLE platform_admins (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Organizations (managed in Super Admin, used by User Admin)
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  status ENUM('active', 'suspended', 'trial') DEFAULT 'trial',
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES platform_admins(id)
);

-- Organization admins (User Admin users)
CREATE TABLE organization_users (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role ENUM('owner', 'admin', 'member') DEFAULT 'member',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(org_id, email)
);

-- Visual Studio users (managed by User Admin)
CREATE TABLE visual_studio_users (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  org_user_id UUID REFERENCES organization_users(id) ON DELETE CASCADE,
  access_token VARCHAR(500), -- JWT for Visual Studio access
  role ENUM('viewer', 'editor', 'admin') DEFAULT 'editor',
  last_active TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES organization_users(id)
);

-- Visual Studio sessions (active user sessions)
CREATE TABLE visual_studio_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES visual_studio_users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id),
  project_id UUID,
  started_at TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- Unified audit log (all three apps)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  app_source ENUM('super_admin', 'user_admin', 'visual_studio'),
  actor_id UUID, -- Could be platform_admin, org_user, or vs_user
  actor_type ENUM('platform_admin', 'org_admin', 'user'),
  org_id UUID REFERENCES organizations(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Super Admin API (Port 4200)

```
GET  /api/organizations              - List all organizations
POST /api/organizations              - Create new organization
GET  /api/organizations/:id          - Get org details
PUT  /api/organizations/:id/suspend  - Suspend organization
GET  /api/analytics/platform         - Platform-wide analytics
POST /api/impersonate/:orgId         - Generate org admin token
GET  /api/audit                      - View all audit logs
GET  /api/system/health              - System health metrics
```

### User Admin API (Port 4300)

```
GET  /api/team                       - List org team members
POST /api/team/invite                - Invite team member
PUT  /api/team/:id/role              - Update member role
DELETE /api/team/:id                 - Remove member

POST /api/visual-studio/grant-access - Create VS user & token
DELETE /api/visual-studio/revoke/:id - Revoke VS access
GET  /api/visual-studio/sessions     - Active VS sessions
GET  /api/visual-studio/activity     - VS user activity logs

GET  /api/analytics                  - Org-specific analytics
GET  /api/settings                   - Org settings
PUT  /api/settings                   - Update org settings
```

### Visual Studio API (Port 5173)

```
POST /api/auth/validate              - Validate token with User Admin
GET  /api/session                    - Get current session info
POST /api/session/heartbeat          - Update last activity
GET  /api/projects                   - User's projects
POST /api/projects                   - Create project
POST /api/execute                    - Execute ontogenesis flow
```

## Inter-App Communication

### REST API Calls

```typescript
// Super Admin → User Admin
async function getSuperAdminOrgUsers(orgId: string, platformToken: string) {
  const response = await fetch(`http://localhost:4300/api/admin/org/${orgId}/users`, {
    headers: { 'Authorization': `Bearer ${platformToken}` }
  });
  return response.json();
}

// User Admin → Visual Studio (token validation)
async function validateVisualStudioToken(token: string) {
  const response = await fetch(`http://localhost:4300/api/visual-studio/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  return response.json(); // { valid: boolean, user: {...}, permissions: [...] }
}

// Visual Studio → User Admin (activity reporting)
async function reportActivity(userToken: string, activity: Activity) {
  await fetch(`http://localhost:4300/api/visual-studio/activity`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(activity)
  });
}
```

### WebSocket Events (Real-time)

```typescript
// Event bus for cross-app communication
interface AppEvent {
  type: string;
  source: 'super_admin' | 'user_admin' | 'visual_studio';
  orgId?: string;
  userId?: string;
  data: any;
  timestamp: number;
}

// Super Admin broadcasts
{
  type: 'org:suspended',
  source: 'super_admin',
  orgId: 'org_123',
  data: { reason: 'Payment overdue' }
}

// User Admin broadcasts
{
  type: 'user:access_granted',
  source: 'user_admin',
  orgId: 'org_123',
  userId: 'user_456',
  data: { role: 'editor' }
}

// Visual Studio broadcasts
{
  type: 'session:started',
  source: 'visual_studio',
  orgId: 'org_123',
  userId: 'user_456',
  data: { projectId: 'proj_789' }
}
```

## Fortistate Inspector Integration

### Store Namespacing

```typescript
// Super Admin stores (monitors everything)
import { createStore } from 'fortistate';

export const platformMetricsStore = createStore('super:platform_metrics', {
  value: {
    totalOrgs: 0,
    activeUsers: 0,
    systemHealth: 'operational'
  }
});

// User Admin stores (org-scoped)
export const teamStore = createStore('org:123:team', {
  value: {
    members: [],
    invitations: []
  }
});

// Visual Studio stores (user-scoped)
export const canvasStore = createStore('user:456:canvas', {
  value: {
    nodes: [],
    edges: []
  }
});
```

### Inspector Configuration

```bash
# Start unified inspector that all apps connect to
npm run inspect -- --port 4001

# Super Admin connects with platform_admin role
# User Admin connects with org_admin role (sees org:* stores)
# Visual Studio connects with user role (sees user:* stores)
```

## Navigation Flow

### Super Admin → User Admin

```typescript
// In Super Admin dashboard
function viewOrganization(orgId: string) {
  // Generate scoped org admin token
  const orgToken = await generateOrgToken(orgId, platformToken);
  
  // Open User Admin in new tab with token
  const url = `http://localhost:4300/dashboard?token=${orgToken}&org=${orgId}`;
  window.open(url, '_blank');
}
```

### User Admin → Visual Studio

```typescript
// In User Admin team page
function launchVisualStudio(userId: string) {
  // Get or create Visual Studio access token
  const vsToken = await grantVisualStudioAccess(userId, orgId);
  
  // Open Visual Studio with token
  const url = `http://localhost:5173?token=${vsToken}`;
  window.open(url, '_blank');
}
```

## Security Considerations

1. **Token Expiration**: Short-lived tokens (1-24 hours) with refresh mechanism
2. **CORS**: Strict origin whitelisting between apps
3. **Rate Limiting**: API throttling to prevent abuse
4. **Audit Logging**: All actions logged with actor, timestamp, IP
5. **Role Hierarchy**: platform_admin > org_admin > user
6. **Token Revocation**: Real-time token invalidation via event bus
7. **HTTPS**: TLS required in production
8. **Secret Management**: Environment variables for JWT secrets

## Implementation Phases

### Phase 1: Foundation (Current Sprint)
- [x] User Admin uses Fortistate
- [ ] Shared database schema
- [ ] JWT token structure
- [ ] Basic API endpoints

### Phase 2: Super Admin Integration
- [ ] Super Admin Fortistate migration
- [ ] Organization management UI
- [ ] Impersonation flow
- [ ] Platform analytics

### Phase 3: Visual Studio Integration
- [ ] Token validation with User Admin
- [ ] Session tracking
- [ ] Activity reporting
- [ ] Access control

### Phase 4: Real-time Features
- [ ] WebSocket event bus
- [ ] Shared Fortistate inspector
- [ ] Live activity monitoring
- [ ] Cross-app notifications

### Phase 5: Production Hardening
- [ ] Comprehensive audit logging
- [ ] Security testing
- [ ] Performance optimization
- [ ] Documentation

## Next Steps

1. **Immediate**: Create shared authentication package
2. **This week**: Implement User Admin → Visual Studio token validation
3. **Next week**: Super Admin organization management
4. **Month**: Full integration with real-time events

---

**Status**: Planning Phase  
**Last Updated**: October 9, 2025  
**Owner**: Alex (Platform Admin)
