# 🚀 FortiState Dashboards — Quick Start Guide

**Building Both Admin Dashboards**

---

## 📊 What We're Building

1. **User Admin Dashboard** (`packages/admin-dashboard/`)
   - For customers to manage their organizations
   - Public-facing, standard auth
   - Timeline: 15 days

2. **Super Admin Dashboard** (`packages/super-admin/`)
   - For you to manage the entire platform
   - Internal only, secret auth
   - Timeline: 8 weeks

---

## 🎯 Step-by-Step Implementation

### Part 1: User Admin Dashboard (Start Here)

#### Day 1: Scaffold Application

```bash
cd packages
npx create-next-app@latest admin-dashboard

# During setup:
# ✅ TypeScript? Yes
# ✅ ESLint? Yes
# ✅ Tailwind CSS? Yes
# ✅ src/ directory? Yes
# ✅ App Router? Yes
# ✅ Import alias? Yes (@/*)

cd admin-dashboard

# Install dependencies
npm install @clerk/nextjs
npm install zustand
npm install @tanstack/react-query
npm install recharts
npm install date-fns
npm install lucide-react

# Install shadcn/ui
npx shadcn-ui@latest init
# Select: Default style, Zinc color, CSS variables

# Add shadcn components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add select
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
```

#### Day 1: Set Up Clerk Authentication

```typescript
// src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}

// middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up"],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

```bash
# Add to .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

#### Day 2: Create Dashboard Layout

```typescript
// src/app/(dashboard)/layout.tsx
import { UserButton } from '@clerk/nextjs'
import { Sidebar } from '@/components/Sidebar'

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="border-b px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">FortiState Admin</h1>
          <UserButton />
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

// src/components/Sidebar.tsx
import Link from 'next/link'
import { Home, Box, Shield, Users, DollarSign, Activity, Settings } from 'lucide-react'

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-gray-50 p-6">
      <nav className="space-y-2">
        <NavLink href="/dashboard" icon={Home}>Overview</NavLink>
        <NavLink href="/dashboard/universes" icon={Box}>Universes</NavLink>
        <NavLink href="/dashboard/laws" icon={Shield}>Laws</NavLink>
        <NavLink href="/dashboard/agents" icon={Users}>AI Agents</NavLink>
        <NavLink href="/dashboard/billing" icon={DollarSign}>Billing</NavLink>
        <NavLink href="/dashboard/telemetry" icon={Activity}>Telemetry</NavLink>
        <NavLink href="/dashboard/settings" icon={Settings}>Settings</NavLink>
      </nav>
    </aside>
  )
}

function NavLink({ href, icon: Icon, children }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-200">
      <Icon className="w-5 h-5" />
      <span>{children}</span>
    </Link>
  )
}
```

#### Day 3-5: Build Universes Module

```typescript
// src/app/(dashboard)/universes/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UniverseCard } from '@/components/UniverseCard'

export default function UniversesPage() {
  const [universes, setUniverses] = useState([])

  useEffect(() => {
    // Fetch universes from API
    fetch('/api/universes')
      .then(res => res.json())
      .then(data => setUniverses(data))
  }, [])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">My Universes</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Universe
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {universes.map(universe => (
          <UniverseCard key={universe.id} universe={universe} />
        ))}
      </div>
    </div>
  )
}

// src/components/UniverseCard.tsx
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, Square, Activity } from 'lucide-react'

export function UniverseCard({ universe }) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold">{universe.name}</h3>
        <Badge variant={universe.status === 'running' ? 'success' : 'secondary'}>
          {universe.status}
        </Badge>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Stores:</span>
          <span className="font-medium">{universe.storeCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Laws:</span>
          <span className="font-medium">{universe.lawCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Entities:</span>
          <span className="font-medium">{universe.entityCount}</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {universe.status === 'running' ? (
          <Button size="sm" variant="outline">
            <Square className="w-4 h-4 mr-2" />
            Stop
          </Button>
        ) : (
          <Button size="sm" variant="outline">
            <Play className="w-4 h-4 mr-2" />
            Start
          </Button>
        )}
        <Button size="sm" variant="ghost">
          <Activity className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </div>
    </Card>
  )
}
```

#### Day 6-7: Build Laws Module

```typescript
// src/app/(dashboard)/laws/page.tsx
'use client'

import { useState } from 'react'
import { Shield, Plus, Edit, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui/table'

export default function LawsPage() {
  const [laws, setLaws] = useState([])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Law Registry</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Law
        </Button>
      </div>

      <Table>
        <thead>
          <tr>
            <th>Law Name</th>
            <th>Universe</th>
            <th>Status</th>
            <th>Violations (24h)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {laws.map(law => (
            <tr key={law.id}>
              <td className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {law.name}
              </td>
              <td>{law.universeName}</td>
              <td>
                <Badge variant={law.enabled ? 'success' : 'secondary'}>
                  {law.enabled ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td>{law.violations24h}</td>
              <td>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
```

#### Day 8-10: Build Remaining Modules
- Agents module (AI suggestions)
- Billing module (Stripe integration)
- Telemetry module (charts)
- Settings module (org config)

#### Day 11-15: Polish & Testing
- Error handling
- Loading states
- Responsive design
- E2E tests
- Documentation

---

### Part 2: Super Admin Dashboard (After User Admin)

#### Week 1: Scaffold Super Admin

```bash
cd packages
npx create-next-app@latest super-admin

cd super-admin

# Install dependencies
npm install prisma @prisma/client
npm install recharts d3
npm install @tanstack/react-query
npm install date-fns
npm install lucide-react

# Install shadcn/ui
npx shadcn-ui@latest init

# Add components (same as user admin)
```

#### Week 1: Set Up Secret Authentication

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ALLOWED_IPS = process.env.SUPER_ADMIN_ALLOWED_IPS?.split(',') || []

export function middleware(request: NextRequest) {
  // Check IP whitelist
  const ip = request.headers.get('x-forwarded-for') || request.ip
  if (!ALLOWED_IPS.includes(ip!)) {
    return new Response('Access Denied', { status: 403 })
  }

  // Check authentication token
  const token = request.cookies.get('super-admin-token')?.value
  
  if (request.nextUrl.pathname !== '/login') {
    if (token !== process.env.SUPER_ADMIN_SECRET_KEY) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}

// src/app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [token, setToken] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })

    if (res.ok) {
      router.push('/dashboard')
    } else {
      alert('Invalid token')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6">🔐 Super Admin Login</h1>
        <Input
          type="password"
          placeholder="Enter secret token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="mb-4"
        />
        <Button onClick={handleLogin} className="w-full">
          Login
        </Button>
      </div>
    </div>
  )
}
```

```bash
# .env.local
SUPER_ADMIN_SECRET_KEY=your-256-bit-secret-key-here
SUPER_ADMIN_ALLOWED_IPS=1.2.3.4,5.6.7.8

DATABASE_URL=postgresql://user:pass@localhost:5432/fortistate_analytics
REDIS_URL=redis://localhost:6379

STRIPE_SECRET_KEY=sk_live_xxx
OPENAI_API_KEY=sk-xxx

SLACK_WEBHOOK_URL=https://hooks.slack.com/xxx
```

#### Week 2-3: Build Core Modules
- Global Overview Dashboard
- User & Organization Management
- Universe Monitoring
- Security & Abuse Detection

#### Week 4-5: Build Analytics Modules
- Revenue Analytics
- AI Usage & Cost Tracking
- Feature Flag Management
- System Health Monitoring

#### Week 6: Build Admin Tools
- Audit Logs
- Deployment Control

#### Week 7-8: Testing & Deployment
- End-to-end testing
- Security audit
- Performance optimization
- Deploy to internal server

---

## 📊 Database Setup

### User Admin Dashboard
Uses **same database as main FortiState app** (users, orgs, universes tables)

### Super Admin Dashboard
Uses **separate analytics database** (PostgreSQL)

```bash
# Install Prisma
npm install prisma --save-dev
npm install @prisma/client

# Initialize Prisma
npx prisma init

# Edit prisma/schema.prisma (see SUPER_ADMIN_SPEC.md for full schema)

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

---

## 🚀 Running Both Dashboards Locally

```bash
# Terminal 1: User Admin Dashboard
cd packages/admin-dashboard
npm run dev
# → http://localhost:3000

# Terminal 2: Super Admin Dashboard
cd packages/super-admin
npm run dev
# → http://localhost:4200

# Terminal 3: Core FortiState API
cd fortistate
npm run build
npm run inspect
# → http://localhost:4000
```

---

## 📝 Environment Variables Summary

### User Admin Dashboard (.env.local)
```bash
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# FortiState API
NEXT_PUBLIC_FORTISTATE_API_URL=http://localhost:4000

# Stripe (for billing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
```

### Super Admin Dashboard (.env.local)
```bash
# Super Admin Auth
SUPER_ADMIN_SECRET_KEY=your-secret-key
SUPER_ADMIN_ALLOWED_IPS=127.0.0.1,::1

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/fortistate_analytics
REDIS_URL=redis://localhost:6379

# External APIs
STRIPE_SECRET_KEY=sk_live_xxx
OPENAI_API_KEY=sk-xxx

# Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/xxx
```

---

## ✅ Success Criteria

### User Admin Dashboard
- [x] Users can sign up/login with Clerk
- [ ] Users can create/manage universes
- [ ] Users can configure laws
- [ ] Users can view AI agent suggestions
- [ ] Users can manage billing/subscription
- [ ] Users can view telemetry/metrics
- [ ] Users can configure org settings

### Super Admin Dashboard
- [ ] You can login with secret token
- [ ] You can view all users/orgs/universes
- [ ] You can suspend/manage users
- [ ] You can track revenue (MRR/ARR)
- [ ] You can monitor AI usage/costs
- [ ] You can control feature flags
- [ ] You can view system health
- [ ] You can manage deployments
- [ ] You can view audit logs

---

## 📚 Resources

- **User Admin Spec:** `IMPLEMENTATION_PLAN.md` (Module 2.1)
- **Super Admin Spec:** `SUPER_ADMIN_SPEC.md`
- **Comparison:** `DASHBOARD_COMPARISON.md`
- **shadcn/ui Docs:** https://ui.shadcn.com
- **Clerk Docs:** https://clerk.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs

---

## 🎯 Next Steps

1. **Start with User Admin Dashboard** (customers need this first)
2. **Build one module at a time** (easier to test)
3. **Test thoroughly** (authentication, authorization, data access)
4. **Deploy User Admin** (get customer feedback)
5. **Build Super Admin** (you need this for management)
6. **Integrate everything** (test end-to-end)
7. **Launch!** 🚀

---

**Let's build amazing admin experiences!**
