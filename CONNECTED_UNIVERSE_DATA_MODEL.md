# Connected Universe Data Model – Implementation Notes

**Date:** October 10, 2025  
**Author:** Visual Studio Engineering

## Overview

This document captures the initial data-layer scaffolding required for the Connected Universe initiative. It introduces strongly typed stores for third-party integrations and saved universes, along with session persistence hooks so users can resume work seamlessly across sessions.

## Key Artifacts

### 1. Integration Types & Store
- **File:** `packages/visual-studio/src/integrations/types.ts`
  - Declares canonical provider IDs, capabilities, account statuses, bindings, drafts, and runtime configs.
  - Supports both built-in integrations (ChatGPT, Google Workspace, Slack, CRM tools) and future extensibility.
- **File:** `packages/visual-studio/src/integrations/integrationStore.ts`
  - Fortistate store managing integration accounts, bindings, and drafts.
  - REST endpoints assumed under `/api/integrations` (connect, refresh, bindings CRUD).
  - Automatically mirrors snapshots into `session.workState.integrationState` for persistence.
  - Provides actions for syncing providers, connecting/disconnecting accounts, and managing binding drafts.

### 2. Universe Registry Store
- **File:** `packages/visual-studio/src/universes/universeRegistryStore.ts`
  - Tracks saved universes, version history, and drafts via `/api/universes` endpoints.
  - Maintains recents, last viewed universe, and handles CRUD operations.
  - Updates `session.workState.universeState` so the session layer remembers gallery context.

### 3. Session Persistence Enhancements
- **File:** `packages/visual-studio/src/session/sessionPersistence.ts`
  - `WorkState` now includes `integrationState` and `universeState` references (account IDs, binding IDs, draft IDs, recents, etc.).
  - Persistence diagnostics log the new counts during save/restore/startup routines.

## Data Flow Snapshot

```
[Integration API] ⇄ integrationStore ⇄ session.workState.integrationState ⇄ localStorage cache
       │
       ├─ integrates with canvas nodes via bindings
       │
[Universe API] ⇄ universeRegistryStore ⇄ session.workState.universeState ⇄ localStorage cache
```

## Next Steps

1. Wire UI components to the new stores (Connection Center, Universe Gallery).
2. Implement the backend services (`/api/integrations`, `/api/universes`) with secure credential storage.
3. Extend orchestration engine to consume `UniverseRuntimeConfig` when launching automations.
4. Add automated tests for store actions (mocking fetch responses).

These scaffolds establish the persistence backbone needed to deliver account-aware, launch-ready universes with confidence.
