# Telemetry Streaming

The Fortistate inspector now includes real-time telemetry streaming for monitoring law violations, repairs, and reactions from the cosmogenesis runtime.

## Overview

When the `ConstraintAuditor` enforces universe laws, it emits structured telemetry events that can be consumed by:
- The inspector's telemetry panel (real-time SSE stream)
- Custom telemetry sinks (logs, metrics, alerts)
- Audit trails for compliance

## Inspector UI

### Viewing Telemetry

1. Start the inspector: `npm run inspect`
2. Open `http://localhost:4000` in your browser
3. Click the **Telemetry** button in the top-right corner
4. The telemetry panel displays real-time events as they occur

### Event Types

- **violation**: A law constraint was violated
- **repair**: The auditor automatically repaired an invalid state
- **reaction**: A law reaction was triggered
- **reaction-error**: A law reaction failed
- **audit-error**: The auditor encountered an error

Each event includes:
- `timestamp`: When the event occurred
- `lawName`: Which law generated the event
- `storeKey`: The affected store
- `severity`: `info`, `warn`, or `error`
- `message`: Human-readable description
- `details`: Additional context (optional)

## HTTP Endpoint

### `GET /telemetry/stream`

Server-Sent Events (SSE) endpoint that streams telemetry in real-time.

**Authentication**: Requires `observer` role or higher (when sessions are enabled)

**Response**: `text/event-stream`

```
data: {"timestamp":1696284123456,"type":"violation","lawName":"positive-numbers","storeKey":"counter","severity":"warn","message":"Value must be positive"}

data: {"timestamp":1696284123457,"type":"repair","lawName":"positive-numbers","storeKey":"counter","severity":"info","message":"Repaired invalid state"}
```

**Keep-alive**: Server sends `: ping\n\n` every 30 seconds

**Client Example**:
```javascript
const source = new EventSource('/telemetry/stream');
source.onmessage = (e) => {
  const entry = JSON.parse(e.data);
  console.log('[telemetry]', entry.type, entry.lawName);
};
```

## Programmatic Usage

### Wiring Custom Telemetry Sinks

```typescript
import { ConstraintAuditor } from 'fortistate/cosmogenesis/auditor';

const auditor = new ConstraintAuditor({
  substrate,
  stores,
  autoRepair: true,
  telemetrySink: (entry) => {
    // Custom handling
    if (entry.severity === 'error') {
      logger.error('[law]', entry.lawName, entry.message);
    }
    // Forward to monitoring service
    metrics.increment('law.violation', { law: entry.lawName });
  }
});

auditor.start();
```

### Inspector Integration

The inspector automatically buffers the last 100 telemetry events in memory and broadcasts them to connected SSE clients. When a client connects, it receives:
1. The buffered history (up to 100 recent events)
2. Real-time events as they occur

## Security

- Telemetry endpoints respect the same authentication rules as other inspector routes
- When `FORTISTATE_REQUIRE_SESSIONS=1`, clients must provide a valid session token
- All connections are logged in the audit trail

## Performance Notes

- Telemetry events are emitted synchronously during law evaluation
- The inspector buffers a maximum of 100 events in memory (FIFO)
- SSE connections are lightweight; the server can handle hundreds of concurrent subscribers
- For high-throughput systems, consider sampling or filtering telemetry before emission

## Example

See `examples/telemetry-demo.mjs` for a working demonstration.

---

**Related Documentation**:
- [Phase 3 Constraint Runtime](./PHASE_3_CONSTRAINT_RUNTIME.md)
- [Inspector Authentication](./AUTHENTICATION.md)
