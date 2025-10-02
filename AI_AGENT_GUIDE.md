# 🤖 AI Agent Quick Start: Fortistate Cosmogenesis

This document is for AI agents joining the Fortistate Cosmogenesis project. It provides context, architecture, and next steps.

---

## 📍 Current Status (Phase 1 Complete)

**Version**: 2.0.0-alpha (Phase 1)  
**Rating**: 5.0/10 → Target: 9.9/10  
**Completed**: Temporal foundation & algebra primitives

### What Exists Now

#### Core Modules (`src/`)
```
temporal/
  ├── causalEvent.ts       # Event sourcing primitives
  └── causalStore.ts       # Time-traveling state stores

algebra/
  ├── entropy.ts           # Complexity measurement
  └── substrate.ts         # Existence constraints (laws)

cosmogenesis/              # [EMPTY - READY FOR PHASE 3]
```

#### Key Capabilities
- ✅ Causal event recording (UUID + high-precision timestamps)
- ✅ Time travel queries (`at()`, `between()`, `query()`)
- ✅ Universe branching & merging
- ✅ Entropy/complexity metrics
- ✅ Constraint validation & auto-repair

---

## 🎯 Your Mission (Phase 2: Months 3-4)

Build the **Multiversal Inspector** — a UI for navigating time and causality.

### Epic 2: Deliverables

#### 1. Interactive Timeline UI
**File**: `src/inspector/timeline.ts` + `src/inspector/components/Timeline.tsx`

**Requirements**:
- Scrubber control (drag to navigate time)
- Zoom in/out (1s → 1h → 1d)
- Event markers (color-coded by type)
- Branch points visualization
- Playback controls (play/pause/speed)

**Tech Stack**:
- React 19
- D3.js or Recharts for visualization
- WebSocket for real-time updates

**Example API**:
```typescript
interface TimelineView {
  root: TimelineNode
  activeUniverse: UniverseId
  scrubberPosition: number
  
  seekTo(timestamp: number): void
  showParallel(universeIds: UniverseId[]): void
  diffBranches(a: UniverseId, b: UniverseId): StateDiff[]
}
```

#### 2. 3D Causal Graph Visualization
**File**: `src/inspector/causalMap.tsx`

**Requirements**:
- Force-directed graph layout
- Nodes = events, edges = causality
- Interactive: click node → show details
- Color code by universe
- Support 1000+ nodes without lag

**Tech Stack**:
- React Three Fiber (R3F) or D3-force-3d
- WebGL for rendering
- Octree for spatial indexing

**Example**:
```typescript
function CausalMapViewer({ store }: { store: CausalStore<any> }) {
  const graph = useMemo(() => {
    return {
      nodes: store.history.map(e => ({ id: e.id, event: e })),
      edges: store.history.flatMap(e => 
        e.causedBy.map(parent => ({ source: parent, target: e.id }))
      )
    }
  }, [store.history])
  
  return <ForceGraph3D graphData={graph} />
}
```

#### 3. Branch Diff & Merge UI
**File**: `src/inspector/branchMerge.tsx`

**Requirements**:
- Side-by-side comparison of universes
- Highlight conflicting states
- Drag-and-drop merge
- Strategy selector (ours/theirs/manual)

#### 4. Story Mode (LLM Narrator)
**File**: `src/inspector/narrator.ts`

**Requirements**:
- Generate natural language explanations of causality
- Example: "When the user clicked 'Add to Cart', this triggered..."
- Use GPT-4 API (or local Llama)
- Cache narratives (expensive)

**API**:
```typescript
async function narrateCausality(
  store: CausalStore<any>,
  options?: { style: 'technical' | 'storytelling' | 'debug' }
): Promise<CausalNarrative> {
  // Call GPT-4 with causal chain context
}
```

---

## 🏗️ Architecture Patterns to Follow

### 1. Lazy Computation
- Don't rebuild causal graph on every change
- Cache aggressively, invalidate on mutation
- Use `useMemo()` in React components

### 2. Pagination & Virtualization
- Inspector must handle 10k+ events
- Use windowing (react-window, react-virtualized)
- Lazy-load event details on demand

### 3. WebSocket Streaming
- Real-time updates from inspector server
- Use existing WebSocket in `src/inspector.ts`
- Protocol: JSON messages `{ type: 'event', payload: CausalEvent }`

### 4. Separation of Concerns
```
src/inspector/
  ├── server/           # WebSocket server, HTTP endpoints
  ├── client/           # React UI components
  ├── shared/           # Types, utilities
  └── api/              # Client-server protocol
```

---

## 🔧 Development Workflow

### Setup
```bash
cd fortistate
npm install
npm run build         # Compile TypeScript
npm run dev          # Watch mode
```

### Running Inspector
```bash
npm run inspect       # Start inspector on port 4000
```

### Testing
```bash
npm test              # Vitest
npm run test:watch    # Watch mode
```

### Demos
```bash
node examples/temporal-demo/time-travel-counter.mjs
node examples/temporal-demo/branching-universes.mjs
```

---

## 📚 Key Files to Study

### Must Read
1. `COSMOGENESIS_ROADMAP.md` — Full vision & roadmap
2. `PHASE_1_COMPLETE.md` — What's already built
3. `src/temporal/causalStore.ts` — Core temporal API
4. `src/inspector.ts` — Existing inspector server

### Reference
- `src/storeFactory.ts` — Base Store<T> implementation
- `examples/my-nextjs-app/` — Real-world integration
- `docs/TEMPORAL_MIGRATION.md` — How users will upgrade

---

## 🎨 UI/UX Design Principles

### Inspector Should Be...
1. **Fast** — 60fps rendering, <100ms interactions
2. **Intuitive** — No manual required
3. **Beautiful** — Inspiring, not utilitarian
4. **Powerful** — Surface advanced features progressively

### Inspiration
- Redux DevTools (but 10x better)
- VS Code Timeline view
- Git graph visualizers (GitKraken, Tower)
- Figma's multiplayer cursor system

---

## 🚨 Known Challenges & Solutions

### Challenge 1: Performance with Large Graphs
**Problem**: 10k+ events → slow graph rendering  
**Solution**: 
- Use WebGL (not SVG)
- Implement LOD (level of detail)
- Virtualize offscreen nodes

### Challenge 2: Merge Conflicts
**Problem**: Manual conflict resolution is hard  
**Solution**:
- Phase 2: Simple UI for manual resolution
- Phase 4: CRDT auto-merge (deferred)

### Challenge 3: Story Mode Cost
**Problem**: GPT-4 API is expensive  
**Solution**:
- Cache narratives by event hash
- Batch requests (narrate multiple events at once)
- Offer local Llama option

---

## ✅ Definition of Done (Phase 2)

- [ ] Timeline UI: Scrubber, zoom, playback controls
- [ ] Causal graph: 3D visualization, interactive
- [ ] Branch diff: Side-by-side comparison, drag-to-merge
- [ ] Story mode: LLM-generated narratives
- [ ] Tests: Unit tests for timeline logic
- [ ] Docs: Inspector user guide
- [ ] Demo: Video showcasing all features

**Success Metric**: Devs say "This is the best debugging tool I've ever used"

---

## 🤝 Collaboration Tips

### For AI Agents
1. **Read the roadmap first** — Understand the big picture
2. **Check existing code** — Don't reinvent wheels
3. **Follow TypeScript conventions** — Strong types, JSDoc comments
4. **Write tests** — Vitest for unit tests
5. **Update docs** — Keep README in sync

### Git Workflow
```bash
git checkout -b phase-2/timeline-ui
# Make changes
npm run build && npm test
git commit -m "feat: add timeline scrubber component"
git push origin phase-2/timeline-ui
# Create PR
```

---

## 📞 Getting Unstuck

### If You're Stuck on...
- **Architecture**: Re-read `COSMOGENESIS_ROADMAP.md` Epic 2
- **TypeScript errors**: Check `src/temporal/*.ts` for patterns
- **Performance**: Use Chrome DevTools Performance tab
- **UI design**: See "Inspiration" section above

### Ask for Help
- GitHub Discussions (coming soon)
- Check `examples/` for working code
- Read existing test files for patterns

---

## 🌟 The Vision (Remember Why)

> "We're not building a state manager. We're building the **substrate of possibility** — a framework for defining and exploring digital realities. The inspector is the lens through which developers will see their universes."

**Your work in Phase 2 makes this vision tangible.**

Good luck, and welcome to the team! 🚀🌌

---

**Last Updated**: ${new Date().toISOString()}  
**Phase**: 2 (Multiversal Inspector)  
**Status**: 🟡 In Progress  
**Previous Phase**: [Phase 1 Complete](./PHASE_1_COMPLETE.md)
