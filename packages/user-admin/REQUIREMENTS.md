# User Admin Dashboard - Requirements Document

**Project:** FortiState User Admin Dashboard  
**Version:** 1.0  
**Date:** October 7, 2025  
**Status:** In Development

---

## 🎯 Project Overview

The **User Admin Dashboard** is a multi-tenant, organization-scoped admin panel that allows FortiState customers to manage their teams, universes, API keys, and billing independently. Unlike the **Super Admin Dashboard** (which manages the entire FortiState platform), the User Admin Dashboard provides a self-service interface for individual organizations.

---

## 🔄 Super Admin vs User Admin

| Feature | Super Admin Dashboard | User Admin Dashboard |
|---------|----------------------|---------------------|
| **Purpose** | Platform management | Organization self-service |
| **Users** | FortiState platform admins | Organization owners/admins/members |
| **Scope** | All organizations | Single organization |
| **Port** | 4200 | 4300 |
| **Authentication** | Super admin secret key | JWT with email/password |
| **Database** | PostgreSQL (analytics) | SQLite (dev) → PostgreSQL (prod) |
| **Access Control** | IP whitelist | Role-based (owner/admin/member) |
| **Analytics** | Platform-wide metrics | Organization-specific metrics |
| **User Management** | Manage all platform users | Manage organization team members |
| **Universe Management** | View all universes | Manage org universes only |
| **Billing** | No billing UI | Full billing/subscription management |
| **API Keys** | View all keys | Generate/manage org API keys |
| **Styling** | VS Code aesthetics | VS Code aesthetics (consistent) |

---

## 👥 User Roles & Permissions

### Role Hierarchy
```
Owner (Full Control)
  ├── Admin (Management)
  └── Member (Read-only + Limited Write)
```

### Permission Matrix

| Feature | Owner | Admin | Member |
|---------|-------|-------|--------|
| **Organization Settings** | ✅ Full | ❌ View Only | ❌ View Only |
| **Billing & Subscriptions** | ✅ Full | ❌ View Only | ❌ No Access |
| **Delete Organization** | ✅ Yes | ❌ No | ❌ No |
| **Team Management** | ✅ Full | ✅ Invite/Remove Members | ❌ View Only |
| **Role Assignment** | ✅ Full | ✅ Member/Admin Only | ❌ No |
| **Universe Management** | ✅ Full | ✅ Full | ✅ View, Limited Edit |
| **API Key Management** | ✅ Full | ✅ Full | ✅ Generate/View Own Keys |
| **Activity Log** | ✅ View All | ✅ View All | ✅ View Own Activity |
| **Analytics** | ✅ Full | ✅ Full | ✅ View Only |
| **Support Tickets** | ✅ Full | ✅ Full | ✅ Full |

---

## 📋 MVP Features (Phase 1 - Current)

### ✅ Completed (Tasks 1-6)
- [x] VS Code design system integration
- [x] Next.js 14 project structure
- [x] Authentication (JWT, bcrypt)
- [x] Multi-tenant database schema
- [x] Login/Register pages
- [x] Protected routes (middleware)
- [x] Logout functionality

### 🚧 In Progress (Tasks 7-17)

#### 1. **Dashboard Home** (Task 7)
- Organization overview
- Key metrics cards:
  - Team member count
  - Active universes count
  - API keys count
  - API calls this month
- Quick action buttons:
  - Invite team member
  - Create universe
  - Generate API key
- Recent activity feed (last 10 activities)
- Organization info display (name, plan, member count)

#### 2. **Team Management** (Task 8)
- Team member list with:
  - Avatar/initials
  - Name & email
  - Role badge (Owner/Admin/Member)
  - Join date
  - Last active
  - Actions (edit role, remove)
- Invite member modal:
  - Email input
  - Role selector
  - Expiry (7 days default)
- Pending invitations list
- Role change confirmation modal
- Remove member confirmation modal
- Activity logging (member added/removed/role changed)

#### 3. **Universe Management** (Task 9)
- Universe list view:
  - Name & description
  - Status (active/inactive)
  - Created date
  - Last activity
  - API call count
  - Actions (view, edit, delete)
- Create universe modal:
  - Name (required)
  - Description (optional)
  - Configuration JSON editor
- Universe details page:
  - Metrics dashboard
  - Connection string
  - Environment variables
  - Activity log
  - Danger zone (delete)
- VS Code Explorer tree-style navigation

#### 4. **API Key Management** (Task 10)
- API key list:
  - Name
  - Key prefix (e.g., "fs_test_abc...")
  - Permissions (read/write/admin)
  - Created date
  - Last used
  - Status (active/revoked)
  - Actions (copy, revoke)
- Generate key modal:
  - Name input
  - Permission checkboxes
  - Expiry selector (never/7d/30d/90d)
  - Copy key on creation (show once)
- Revoke key confirmation
- Usage tracking graph
- VS Code Terminal output style

#### 5. **Billing & Subscriptions** (Task 11)
- Current plan display:
  - Plan name (Free/Pro/Enterprise)
  - Price
  - Features list
  - Usage limits
- Usage metrics:
  - API calls (current/limit)
  - Team members (current/limit)
  - Universes (current/limit)
  - Storage (current/limit)
- Upgrade/downgrade UI:
  - Plan comparison table
  - Change plan button
- Payment method:
  - Card info display
  - Update payment method
- Billing history:
  - Invoice list
  - Download invoices
- Stripe integration:
  - Customer portal redirect
  - Webhook handling (payment success/failed)

---

## 🔮 Future Features (Phase 2)

### Phase 2A - Enhanced Features (Tasks 12-17)
- **Analytics Dashboard** - Charts for API calls, errors, universes
- **Organization Settings** - Name, logo, domain, security
- **API Documentation** - Interactive docs with code examples
- **Activity Log** - Filterable real-time activity feed
- **Support Center** - Ticket submission and knowledge base
- **Onboarding Flow** - Guided setup for new organizations

### Phase 2B - Advanced Features (Tasks 18-30)
- **User Profile Page** - Settings, avatar, 2FA
- **Real-Time Updates** - WebSocket/SSE for live data
- **Notification System** - Bell icon with dropdown
- **Mobile Responsive** - Full mobile optimization
- **Data Export** - CSV/JSON exports
- **Global Search** - Cmd+K command palette
- **Error Handling** - Error boundaries, toast notifications
- **Permission System** - Granular feature permissions
- **Theme System** - Dark+/Light+/High Contrast
- **Status Bar** - Enhanced with real data
- **Testing Infrastructure** - Vitest, React Testing Library, Playwright

---

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.6.3
- **Styling:** Tailwind CSS 3.4.15 + Custom CSS
- **Icons:** Lucide React
- **State Management:** React Hooks (useState, useEffect)
- **Forms:** Native HTML + React state
- **Validation:** Zod (API routes)
- **Date Handling:** date-fns

### Backend Stack
- **Runtime:** Node.js 22+
- **API:** Next.js API Routes
- **Database:** Prisma ORM
- **Database Engine:** SQLite (dev) → PostgreSQL (prod)
- **Authentication:** JWT (jose library)
- **Password Hashing:** bcrypt
- **Session Storage:** httpOnly cookies

### DevOps
- **Package Manager:** npm
- **Dev Server:** Next.js dev (port 4300)
- **Build Tool:** Next.js build (SWC)
- **Code Quality:** ESLint
- **Type Checking:** TypeScript strict mode

---

## 🗄️ Database Schema Overview

### Core Tables
- `User` - User accounts (email, password, name)
- `Organization` - Organizations (name, slug, plan)
- `OrgUser` - User-Org junction (userId, orgId, role)

### Feature Tables
- `Universe` - FortiState universes
- `UniverseMetrics` - Universe analytics
- `ApiKey` - API keys with permissions
- `OrgInvitation` - Team invitations
- `Session` - JWT session tracking

### Settings & Billing
- `OrgSettings` - Organization settings (JSON)
- `BillingInfo` - Stripe customer data

### Activity & Notifications
- `Activity` - Audit trail for all actions
- `Notification` - User notifications

**Total Models:** 13  
**Indexes:** 25+  
**Unique Constraints:** 10+

---

## 🔒 Security Requirements

### Authentication
- ✅ JWT tokens with 7-day expiry
- ✅ httpOnly cookies (XSS protection)
- ✅ Secure cookies in production (HTTPS)
- ✅ bcrypt password hashing (12 rounds)
- ✅ Middleware route protection
- 🔹 Rate limiting on auth routes (TODO)
- 🔹 Password reset flow (TODO)
- 🔹 2FA support (TODO)
- 🔹 Email verification (TODO)

### Authorization
- ✅ Role-based access control (owner/admin/member)
- ✅ Organization scoping on all queries
- 🔹 Granular feature permissions (TODO)
- 🔹 API key permission scopes (TODO)

### Data Protection
- ✅ Input validation with Zod
- ✅ SQL injection protection (Prisma)
- ✅ Generic error messages (no enumeration)
- 🔹 CSRF tokens (TODO)
- 🔹 API rate limiting (TODO)
- 🔹 Audit logging (partially done)

### Production Hardening
- 🔹 Environment variable validation
- 🔹 Secrets management (env files)
- 🔹 HTTPS enforcement
- 🔹 Security headers (helmet.js)
- 🔹 DDoS protection
- 🔹 Database encryption at rest
- 🔹 Regular security audits

---

## 📊 Performance Requirements

### Page Load
- **Target:** < 2 seconds (first paint)
- **Strategy:** 
  - Server-side rendering
  - Code splitting
  - Image optimization
  - CDN for static assets

### API Response
- **Target:** < 500ms (95th percentile)
- **Strategy:**
  - Database indexing
  - Query optimization
  - API caching (Redis)
  - Pagination

### Database
- **Target:** < 100ms (query time)
- **Strategy:**
  - Proper indexes
  - Connection pooling
  - Query optimization
  - Avoid N+1 queries

---

## 🎨 UI/UX Requirements

### Design System
- **Theme:** VS Code Dark+ aesthetic
- **Colors:** Purple accent (#a78bfa), dark backgrounds
- **Typography:** System fonts, 12-16px base
- **Spacing:** 4px grid system
- **Components:** Buttons, inputs, cards, modals, toasts
- **Animations:** Smooth transitions (0.2s cubic-bezier)

### Layout
- **Structure:** Activity bar + Sidebar + Editor area + Status bar
- **Responsive:** Desktop-first, mobile-adaptive
- **Navigation:** Sidebar with active state highlighting
- **Breadcrumbs:** For nested pages
- **Modals:** Centered overlay with backdrop blur

### Accessibility
- 🔹 Keyboard navigation
- 🔹 ARIA labels
- 🔹 Screen reader support
- 🔹 Color contrast (WCAG AA)
- 🔹 Focus indicators
- 🔹 Alt text for images

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)
- Authentication utilities
- API route handlers
- Helper functions
- Data transformations

### Component Tests (React Testing Library)
- Form validation
- Button interactions
- Modal behavior
- State management

### Integration Tests
- Auth flow (register → login → logout)
- Team management flow
- Universe CRUD operations
- API key generation

### E2E Tests (Playwright)
- Complete user journeys
- Cross-browser testing
- Mobile viewport testing

---

## 📈 Success Metrics

### User Engagement
- Daily active organizations
- Average session duration
- Feature adoption rate
- User retention (30/60/90 day)

### Performance
- Page load time (< 2s)
- API response time (< 500ms)
- Error rate (< 1%)
- Uptime (99.9%)

### Business
- Free → Paid conversion rate
- Churn rate
- Customer satisfaction (CSAT)
- Support ticket volume

---

## 🚀 Deployment Strategy

### Environments
- **Development:** Local (SQLite)
- **Staging:** Vercel/Railway (PostgreSQL)
- **Production:** Vercel/Railway (PostgreSQL + Redis)

### CI/CD Pipeline
1. Code push to GitHub
2. Run tests (unit + integration)
3. TypeScript type checking
4. ESLint + Prettier
5. Build Next.js app
6. Deploy to environment
7. Run E2E tests
8. Health check

### Database Migrations
- Prisma migrate for schema changes
- Zero-downtime deployments
- Rollback strategy
- Backup before migrations

---

## 📝 Documentation Requirements

### Developer Docs
- [x] README.md - Project overview
- [x] QUICKSTART.md - Setup instructions
- [x] LAYOUT_GUIDE.md - VS Code layout
- [x] TASK_5_COMPLETE.md - Structure complete
- [x] TASK_6_COMPLETE.md - Auth complete
- [ ] API.md - API route documentation
- [ ] DATABASE.md - Schema documentation
- [ ] DEPLOYMENT.md - Deployment guide

### User Docs
- [ ] Getting Started guide
- [ ] Team management tutorial
- [ ] Universe setup guide
- [ ] API key usage guide
- [ ] Billing FAQ
- [ ] Troubleshooting guide

---

## 🎯 Definition of Done

A feature is considered "done" when:
- ✅ Functionality implemented and working
- ✅ Error handling implemented
- ✅ Loading states implemented
- ✅ VS Code styling applied
- ✅ TypeScript types defined
- ✅ No console errors/warnings
- ✅ Responsive on desktop
- 🔹 Unit tests written (TODO)
- 🔹 Integration tests written (TODO)
- 🔹 Documentation updated (TODO)
- 🔹 Code reviewed (TODO)

---

## 🗓️ Timeline Estimate

### Phase 1 (Completed - Tasks 1-6)
- **Duration:** 4 hours
- **Status:** ✅ COMPLETE
- **Deliverables:** Auth system, database schema, project structure

### Phase 2 (Core Features - Tasks 7-17)
- **Duration:** 8-10 hours
- **Status:** 🚧 IN PROGRESS
- **Deliverables:** Dashboard home, team, universes, API keys, billing, analytics, settings

### Phase 3 (Enhanced Features - Tasks 18-30)
- **Duration:** 12-15 hours
- **Status:** ⏳ PLANNED
- **Deliverables:** Profile, real-time, notifications, mobile, search, testing

### Total Estimated Time
- **MVP (Tasks 1-17):** 12-14 hours
- **Complete (Tasks 1-30):** 24-29 hours

---

## 🔗 Related Documents

- [Visual Studio Design System](../visual-studio/DESIGN_SYSTEM.md)
- [Super Admin Documentation](../super-admin/README.md)
- [FortiState Core Documentation](../../README.md)
- [Roadmap](../../COSMOGENESIS_ROADMAP.md)

---

## ✅ Requirements Sign-Off

**Created:** October 7, 2025  
**Author:** AI Development Team  
**Status:** APPROVED  
**Next Review:** After Phase 2 completion

**This document serves as the single source of truth for User Admin Dashboard requirements and scope.**
