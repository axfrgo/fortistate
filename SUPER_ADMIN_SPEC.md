# 🔐 FortiState Super Admin Dashboard — Technical Specification

**Version:** 1.0.0  
**Status:** Design Phase  
**Access Level:** Internal Only (You)  
**Security:** Secret auth key required  
**Purpose:** Global management and monitoring of entire FortiState ecosystem

---

## 🎯 Overview

The Super Admin Dashboard is an **internal-only control center** for managing all aspects of the FortiState platform. Unlike the user-facing Admin Dashboard (which manages individual organizations), this dashboard provides:

- **Global visibility** across all users, organizations, and universes
- **System health monitoring** for all services
- **Revenue and usage analytics** across the platform
- **Security and abuse detection** tools
- **Feature flag management** for gradual rollouts
- **Deployment control** for all services
- **AI usage tracking** and cost monitoring
- **Emergency controls** for critical situations

---

## 🏗️ Architecture

### Tech Stack

- **Framework:** Next.js 14 (App Router) with TypeScript
- **UI Library:** Tailwind CSS + shadcn/ui
- **Auth:** Secret token-based (environment variable)
- **Database:** PostgreSQL for analytics storage
- **Real-time:** WebSocket for live monitoring
- **Charts:** Recharts + D3.js for advanced visualizations
- **Deployment:** Docker + PM2 (internal server only)

### Security Model

```typescript
// Environment-based authentication
SUPER_ADMIN_SECRET_KEY=<your-secret-key-here>

// Middleware protection
export async function middleware(request: NextRequest) {
  const token = request.cookies.get('super-admin-token')?.value;
  
  if (token !== process.env.SUPER_ADMIN_SECRET_KEY) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}
```

**Access Control:**
- Only accessible from specific IP addresses (whitelist)
- Secret token required (no public login page)
- Session expires after 8 hours
- MFA via authenticator app
- All actions logged to secure audit trail

---

## 📊 Module Breakdown

### 1. 🌐 Global Overview Dashboard

**Purpose:** High-level view of entire FortiState ecosystem

**Metrics Cards:**
```typescript
interface GlobalMetrics {
  // Users & Organizations
  totalUsers: number;
  totalOrganizations: number;
  activeUsers24h: number;
  activeUsers7d: number;
  newUsersToday: number;
  churned7d: number;
  
  // Universes
  totalUniverses: number;
  activeUniverses: number;
  universesCreated24h: number;
  averageUniverseSize: number;
  
  // Revenue
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  revenueToday: number;
  revenueThisMonth: number;
  
  // System Health
  systemUptime: number; // percentage
  apiLatencyP95: number; // milliseconds
  errorRate: number; // percentage
  activeServices: number;
  
  // AI Usage
  aiCallsToday: number;
  aiCostToday: number;
  custodianCalls: number;
  diplomatCalls: number;
  storytellerCalls: number;
}
```

**Components:**
- **Metrics Grid** — 4x4 grid of key metrics with sparklines
- **System Status Map** — Visual map of all services (green/yellow/red)
- **Real-time Event Feed** — Live stream of significant events
- **Quick Actions** — Emergency controls (kill switch, throttle, etc.)

**Features:**
- [ ] Real-time metrics updating every 5 seconds
- [ ] Historical data comparison (today vs. yesterday, this week vs. last week)
- [ ] Anomaly detection with alerts
- [ ] Exportable reports (PDF, CSV)

---

### 2. 👥 User & Organization Management

**Purpose:** Manage all users and organizations across the platform

**User Management:**
```typescript
interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  organizationId: string;
  role: 'owner' | 'admin' | 'developer' | 'viewer';
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
  lastActive: Date;
  
  // Usage
  universesCreated: number;
  apiCallsThisMonth: number;
  storageUsedMB: number;
  
  // Billing
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'trialing';
  lifetimeRevenue: number;
  
  // Flags
  isSuspended: boolean;
  isAbuser: boolean;
  notes: string;
}
```

**Features:**
- [ ] **User Search** — Search by email, name, org, plan
- [ ] **User Detail View** — Full user profile with activity history
- [ ] **Impersonation Mode** — Login as any user (for support)
- [ ] **Usage Analytics** — Per-user usage charts
- [ ] **Actions:**
  - [ ] Suspend user (disable access)
  - [ ] Change plan (upgrade/downgrade)
  - [ ] Refund payment
  - [ ] Reset password
  - [ ] Delete account (GDPR compliance)
  - [ ] Add internal notes

**Organization Management:**
```typescript
interface OrganizationRecord {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  members: number;
  
  // Usage
  universesTotal: number;
  apiCallsThisMonth: number;
  storageUsedMB: number;
  
  // Billing
  subscriptionStatus: 'active' | 'past_due' | 'canceled';
  mrr: number;
  lifetimeRevenue: number;
  
  // Metadata
  createdAt: Date;
  industry?: string;
  companySize?: string;
  useCase?: string;
}
```

**Features:**
- [ ] **Org Search & Filtering**
- [ ] **Org Detail View** — Members, usage, billing
- [ ] **Actions:**
  - [ ] Change plan
  - [ ] Adjust limits
  - [ ] Apply credits
  - [ ] Merge organizations
  - [ ] Delete organization

---

### 3. 🌌 Universe Monitoring

**Purpose:** Global view of all universes across all users

**Features:**

**Universe Table:**
- [ ] List all universes (paginated, 100 per page)
- [ ] Filters: by user, org, status, creation date
- [ ] Sort by: size, activity, resource usage

**Universe Detail:**
```typescript
interface UniverseDetail {
  id: string;
  name: string;
  ownerId: string;
  ownerEmail: string;
  organizationId: string;
  
  // Structure
  storeCount: number;
  lawCount: number;
  entityCount: number;
  
  // Status
  status: 'running' | 'stopped' | 'error';
  uptime: number;
  
  // Performance
  averageUpdateTime: number;
  memoryUsageMB: number;
  cpuUsage: number;
  
  // Activity
  eventsLast24h: number;
  lastActivity: Date;
  
  // Flags
  isStuck: boolean;
  hasErrors: boolean;
  isAbusive: boolean;
}
```

**Actions:**
- [ ] View universe in inspector (direct link)
- [ ] Kill universe (emergency stop)
- [ ] Restart universe
- [ ] Export universe state (JSON)
- [ ] Clone universe (for debugging)
- [ ] Flag as abusive

**Analytics:**
- [ ] Universe size distribution (histogram)
- [ ] Universe activity heatmap (by hour/day)
- [ ] Top 10 largest universes
- [ ] Top 10 most active universes

---

### 4. 🛡️ Security & Abuse Detection

**Purpose:** Detect and prevent platform abuse

**Abuse Detection Rules:**
```typescript
interface AbuseRule {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // Detection logic
  metric: 'api_calls' | 'storage' | 'universes' | 'ai_calls';
  threshold: number;
  window: '1h' | '24h' | '7d' | '30d';
  
  // Actions
  autoBlock: boolean;
  autoNotify: boolean;
  autoThrottle: boolean;
}
```

**Built-in Rules:**
1. **API Abuse** — >10,000 API calls in 1 hour
2. **Storage Abuse** — >10GB storage without payment
3. **Universe Spam** — >1,000 universes created in 24h
4. **AI Abuse** — >1,000 AI calls in 1 hour
5. **Scraping Detection** — Repeated identical requests
6. **Account Sharing** — Multiple IPs from same account
7. **Failed Auth Attempts** — >10 failed logins in 1 hour

**Features:**
- [ ] **Abuse Alert Dashboard** — Real-time alerts
- [ ] **User Abuse Score** — 0-100 score per user
- [ ] **Automatic Actions:**
  - [ ] Rate limiting (throttle to 50% speed)
  - [ ] Temporary suspension (24h timeout)
  - [ ] Email warning to user
  - [ ] Require payment method
- [ ] **Manual Review Queue** — Flagged accounts for review
- [ ] **Whitelist/Blacklist Management**

**Security Monitoring:**
- [ ] Failed authentication attempts (chart)
- [ ] Suspicious IP addresses (list)
- [ ] API key usage patterns
- [ ] Data export requests (GDPR compliance)
- [ ] Account deletions (track reasons)

---

### 5. 💰 Revenue Analytics

**Purpose:** Track revenue, subscriptions, and financial health

**Revenue Dashboard:**
```typescript
interface RevenueMetrics {
  // MRR (Monthly Recurring Revenue)
  currentMRR: number;
  mrrGrowthRate: number; // percentage
  mrrByPlan: {
    free: number;
    pro: number;
    enterprise: number;
  };
  
  // ARR (Annual Recurring Revenue)
  currentARR: number;
  projectedARR: number;
  
  // Churn
  churnRateMRR: number; // percentage
  churnRateUsers: number; // percentage
  churned30d: number; // count
  
  // Lifetime Value
  averageLTV: number;
  averageLifetimeMonths: number;
  
  // Conversion
  freeToProRate: number; // percentage
  trialToPaidRate: number; // percentage
}
```

**Features:**
- [ ] **Revenue Charts:**
  - [ ] MRR over time (line chart)
  - [ ] Revenue by plan (stacked area)
  - [ ] Churn rate (line chart)
  - [ ] Cohort retention (heatmap)
- [ ] **Subscription Analytics:**
  - [ ] New subscriptions today/week/month
  - [ ] Upgrades vs. downgrades
  - [ ] Cancellation reasons (categorized)
  - [ ] Payment failures (list)
- [ ] **Forecasting:**
  - [ ] Projected MRR (next 3/6/12 months)
  - [ ] Churn forecast
  - [ ] LTV projections
- [ ] **Actions:**
  - [ ] Manual refunds
  - [ ] Apply credits
  - [ ] Adjust pricing (experimental)

**Stripe Integration:**
- [ ] Live Stripe dashboard embed
- [ ] Payment method analytics
- [ ] Dispute tracking
- [ ] Tax collection summary

---

### 6. 🤖 AI Usage & Cost Tracking

**Purpose:** Monitor AI agent usage and associated costs

**AI Analytics:**
```typescript
interface AIUsageMetrics {
  // Calls
  totalCallsToday: number;
  totalCallsThisMonth: number;
  callsByAgent: {
    custodian: number;
    diplomat: number;
    storyteller: number;
  };
  
  // Costs
  totalCostToday: number;
  totalCostThisMonth: number;
  costPerCall: number;
  costByModel: {
    'gpt-4': number;
    'gpt-3.5-turbo': number;
    'claude-3': number;
  };
  
  // Performance
  averageLatency: number;
  errorRate: number;
  cacheHitRate: number;
  
  // Users
  topUsersByAICalls: Array<{
    userId: string;
    email: string;
    calls: number;
    cost: number;
  }>;
}
```

**Features:**
- [ ] **Cost Dashboard:**
  - [ ] Daily cost trend (line chart)
  - [ ] Cost by agent (pie chart)
  - [ ] Cost by model (bar chart)
  - [ ] Cost per user (table)
- [ ] **Usage Monitoring:**
  - [ ] Calls per hour (heatmap)
  - [ ] Peak usage times
  - [ ] Agent preference distribution
- [ ] **Optimization:**
  - [ ] Cache hit rate tracking
  - [ ] Prompt token usage
  - [ ] Response quality metrics
  - [ ] A/B test results (different models)
- [ ] **Alerts:**
  - [ ] Cost spike detection (>$500/day)
  - [ ] High-cost users (>$100/month)
  - [ ] Error rate spike (>5%)

**Actions:**
- [ ] Throttle AI calls for specific users
- [ ] Switch models (GPT-4 → GPT-3.5 for cost savings)
- [ ] Adjust cache TTL
- [ ] Block abusive AI usage

---

### 7. 🎛️ Feature Flag Management

**Purpose:** Control feature rollouts and experimental features

**Feature Flags:**
```typescript
interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  status: 'disabled' | 'dev' | 'beta' | 'enabled';
  
  // Targeting
  rolloutPercentage: number; // 0-100
  targetOrgs: string[]; // specific org IDs
  targetPlans: Array<'free' | 'pro' | 'enterprise'>;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Metrics
  usersExposed: number;
  conversionRate?: number;
}
```

**Examples:**
1. `quantum-substrate` — Enable quantum state features
2. `ai-storyteller-v2` — New storyteller model
3. `advanced-analytics` — Enhanced telemetry dashboard
4. `universe-templates` — Pre-built universe templates
5. `collaboration-v2` — Real-time co-editing

**Features:**
- [ ] **Flag Dashboard** — List all flags with status
- [ ] **Create/Edit Flags:**
  - [ ] Set rollout percentage (gradual rollout)
  - [ ] Target specific organizations
  - [ ] Target specific plans
  - [ ] A/B test setup
- [ ] **Analytics:**
  - [ ] Flag usage metrics
  - [ ] Conversion rate (if applicable)
  - [ ] Error rate with flag enabled
- [ ] **Actions:**
  - [ ] Enable for all users
  - [ ] Disable immediately (kill switch)
  - [ ] Reset (clear all overrides)

---

### 8. 🏥 System Health Monitoring

**Purpose:** Monitor infrastructure and service health

**Service Status:**
```typescript
interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number; // percentage
  latency: {
    p50: number;
    p95: number;
    p99: number;
  };
  
  // Resources
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  diskUsage: number; // percentage
  
  // Errors
  errorRate: number; // percentage
  recentErrors: Array<{
    timestamp: Date;
    message: string;
    stackTrace: string;
  }>;
  
  // Metadata
  version: string;
  deployedAt: Date;
  host: string;
}
```

**Monitored Services:**
1. **Inspector Server** — Real-time debugging
2. **Visual Studio** — Canvas interface
3. **AI Gateway** — AI agent API
4. **User Admin Dashboard** — User-facing admin
5. **Super Admin Dashboard** — This dashboard
6. **Core API** — FortiState core package API
7. **Database** — PostgreSQL
8. **Redis Cache** — Caching layer
9. **WebSocket Server** — Real-time connections

**Features:**
- [ ] **Service Map** — Visual topology with status colors
- [ ] **Health Checks:**
  - [ ] Automated pings every 30 seconds
  - [ ] Response time tracking
  - [ ] Error rate monitoring
- [ ] **Alerts:**
  - [ ] Service down notification (Slack/email)
  - [ ] High latency warning (>1s)
  - [ ] High error rate (>1%)
- [ ] **Logs:**
  - [ ] Live log streaming
  - [ ] Error log search
  - [ ] Performance log analysis
- [ ] **Actions:**
  - [ ] Restart service (via PM2/Docker)
  - [ ] Scale up/down (add/remove instances)
  - [ ] Deploy new version
  - [ ] Rollback to previous version

**Infrastructure Metrics:**
- [ ] Server CPU/Memory/Disk usage
- [ ] Network bandwidth
- [ ] Database query performance
- [ ] Cache hit rates

---

### 9. 📋 Audit Logs

**Purpose:** Track all administrative actions for compliance

**Audit Log Entry:**
```typescript
interface AuditLogEntry {
  id: string;
  timestamp: Date;
  
  // Actor
  actorType: 'super_admin' | 'system' | 'user';
  actorId: string;
  actorEmail?: string;
  actorIP: string;
  
  // Action
  action: string; // e.g., 'user.suspend', 'feature_flag.enable'
  resource: string; // e.g., 'user:123', 'flag:quantum-substrate'
  
  // Details
  changes: Record<string, {
    before: any;
    after: any;
  }>;
  reason?: string;
  
  // Context
  requestId: string;
  userAgent: string;
}
```

**Tracked Actions:**
- User management (create, suspend, delete)
- Organization management (plan changes, limits)
- Universe management (kill, restart)
- Feature flag changes
- Security actions (blocks, throttles)
- Revenue actions (refunds, credits)
- System deployments

**Features:**
- [ ] **Audit Log Viewer:**
  - [ ] Search by action, user, date
  - [ ] Filter by severity
  - [ ] Export to CSV
- [ ] **Compliance Reports:**
  - [ ] GDPR data access log
  - [ ] Security incident reports
  - [ ] Financial audit trails
- [ ] **Retention:**
  - [ ] Keep logs for 7 years (compliance)
  - [ ] Archived to cold storage after 1 year

---

### 10. 🚀 Deployment Control

**Purpose:** Manage deployments and releases

**Deployment Dashboard:**
```typescript
interface Deployment {
  id: string;
  service: string;
  version: string;
  environment: 'production' | 'staging' | 'development';
  
  // Status
  status: 'pending' | 'deploying' | 'deployed' | 'failed' | 'rolled_back';
  
  // Metadata
  deployedBy: string;
  deployedAt: Date;
  commitHash: string;
  changelog: string;
  
  // Health
  healthChecksPassed: boolean;
  errorRate: number;
  rollbackTriggered: boolean;
}
```

**Features:**
- [ ] **Deployment History** — Timeline of all deployments
- [ ] **Deploy New Version:**
  - [ ] Select service
  - [ ] Select version/commit
  - [ ] Add changelog
  - [ ] Deploy with confirmation
- [ ] **Automated Rollback:**
  - [ ] If error rate >5% for 5 minutes
  - [ ] If health checks fail
  - [ ] Manual rollback button
- [ ] **Staging Environment:**
  - [ ] Deploy to staging first
  - [ ] Smoke tests
  - [ ] Promote to production
- [ ] **Blue-Green Deployments:**
  - [ ] Deploy to inactive environment
  - [ ] Switch traffic
  - [ ] Keep old version for quick rollback

**CI/CD Integration:**
- [ ] GitHub Actions webhook
- [ ] Automatic deployment on tag push
- [ ] Slack notifications

---

## 🎨 UI/UX Design

### Layout

```
┌────────────────────────────────────────────────────────────────┐
│  🔐 FORTISTATE SUPER ADMIN                    You • Logout    │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌─────────────────────────────────────┐   │
│  │ Navigation   │  │                                       │   │
│  │              │  │                                       │   │
│  │ 🌐 Overview  │  │         Main Content Area           │   │
│  │ 👥 Users     │  │                                       │   │
│  │ 🌌 Universes │  │                                       │   │
│  │ 🛡️ Security   │  │                                       │   │
│  │ 💰 Revenue   │  │                                       │   │
│  │ 🤖 AI Usage  │  │                                       │   │
│  │ 🎛️ Flags      │  │                                       │   │
│  │ 🏥 Health    │  │                                       │   │
│  │ 📋 Audit     │  │                                       │   │
│  │ 🚀 Deploy    │  │                                       │   │
│  │              │  │                                       │   │
│  └──────────────┘  └─────────────────────────────────────┘   │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Color Scheme

- **Primary:** Deep Purple (#6366f1) — For main actions
- **Success:** Green (#10b981) — For healthy status
- **Warning:** Amber (#f59e0b) — For degraded status
- **Error:** Red (#ef4444) — For critical issues
- **Background:** Dark (#0f172a) — Dark mode by default
- **Text:** Light gray (#e2e8f0) — High contrast

### Component Library

- **shadcn/ui** components for consistency
- **Recharts** for standard charts
- **D3.js** for advanced visualizations
- **React Table** for data tables
- **Framer Motion** for animations

---

## 🔒 Security Architecture

### Authentication Flow

```
1. User visits /super-admin
2. Redirected to /super-admin/login
3. Enter secret token (from environment variable)
4. Optional: Enter MFA code (authenticator app)
5. Token stored in secure HTTP-only cookie
6. Session expires after 8 hours
7. All actions logged to audit trail
```

### IP Whitelist

```typescript
// middleware.ts
const ALLOWED_IPS = process.env.SUPER_ADMIN_ALLOWED_IPS?.split(',') || [];

export function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.ip;
  
  if (!ALLOWED_IPS.includes(ip)) {
    return new Response('Access Denied', { status: 403 });
  }
  
  // ... continue with token check
}
```

### Environment Variables

```bash
# Super Admin Authentication
SUPER_ADMIN_SECRET_KEY=<your-256-bit-secret-key>
SUPER_ADMIN_ALLOWED_IPS=1.2.3.4,5.6.7.8

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/fortistate_analytics

# Redis
REDIS_URL=redis://localhost:6379

# Stripe (for revenue analytics)
STRIPE_SECRET_KEY=sk_live_xxx

# OpenAI (for AI cost tracking)
OPENAI_API_KEY=sk-xxx

# Slack (for alerts)
SLACK_WEBHOOK_URL=https://hooks.slack.com/xxx

# Email (for alerts)
SMTP_HOST=smtp.gmail.com
SMTP_USER=alerts@fortistate.io
SMTP_PASS=xxx
```

---

## 📦 Package Structure

```
packages/super-admin/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── overview/
│   │   │   │   └── page.tsx
│   │   │   ├── users/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── organizations/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── universes/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── security/
│   │   │   │   ├── abuse/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── monitoring/
│   │   │   │       └── page.tsx
│   │   │   ├── revenue/
│   │   │   │   ├── page.tsx
│   │   │   │   └── subscriptions/
│   │   │   │       └── page.tsx
│   │   │   ├── ai-usage/
│   │   │   │   └── page.tsx
│   │   │   ├── feature-flags/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── health/
│   │   │   │   └── page.tsx
│   │   │   ├── audit/
│   │   │   │   └── page.tsx
│   │   │   ├── deployments/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── users/
│   │   │   ├── orgs/
│   │   │   ├── universes/
│   │   │   ├── metrics/
│   │   │   ├── security/
│   │   │   ├── revenue/
│   │   │   ├── ai-usage/
│   │   │   ├── flags/
│   │   │   ├── health/
│   │   │   └── audit/
│   │   ├── layout.tsx
│   │   └── middleware.ts
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── charts/              # Chart components
│   │   ├── navigation/          # Nav components
│   │   ├── metrics/             # Metric cards
│   │   ├── tables/              # Data tables
│   │   └── alerts/              # Alert components
│   ├── lib/
│   │   ├── api/                 # API client
│   │   ├── auth/                # Auth utilities
│   │   ├── db/                  # Database client
│   │   ├── redis/               # Redis client
│   │   ├── stripe/              # Stripe client
│   │   ├── monitoring/          # Health checks
│   │   └── utils/               # Utility functions
│   └── types/
│       ├── user.ts
│       ├── organization.ts
│       ├── universe.ts
│       ├── metrics.ts
│       └── audit.ts
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/
├── public/
│   └── favicon.ico
├── .env.example
├── .env.local
├── package.json
├── tailwind.config.js
├── next.config.js
├── tsconfig.json
└── README.md
```

---

## 🗄️ Database Schema

### Analytics Database (PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  organization_id UUID,
  role VARCHAR(50),
  plan VARCHAR(50),
  created_at TIMESTAMP,
  last_active TIMESTAMP,
  is_suspended BOOLEAN DEFAULT false,
  is_abuser BOOLEAN DEFAULT false,
  lifetime_revenue DECIMAL(10,2) DEFAULT 0,
  notes TEXT
);

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  plan VARCHAR(50),
  subscription_status VARCHAR(50),
  mrr DECIMAL(10,2) DEFAULT 0,
  lifetime_revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP,
  industry VARCHAR(100),
  company_size VARCHAR(50)
);

-- Universes table
CREATE TABLE universes (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  owner_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  status VARCHAR(50),
  store_count INTEGER DEFAULT 0,
  law_count INTEGER DEFAULT 0,
  entity_count INTEGER DEFAULT 0,
  memory_usage_mb DECIMAL(10,2),
  cpu_usage DECIMAL(5,2),
  created_at TIMESTAMP,
  last_activity TIMESTAMP,
  is_abusive BOOLEAN DEFAULT false
);

-- Metrics table (time-series data)
CREATE TABLE metrics (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,4) NOT NULL,
  tags JSONB,
  INDEX idx_timestamp (timestamp),
  INDEX idx_metric_name (metric_name)
);

-- AI Usage table
CREATE TABLE ai_usage (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  agent_type VARCHAR(50), -- 'custodian', 'diplomat', 'storyteller'
  model VARCHAR(50), -- 'gpt-4', 'gpt-3.5-turbo', etc.
  tokens_used INTEGER,
  cost_usd DECIMAL(10,6),
  latency_ms INTEGER,
  success BOOLEAN
);

-- Abuse Events table
CREATE TABLE abuse_events (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  user_id UUID REFERENCES users(id),
  rule_id VARCHAR(100),
  severity VARCHAR(50),
  description TEXT,
  auto_action_taken VARCHAR(100),
  resolved BOOLEAN DEFAULT false
);

-- Feature Flags table
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  status VARCHAR(50),
  rollout_percentage INTEGER DEFAULT 0,
  target_orgs UUID[],
  target_plans VARCHAR(50)[],
  created_by VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Audit Logs table
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  actor_type VARCHAR(50),
  actor_id VARCHAR(255),
  actor_email VARCHAR(255),
  actor_ip VARCHAR(50),
  action VARCHAR(100),
  resource VARCHAR(255),
  changes JSONB,
  reason TEXT,
  request_id VARCHAR(100)
);

-- Deployments table
CREATE TABLE deployments (
  id UUID PRIMARY KEY,
  service VARCHAR(100),
  version VARCHAR(50),
  environment VARCHAR(50),
  status VARCHAR(50),
  deployed_by VARCHAR(255),
  deployed_at TIMESTAMP,
  commit_hash VARCHAR(100),
  changelog TEXT,
  health_checks_passed BOOLEAN,
  rollback_triggered BOOLEAN
);
```

---

## 🚀 Implementation Timeline

### Phase 1: Foundation (Week 1)
- [x] Create package structure
- [ ] Set up Next.js app
- [ ] Configure authentication
- [ ] Set up database (PostgreSQL)
- [ ] Create base layout and navigation
- [ ] Implement IP whitelist middleware

### Phase 2: Core Modules (Week 2-3)
- [ ] Module 1: Global Overview Dashboard
- [ ] Module 2: User & Organization Management
- [ ] Module 3: Universe Monitoring
- [ ] Module 4: Security & Abuse Detection

### Phase 3: Analytics Modules (Week 4-5)
- [ ] Module 5: Revenue Analytics
- [ ] Module 6: AI Usage & Cost Tracking
- [ ] Module 7: Feature Flag Management
- [ ] Module 8: System Health Monitoring

### Phase 4: Admin Tools (Week 6)
- [ ] Module 9: Audit Logs
- [ ] Module 10: Deployment Control
- [ ] Real-time WebSocket integration
- [ ] Alert system (Slack/email)

### Phase 5: Testing & Polish (Week 7)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation

### Phase 6: Deployment (Week 8)
- [ ] Deploy to internal server
- [ ] Configure monitoring
- [ ] Set up backups
- [ ] Create runbook

---

## 📊 Success Metrics

- **Visibility:** Can see all users, orgs, universes in real-time ✅
- **Control:** Can manage users, flags, deployments easily ✅
- **Security:** Detect and prevent abuse automatically ✅
- **Revenue:** Track MRR, churn, LTV accurately ✅
- **Cost:** Monitor AI usage and optimize costs ✅
- **Health:** Know system status at all times ✅
- **Speed:** Dashboard loads <1s, actions complete <2s ✅
- **Alerts:** Get notified of critical issues within 30 seconds ✅

---

## 🔗 Integration Points

### With User Admin Dashboard
- Share user/org database
- Cross-link to user-facing admin
- Impersonate mode redirects

### With Core FortiState
- Access universe data
- Query stores and laws
- Monitor telemetry streams

### With Inspector
- Direct links to inspector for universe debugging
- Share authentication context

### With AI Gateway
- Query AI usage metrics
- Control AI throttling
- Monitor costs

### With Visual Studio
- View Visual Studio usage
- Access canvas data
- Monitor collaboration sessions

---

## 📝 TODO Summary

1. **Scaffold Package** (Day 1)
   ```bash
   cd packages
   npx create-next-app@latest super-admin
   cd super-admin
   npx shadcn-ui@latest init
   npm install prisma @prisma/client
   npm install recharts d3 react-table
   npm install @tanstack/react-query zustand
   ```

2. **Set Up Authentication** (Day 1)
   - Create login page
   - Implement secret token auth
   - Add IP whitelist middleware
   - Set up session management

3. **Configure Database** (Day 2)
   - Create Prisma schema
   - Run migrations
   - Seed initial data
   - Set up Redis cache

4. **Build Core Modules** (Week 2-6)
   - Implement 10 modules as outlined above
   - Create API routes
   - Build UI components
   - Wire up real-time updates

5. **Testing & Deployment** (Week 7-8)
   - Write tests
   - Security audit
   - Deploy to internal server
   - Monitor and iterate

---

**Status:** Ready to implement  
**Priority:** HIGH (Required for production SaaS)  
**Estimated Effort:** 8 weeks  
**Owner:** You (internal only)

---

**End of Specification**
