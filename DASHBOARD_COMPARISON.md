# 🎯 FortiState Dashboard Comparison

**Understanding the Two Admin Dashboards**

---

## 📊 Overview

FortiState will have **TWO separate admin dashboards** serving different purposes:

1. **User Admin Dashboard** — For paying customers to manage their organization
2. **Super Admin Dashboard** — For you (internal) to manage the entire platform

---

## 🔄 Side-by-Side Comparison

| Feature | User Admin Dashboard | Super Admin Dashboard |
|---------|---------------------|----------------------|
| **Access** | All paying customers | Only you (secret key) |
| **Scope** | Single organization | Entire platform |
| **Purpose** | Self-service org management | Platform oversight & control |
| **URL** | `admin.fortistate.io` | `super.fortistate.io` (internal) |
| **Auth** | Clerk/OAuth2 (standard login) | Secret token + IP whitelist |
| **Data View** | Own org only | All users, orgs, universes |

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    FORTISTATE PLATFORM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  👤 Customer Alice                                               │
│      ↓ logs in via Clerk                                        │
│  📱 User Admin Dashboard (admin.fortistate.io)                  │
│      - View HER organization only                               │
│      - Manage HER team members                                  │
│      - View HER universes                                       │
│      - Configure HER laws                                       │
│      - View HER billing/usage                                   │
│      - Manage HER settings                                      │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  👤 Customer Bob                                                │
│      ↓ logs in via Clerk                                        │
│  📱 User Admin Dashboard (admin.fortistate.io)                  │
│      - View HIS organization only                               │
│      - Manage HIS team members                                  │
│      - View HIS universes                                       │
│      - Configure HIS laws                                       │
│      - View HIS billing/usage                                   │
│      - Manage HIS settings                                      │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  🔐 YOU (Platform Owner)                                         │
│      ↓ enters secret token                                      │
│  🛡️ Super Admin Dashboard (super.fortistate.io)                 │
│      - View ALL users (Alice, Bob, etc.)                        │
│      - View ALL organizations                                   │
│      - View ALL universes                                       │
│      - Monitor system health                                    │
│      - Track revenue (MRR, ARR)                                 │
│      - Detect abuse                                             │
│      - Control AI usage/costs                                   │
│      - Manage feature flags                                     │
│      - Deploy services                                          │
│      - View audit logs                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Module Comparison

### User Admin Dashboard (For Customers)

#### 1. **Authentication Module**
- Standard login/signup
- OAuth2 (Google, GitHub)
- Email verification
- Password reset
- **Scope:** Individual user accounts

#### 2. **Universes Module**
- List MY universes
- Create new universe
- Configure MY universe settings
- View MY universe metrics
- Start/stop MY universes
- **Scope:** Own organization only

#### 3. **Laws Module**
- View MY law registry
- Create/edit laws for MY universes
- View MY law execution history
- Configure law priorities
- **Scope:** Own organization only

#### 4. **Agents Module**
- View AI agent suggestions for MY universes
- Accept/reject agent recommendations
- View agent activity in MY universes
- Configure agent preferences
- **Scope:** Own organization only

#### 5. **Billing Module**
- View MY current plan
- View MY usage (API calls, storage, compute)
- View MY invoices
- Update payment method
- Upgrade/downgrade MY plan
- **Scope:** Own organization only

#### 6. **Telemetry Module**
- View MY universe metrics
- Monitor MY law violations
- Track MY API usage
- View MY performance charts
- **Scope:** Own organization only

#### 7. **Settings Module**
- Manage MY organization details
- Add/remove team members from MY org
- Configure MY API keys
- Set up MY webhooks
- Notification preferences for MY org
- **Scope:** Own organization only

---

### Super Admin Dashboard (For You)

#### 1. **Global Overview**
- Total users across platform
- Total organizations
- Total universes
- System-wide MRR/ARR
- Platform health
- **Scope:** EVERYTHING

#### 2. **User Management**
- View ALL users
- Search any user by email
- Suspend/unsuspend users
- Impersonate users (for support)
- View any user's activity
- Change user plans
- **Scope:** ALL users

#### 3. **Organization Management**
- View ALL organizations
- Merge organizations
- Adjust org limits
- Apply credits
- View org usage
- **Scope:** ALL organizations

#### 4. **Universe Monitoring**
- View ALL universes (all users)
- Kill any universe
- View any universe's stores/laws
- Flag abusive universes
- Clone universes for debugging
- **Scope:** ALL universes

#### 5. **Security & Abuse Detection**
- Detect platform abuse
- Block abusive users
- Monitor suspicious activity
- Set up abuse rules
- Review flagged accounts
- **Scope:** Platform-wide security

#### 6. **Revenue Analytics**
- Platform-wide MRR/ARR
- Churn rates
- LTV calculations
- Revenue by plan
- Forecasting
- **Scope:** All revenue data

#### 7. **AI Usage & Cost Tracking**
- Total AI costs across platform
- AI usage by user/org
- Cost per agent type
- Optimization opportunities
- Throttle high-cost users
- **Scope:** All AI usage

#### 8. **Feature Flag Management**
- Enable/disable features globally
- Gradual rollouts
- A/B testing
- Target specific users/orgs
- **Scope:** Platform-wide control

#### 9. **System Health Monitoring**
- Monitor all services
- View service status
- Check infrastructure metrics
- View error logs
- Restart services
- Deploy updates
- **Scope:** Entire infrastructure

#### 10. **Audit Logs**
- View ALL administrative actions
- Track compliance (GDPR)
- Security incident reports
- Financial audit trails
- **Scope:** All platform activity

---

## 🔐 Security Comparison

### User Admin Dashboard

**Authentication:**
- Standard username/password
- OAuth2 (Google, GitHub)
- Email verification required
- Session expires after 30 days

**Authorization:**
- Role-based: Owner, Admin, Developer, Viewer
- Organization-scoped permissions
- Can only see own organization data

**Audit:**
- User actions logged (for their org)
- Login history
- API key usage

---

### Super Admin Dashboard

**Authentication:**
- Secret token (environment variable)
- IP whitelist (only your IPs)
- MFA via authenticator app
- Session expires after 8 hours

**Authorization:**
- Full platform access
- No role restrictions
- Can access any user/org data
- Can impersonate users

**Audit:**
- EVERYTHING logged
- All actions tracked
- 7-year retention (compliance)
- Exported to secure storage

---

## 🎯 Use Cases

### User Admin Dashboard Use Cases

**As Alice (Customer):**
1. I want to see my team's universes
2. I want to add Bob to my organization
3. I want to upgrade from Free to Pro plan
4. I want to configure laws for my game universe
5. I want to view my API usage this month
6. I want to update my payment method
7. I want to see telemetry for my e-commerce app

**What Alice CANNOT do:**
- ❌ See other customers' data
- ❌ Change platform-wide settings
- ❌ Access system health metrics
- ❌ Manage feature flags
- ❌ Deploy services

---

### Super Admin Dashboard Use Cases

**As You (Platform Owner):**
1. I want to see all users on the platform
2. I want to suspend a user who's abusing the API
3. I want to see which users are costing the most in AI calls
4. I want to enable a new feature for 10% of users
5. I want to refund a customer's payment
6. I want to see system health across all services
7. I want to deploy a new version of the Inspector
8. I want to view all law violations across all universes
9. I want to track MRR growth over time
10. I want to see audit logs for the last 30 days

**What You CAN do:**
- ✅ See ALL data (users, orgs, universes)
- ✅ Modify ANY user's account
- ✅ Control platform features
- ✅ Deploy services
- ✅ Monitor infrastructure
- ✅ Track revenue
- ✅ Manage security

---

## 📊 Data Access Comparison

### User Admin Dashboard

**Database Queries:**
```sql
-- Alice's dashboard can only query HER data
SELECT * FROM universes WHERE organization_id = 'alice-org-123';
SELECT * FROM users WHERE organization_id = 'alice-org-123';
SELECT * FROM billing WHERE organization_id = 'alice-org-123';
```

**API Endpoints:**
```
GET /api/org/{orgId}/universes     ← orgId = Alice's org only
GET /api/org/{orgId}/users          ← orgId = Alice's org only
GET /api/org/{orgId}/billing        ← orgId = Alice's org only
```

---

### Super Admin Dashboard

**Database Queries:**
```sql
-- Super Admin can query EVERYTHING
SELECT * FROM universes;                    -- ALL universes
SELECT * FROM users;                        -- ALL users
SELECT * FROM organizations;                -- ALL orgs
SELECT * FROM billing;                      -- ALL billing data
SELECT SUM(mrr) FROM organizations;         -- Total MRR
SELECT COUNT(*) FROM users WHERE is_abuser = true;  -- Abuse stats
```

**API Endpoints:**
```
GET /super-admin/users              ← ALL users
GET /super-admin/orgs               ← ALL organizations
GET /super-admin/universes          ← ALL universes
GET /super-admin/metrics/revenue    ← Platform-wide revenue
GET /super-admin/metrics/ai-usage   ← Platform-wide AI usage
POST /super-admin/users/{id}/suspend  ← Suspend any user
POST /super-admin/deployments       ← Deploy services
```

---

## 💡 Analogy

Think of it like **building management** vs. **individual apartments**:

### User Admin Dashboard = Individual Apartment Control
- Alice has a dashboard for her apartment (org)
- She can:
  - See who's in her apartment (team members)
  - Control her thermostat (settings)
  - Pay her rent (billing)
  - See her electricity usage (telemetry)
- She CANNOT:
  - See inside Bob's apartment
  - Control building-wide systems
  - Access the boiler room
  - View other residents' bills

### Super Admin Dashboard = Building Superintendent Control
- You (super admin) have master access to the building
- You can:
  - Enter any apartment (impersonate users)
  - See all residents' bills (revenue)
  - Control HVAC systems (feature flags)
  - Monitor water/electricity (system health)
  - Evict tenants (suspend users)
  - View security cameras (audit logs)
  - Repair building systems (deployments)

---

## 🚀 Implementation Priority

### Phase 1: Build User Admin Dashboard First
**Why?** Customers need this to use the platform

**Timeline:** 15 days (Week 1-3)

**Modules:**
1. Auth (login/signup)
2. Universes (list/create/manage)
3. Laws (configure)
4. Agents (view suggestions)
5. Billing (plans/usage)
6. Telemetry (metrics)
7. Settings (org config)

---

### Phase 2: Build Super Admin Dashboard Second
**Why?** You need this for platform management

**Timeline:** 8 weeks (after user admin)

**Modules:**
1. Global Overview
2. User/Org Management
3. Universe Monitoring
4. Security & Abuse
5. Revenue Analytics
6. AI Usage Tracking
7. Feature Flags
8. System Health
9. Audit Logs
10. Deployment Control

---

## 📝 File Structure

```
packages/
├── admin-dashboard/          ← For customers (public)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   └── (dashboard)/
│   │   │       ├── universes/
│   │   │       ├── laws/
│   │   │       ├── agents/
│   │   │       ├── billing/
│   │   │       ├── telemetry/
│   │   │       └── settings/
│   │   └── components/
│   └── package.json
│
└── super-admin/              ← For you (internal)
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/
    │   │   └── (dashboard)/
    │   │       ├── overview/
    │   │       ├── users/
    │   │       ├── organizations/
    │   │       ├── universes/
    │   │       ├── security/
    │   │       ├── revenue/
    │   │       ├── ai-usage/
    │   │       ├── feature-flags/
    │   │       ├── health/
    │   │       ├── audit/
    │   │       └── deployments/
    │   └── components/
    └── package.json
```

---

## 🎯 Summary

### User Admin Dashboard
- **Who:** Paying customers (Alice, Bob, etc.)
- **Access:** Standard login
- **Scope:** Own organization only
- **Purpose:** Self-service management
- **URL:** `admin.fortistate.io`
- **Priority:** HIGH (customers need this)

### Super Admin Dashboard
- **Who:** You (platform owner)
- **Access:** Secret token + IP whitelist
- **Scope:** Entire platform
- **Purpose:** Platform oversight & control
- **URL:** `super.fortistate.io` (internal)
- **Priority:** HIGH (you need this)

### Key Difference
**User Admin = Single Organization Control**  
**Super Admin = Global Platform Control**

---

**Both dashboards are CRITICAL for a production SaaS platform!**

---

**Related Documents:**
- `IMPLEMENTATION_PLAN.md` — User Admin Dashboard details
- `SUPER_ADMIN_SPEC.md` — Super Admin Dashboard spec
- `FORTISTATE_AUDIT_REPORT.md` — Full platform audit
