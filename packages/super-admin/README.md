# 🔐 FortiState Super Admin Dashboard

**Internal platform management dashboard for FortiState platform owner.**

⚠️ **SECURITY WARNING:** This dashboard provides full platform access. Never expose to public internet.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set:
- `SUPER_ADMIN_SECRET_KEY` — Generate with: `openssl rand -base64 32`
- `SUPER_ADMIN_ALLOWED_IPS` — Your IP addresses (comma-separated)
- `DATABASE_URL` — PostgreSQL connection string
- Other required variables

### 3. Setup Database

```bash
npm run db:push
npm run db:generate
```

### 4. Run Development Server

```bash
npm run dev
```

Dashboard will be available at: **http://localhost:4200**

---

## 🔐 Authentication

### Secret Token Login

1. Navigate to `http://localhost:4200/login`
2. Enter your `SUPER_ADMIN_SECRET_KEY`
3. Complete MFA if enabled
4. Session expires after 8 hours

### IP Whitelist

Only IPs in `SUPER_ADMIN_ALLOWED_IPS` can access the dashboard.

---

## 📦 Modules

### 1. Global Overview (`/overview`)
Platform-wide metrics dashboard with real-time monitoring.

### 2. User Management (`/users`)
View, search, suspend, and manage ALL platform users.

### 3. Organization Management (`/organizations`)
Monitor and manage ALL organizations.

### 4. Universe Monitoring (`/universes`)
Track ALL universes across the platform.

### 5. Security & Abuse Detection (`/security`)
Detect and prevent platform abuse.

### 6. Revenue Analytics (`/revenue`)
Track MRR, ARR, churn, LTV, and revenue metrics.

### 7. AI Usage & Costs (`/ai-usage`)
Monitor AI API calls and costs.

### 8. Feature Flags (`/feature-flags`)
Control feature rollouts and experiments.

### 9. System Health (`/health`)
Monitor infrastructure and service health.

### 10. Audit Logs (`/audit`)
View ALL admin actions (7-year retention).

### 11. Deployment Control (`/deployments`)
Deploy and manage services.

---

## 🗄️ Database Schema

Super Admin uses a **separate PostgreSQL analytics database** with:

- `users` — Aggregated user data
- `organizations` — Aggregated org data
- `universes` — Aggregated universe data
- `metrics` — Time-series metrics
- `ai_usage` — AI call tracking
- `abuse_events` — Security events
- `feature_flags` — Feature control
- `audit_logs` — Admin action logs
- `deployments` — Release history

---

## 🛡️ Security

### Features

- ✅ Secret token authentication
- ✅ IP whitelist enforcement
- ✅ MFA support (optional)
- ✅ 8-hour session expiry
- ✅ All actions logged to audit trail
- ✅ 7-year log retention
- ✅ Security headers (CSP, X-Frame-Options)
- ✅ Rate limiting
- ✅ Encrypted data at rest

### Best Practices

1. **Never commit `.env` file**
2. **Rotate secret key regularly**
3. **Use strong JWT secret**
4. **Enable MFA in production**
5. **Monitor audit logs**
6. **Use VPN for remote access**
7. **Keep dependencies updated**

---

## 📊 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL + Prisma ORM
- **Caching:** Redis
- **Charts:** Recharts + D3.js
- **Auth:** Custom secret token + JWT
- **State:** Zustand

---

## 🔧 Scripts

```bash
npm run dev         # Start dev server (port 4200)
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
npm run db:generate # Generate Prisma client
npm run db:push     # Push schema to database
npm run db:migrate  # Run migrations
npm run db:studio   # Open Prisma Studio
```

---

## 📝 Environment Variables

See `.env.example` for complete list.

**Required:**
- `SUPER_ADMIN_SECRET_KEY`
- `SUPER_ADMIN_ALLOWED_IPS`
- `JWT_SECRET`
- `DATABASE_URL`

**Optional:**
- `REDIS_URL`
- `STRIPE_SECRET_KEY`
- `OPENAI_API_KEY`
- `FORTISTATE_API_URL`
- `INSPECTOR_API_URL`

---

## 🚀 Deployment

### Internal Server (Recommended)

1. **Setup PostgreSQL** on internal server
2. **Configure firewall** to restrict access
3. **Set environment variables**
4. **Build application:** `npm run build`
5. **Start server:** `npm run start`
6. **Access via VPN** for security

### Docker (Alternative)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 4200
CMD ["npm", "start"]
```

---

## 📈 Metrics

### Success Criteria

- ✅ You can view all platform metrics
- ✅ You can manage any user/org
- ✅ You can deploy services
- ✅ You can detect abuse
- ✅ <1s dashboard load time
- ✅ 100% uptime

---

## 🤝 Support

This is an **internal tool**. For issues, contact the development team.

---

## ⚠️ Important Notes

1. **Never expose to public internet**
2. **Always use VPN for remote access**
3. **Monitor audit logs regularly**
4. **Rotate secrets periodically**
5. **Keep database backups**
6. **Test in staging first**

---

**Built with ❤️ for FortiState platform management**
