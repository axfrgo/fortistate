# Production Deployment Guide

This guide covers everything you need to deploy Fortistate-based applications to production with confidence.

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Security Best Practices](#security-best-practices)
3. [Performance Tuning](#performance-tuning)
4. [Monitoring & Observability](#monitoring--observability)
5. [Scaling Considerations](#scaling-considerations)
6. [Error Handling](#error-handling)
7. [Deployment Checklist](#deployment-checklist)
8. [Runtime Orchestration Workflow](#runtime-orchestration-workflow)

## Environment Setup

### Node.js Requirements

- **Node.js**: 18.x or higher (LTS recommended)
- **TypeScript**: 5.0+ if using TypeScript
- **Memory**: Minimum 512MB RAM, recommended 2GB+

### Installation

```bash
npm install fortistate
# or
yarn add fortistate
# or
pnpm add fortistate
```

### Environment Variables

```bash
# Inspector/API Server (if using)
FORTISTATE_PORT=3456
FORTISTATE_SESSION_SECRET=your-secret-key-here

# Performance
FORTISTATE_CONSTRAINT_TIMEOUT=5000  # Max time for constraint checks (ms)
FORTISTATE_MAX_HISTORY_SIZE=10000   # Max causal events to retain

# Features
FORTISTATE_AUTO_REPAIR=true         # Enable automatic constraint repair
FORTISTATE_ENABLE_TELEMETRY=true    # Enable performance telemetry
FORTISTATE_ENABLE_INSPECTOR=false   # Disable inspector in production
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY dist ./dist
COPY node_modules ./node_modules

# Set environment
ENV NODE_ENV=production
ENV FORTISTATE_ENABLE_INSPECTOR=false

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Run
CMD ["node", "dist/server.js"]
```

## Security Best Practices

### 1. Inspector/API Security

**⚠️ CRITICAL: Disable Inspector in Production**

The Fortistate Inspector is a powerful development tool that should **NEVER** be exposed in production:

```typescript
// ❌ NEVER do this in production
const universe = createUniverse({
  id: 'prod-universe',
  substrate,
});
startInspectorServer(universe, { port: 3456 }); // DANGEROUS!

// ✅ Only enable in development
if (process.env.NODE_ENV === 'development') {
  startInspectorServer(universe, { 
    port: 3456,
    requireSessions: true,
    sessionSecret: process.env.SESSION_SECRET,
  });
}
```

### 2. Session Management

If you must use the inspector in a staging environment:

```typescript
import { startInspectorServer } from 'fortistate';

startInspectorServer(universe, {
  port: 3456,
  requireSessions: true,
  sessionSecret: process.env.FORTISTATE_SESSION_SECRET, // Use strong secret!
  adminToken: process.env.ADMIN_TOKEN, // Rotate regularly
  allowedOrigins: ['https://admin.yourcompany.com'],
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit requests
  },
});
```

### 3. Input Validation

Always validate external inputs before setting store values:

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
});

function updateUser(input: unknown) {
  try {
    const validated = UserSchema.parse(input);
    userStore.set(validated);
  } catch (err) {
    console.error('Invalid user data:', err);
    throw new Error('Validation failed');
  }
}
```

### 4. Constraint Security

Ensure constraints can't be bypassed:

```typescript
// ❌ BAD: Constraint can be disabled
const constraints = new Map();
if (process.env.SKIP_VALIDATION !== 'true') {
  constraints.set('user', [myConstraint]);
}

// ✅ GOOD: Always enforce in production
const constraints = new Map();
constraints.set('user', [
  {
    name: 'security-check',
    check: (state) => {
      // Always runs, can't be disabled
      return validateSecurity(state);
    },
  },
]);
```

## Performance Tuning

### 1. Constraint Optimization

```typescript
// ❌ SLOW: Deep clone on every check
check: (state) => {
  const copy = JSON.parse(JSON.stringify(state)); // Expensive!
  return validateCopy(copy);
}

// ✅ FAST: Read-only validation
check: (state) => {
  // No cloning needed for read-only checks
  return state.value >= 0 && state.value <= 100;
}
```

### 2. Event History Management

```typescript
const universe = createUniverse({
  id: 'prod',
  substrate,
  // Limit history to prevent memory growth
  maxHistorySize: 1000,
  // Prune old events
  pruneInterval: 60000, // Every minute
});
```

### 3. Sampling Optimization

For emergence detection:

```typescript
// ❌ SLOW: High-frequency sampling
const detector = new EmergenceDetector(universe, {
  samplingInterval: 10, // Every 10ms - too fast!
  windowSize: 1000,      // Large window - lots of memory
});

// ✅ FAST: Balanced sampling
const detector = new EmergenceDetector(universe, {
  samplingInterval: 100,  // Every 100ms
  windowSize: 50,         // Smaller window
  enabledPatterns: ['synchronization', 'equilibrium'], // Only needed patterns
});
```

### 4. Lazy Initialization

```typescript
// ✅ Create stores only when needed
class StoreManager {
  private stores = new Map();
  
  getStore(key: string) {
    if (!this.stores.has(key)) {
      this.stores.set(key, universe.createStore(key, initialValue));
    }
    return this.stores.get(key);
  }
}
```

### 5. Batching Updates

```typescript
// ❌ SLOW: Many small updates
for (let i = 0; i < 1000; i++) {
  store.set({ ...store.get(), [i]: value });
}

// ✅ FAST: Single batched update
const updates = {};
for (let i = 0; i < 1000; i++) {
  updates[i] = value;
}
store.set({ ...store.get(), ...updates });
```

## Monitoring & Observability

### 1. Telemetry Integration

```typescript
import { createUniverse } from 'fortistate';

const universe = createUniverse({
  id: 'prod',
  substrate,
  telemetrySink: (entry) => {
    // Send to your monitoring system
    metrics.increment('fortistate.law.executed', {
      lawName: entry.lawName,
      storeName: entry.storeName,
    });
    
    if (entry.duration > 100) {
      logger.warn('Slow law execution', {
        lawName: entry.lawName,
        duration: entry.duration,
      });
    }
    
    if (entry.repaired) {
      metrics.increment('fortistate.constraint.repaired', {
        storeName: entry.storeName,
      });
      logger.warn('Constraint violation repaired', entry);
    }
  },
});
```

### 2. Health Checks

```typescript
import express from 'express';

const app = express();

app.get('/health', (req, res) => {
  const state = universe.getState();
  const snapshot = universe.snapshot();
  
  if (state !== 'running') {
    return res.status(503).json({
      status: 'unhealthy',
      reason: `Universe state: ${state}`,
    });
  }
  
  // Check event processing
  const timeSinceLastEvent = Date.now() - snapshot.metadata.lastEventAt;
  if (timeSinceLastEvent > 60000) {
    return res.status(503).json({
      status: 'unhealthy',
      reason: 'No events in last 60s',
    });
  }
  
  res.json({
    status: 'healthy',
    eventCount: snapshot.metadata.eventCount,
    storeCount: universe.getStoreKeys().length,
  });
});
```

### 3. Performance Metrics

```typescript
// Track key metrics
setInterval(() => {
  const telemetry = universe.getTelemetry();
  const snapshot = universe.snapshot();
  
  // Law execution times
  const avgLawTime = telemetry.reduce((sum, t) => sum + t.duration, 0) / telemetry.length;
  metrics.gauge('fortistate.law.avg_duration', avgLawTime);
  
  // Constraint repairs
  const repairCount = telemetry.filter(t => t.repaired).length;
  metrics.gauge('fortistate.repairs.count', repairCount);
  
  // Store count
  metrics.gauge('fortistate.stores.count', universe.getStoreKeys().length);
  
  // Event count
  metrics.gauge('fortistate.events.total', snapshot.metadata.eventCount);
}, 60000); // Every minute
```

### 4. Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'fortistate-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'fortistate.log' }),
  ],
});

// Log constraint violations
const substrate = createSubstrate('prod', constraints, undefined, {
  onConstraintViolation: (storeName, violation) => {
    logger.error('Constraint violation', {
      storeName,
      violation,
      timestamp: new Date().toISOString(),
    });
  },
});
```

## Scaling Considerations

### 1. Horizontal Scaling

Fortistate is designed for single-process state management. For horizontal scaling:

**Option A: Separate Universes per Service**

```typescript
// service-1.ts
const universe1 = createUniverse({ id: 'service-1', substrate });

// service-2.ts
const universe2 = createUniverse({ id: 'service-2', substrate });

// Use message queue for cross-service coordination
mqClient.on('state-change', (data) => {
  universe2.getStore(data.key).set(data.value);
});
```

**Option B: Shared State via External Store**

```typescript
// Persist snapshots to Redis/PostgreSQL
setInterval(() => {
  const snapshot = universe.snapshot();
  redis.set('universe-snapshot', JSON.stringify(snapshot));
}, 5000);

// Restore on startup
const snapshot = JSON.parse(await redis.get('universe-snapshot'));
universe.restore(snapshot);
```

### 2. Memory Management

```typescript
// Monitor memory usage
setInterval(() => {
  const used = process.memoryUsage();
  
  if (used.heapUsed > 1.5 * 1024 * 1024 * 1024) { // 1.5GB
    logger.warn('High memory usage', {
      heapUsed: Math.round(used.heapUsed / 1024 / 1024) + 'MB',
    });
    
    // Trigger cleanup
    universe.cleanup(); // Prune old events
  }
}, 30000);
```

### 3. Load Balancing

```typescript
// Use sticky sessions for WebSocket/long-polling
// nginx configuration:
upstream fortistate {
  ip_hash; # Sticky sessions
  server app1:3000;
  server app2:3000;
  server app3:3000;
}
```

## Error Handling

### 1. Graceful Degradation

```typescript
try {
  store.set(newValue);
} catch (err) {
  logger.error('Store update failed', { err, newValue });
  
  // Fallback: Use last known good state
  const snapshot = await redis.get('last-good-snapshot');
  if (snapshot) {
    universe.restore(JSON.parse(snapshot));
  }
  
  // Alert ops team
  alerting.trigger('fortistate-critical-error', { err });
}
```

### 2. Circuit Breaker

```typescript
import CircuitBreaker from 'opossum';

const breaker = new CircuitBreaker(
  async (value) => store.set(value),
  {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
  }
);

breaker.on('open', () => {
  logger.error('Circuit breaker opened - too many store failures');
});

// Use breaker instead of direct calls
await breaker.fire(newValue);
```

### 3. Retry Logic

```typescript
import retry from 'async-retry';

await retry(
  async () => {
    store.set(newValue);
  },
  {
    retries: 3,
    minTimeout: 1000,
    onRetry: (err, attempt) => {
      logger.warn(`Store update retry ${attempt}`, { err });
    },
  }
);
```

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] Performance benchmarks run (`npm run perf`)
- [ ] Security audit (`npm audit`)
- [ ] Inspector disabled in production
- [ ] Environment variables configured
- [ ] Monitoring/alerting configured
- [ ] Health check endpoints working
- [ ] Load testing completed
- [ ] Backup/restore procedures tested

### Post-Deployment

- [ ] Health checks passing
- [ ] Metrics being collected
- [ ] Logs being aggregated
- [ ] No error spikes
- [ ] Performance within acceptable range
- [ ] Memory usage stable
- [ ] Alert thresholds configured
- [ ] Rollback plan documented

### Monitoring Checklist

Monitor these metrics:

- [ ] Request rate
- [ ] Error rate
- [ ] Law execution time (p50, p95, p99)
- [ ] Constraint repair frequency
- [ ] Memory usage (heap, RSS)
- [ ] CPU usage
- [ ] Event processing rate
- [ ] Store count
- [ ] Universe state (running/paused/destroyed)

### Security Checklist

- [ ] Inspector disabled or properly secured
- [ ] Session secrets are strong and rotated
- [ ] Input validation on all external data
- [ ] Constraints can't be bypassed
- [ ] No sensitive data in logs
- [ ] HTTPS for all inspector traffic
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] Security headers set
- [ ] Dependency vulnerabilities patched

## Runtime Orchestration Workflow

Fortistate Visual Studio now includes a full production loop for connecting integrations, versioning canvases, and orchestrating launches. Use this flow to guarantee repeatable go-lives:

### 1. Establish provider connections

Open the **Connection Center** (🔗 icon in the Visual Studio header) to authorize accounts and inspect bindings.

- Connect OAuth/API-key providers that power your automations.
- Review existing bindings and detach stale or failed wiring.
- Browse provider capabilities and docs before enabling a service in production.

### 2. Capture universes as reusable versions

Use **Save Canvas** to persist a snapshot. The **Saved Universes** dashboard (🗂) lets you:

- Audit metadata, market tags, and data-sensitivity classifications.
- Restore a saved version onto the canvas for tweaks or rollbacks.
- Inspect which bindings ship with each version before launch.

### 3. Launch with Go-Live Orchestration

The **Go-Live Launch Center** (🚀) converts a saved version into a runtime launch request (`POST /api/universes/:id/launch`). It enforces:

1. Universe + version selection with active entry node validation.
2. Runtime mode (dry run vs live) and telemetry verbosity.
3. Binding overrides so you can swap sandbox accounts for production credentials.
4. Completion notifications (in-app alerts and optional email to the signed-in operator).

Launch requests persist recent activity and update the registry so downstream dashboards stay in sync.

### 4. Observe, iterate, and version frequently

- Keep telemetry sinks enabled (see [Monitoring & Observability](#monitoring--observability)) to track performance and constraint repairs.
- After a run, archive launch metadata with deployment records and note overrides applied.
- When bindings or universe topology evolve, capture a new version so the launch recipe remains reproducible.

### 5. Automated QA guardrails

- `packages/visual-studio/test/universeRegistryStore.test.ts` covers draft creation, launch orchestration, and session synchronization so regressions are caught before deployments.
- Keep the suite green before promoting a build; these assertions ensure recent universes, last-viewed pointers, and workstate hydration all stay consistent when new orchestration features ship.

## Troubleshooting

### High Memory Usage

1. Check event history size: `universe.snapshot().metadata.eventCount`
2. Reduce `maxHistorySize` or enable pruning
3. Look for memory leaks in constraints/laws
4. Monitor store count growth

### Slow Performance

1. Check telemetry: `universe.getTelemetry()`
2. Identify slow laws (duration > 100ms)
3. Optimize constraint checks (avoid deep clones)
4. Reduce emergence detection sampling
5. Batch updates when possible

### Constraint Violations

1. Check logs for violation details
2. Review constraint logic
3. Verify input validation
4. Test repair functions
5. Consider if constraint is too strict

## Support

- **Documentation**: https://github.com/yourusername/fortistate
- **Issues**: https://github.com/yourusername/fortistate/issues
- **Discussions**: https://github.com/yourusername/fortistate/discussions
- **Security**: security@yourcompany.com

## License

MIT - See LICENSE file for details
