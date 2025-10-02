# 🌌 Multiversal Inspector

> **Phase 2 of the Cosmogenesis Roadmap**: Transform state debugging into an immersive, time-traveling, AI-powered experience.

---

## Overview

The **Multiversal Inspector** elevates Fortistate from a simple state manager to a **temporal debugger** with superpowers. Imagine combining Git's time-travel capabilities, Chrome DevTools' inspector, and AI narration into one unified debugging experience.

### What You Can Do

- ⏱️ **Time Travel**: Scrub through your app's history like a video player
- 🌐 **3D Visualization**: See causality as a cosmic graph in 3D space
- 🔀 **Branch Comparison**: Visual diff and merge between universe timelines
- 🤖 **AI Storytelling**: Get natural language explanations of what happened

---

## Components

### 1. Timeline Controller

Interactive temporal navigation for your causal stores.

```typescript
import { createCausalStore, createTimeline } from 'fortistate';

const store = createCausalStore('counter', { value: 0 });

// Create timeline
const timeline = createTimeline(store, {
  autoPlay: false,
  defaultSpeed: 1,
  onTimeChange: (time) => {
    console.log('Current time:', new Date(time));
  },
});

// Control playback
timeline.dispatch({ type: 'play' });
timeline.dispatch({ type: 'pause' });
timeline.dispatch({ type: 'step-forward' });
timeline.dispatch({ type: 'seek', timestamp: Date.now() - 60000 });

// Zoom in/out
timeline.dispatch({ type: 'zoom-in' });
timeline.dispatch({ type: 'fit-all' });

// Get markers for UI rendering
const markers = timeline.getMarkers(800); // 800px width
markers.forEach(marker => {
  console.log(`Event at x=${marker.x}: ${marker.label}`);
});
```

**Features:**
- ▶️ Play/pause/step controls
- 🎛️ Speed control (0.5x, 1x, 2x, 4x)
- 🔍 Zoom in/out on time ranges
- 🎯 Jump to specific events
- 📍 Visual event markers with metadata

**UI Integration:**
```jsx
const TimelineUI = () => {
  const [state, setState] = useState(timeline.getState());
  
  return (
    <div className="timeline">
      <div className="controls">
        <button onClick={() => timeline.dispatch({ type: 'play' })}>▶️</button>
        <button onClick={() => timeline.dispatch({ type: 'pause' })}>⏸️</button>
        <button onClick={() => timeline.dispatch({ type: 'step-backward' })}>⏮️</button>
        <button onClick={() => timeline.dispatch({ type: 'step-forward' })}>⏭️</button>
      </div>
      
      <div className="scrubber">
        {markers.map(marker => (
          <div 
            key={marker.eventId}
            style={{ left: marker.x, background: marker.color }}
            onClick={() => timeline.dispatch({ type: 'select-event', eventId: marker.eventId })}
          />
        ))}
      </div>
    </div>
  );
};
```

---

### 2. Causal Map (3D Graph Visualizer)

Visualize causality in 3D space - see how events flow through time.

```typescript
import { createCausalMap } from 'fortistate';

const store = createCausalStore('app', { count: 0 });
const map = createCausalMap(store.causalGraph, {
  algorithm: 'hierarchical', // or 'force-directed', 'radial'
  nodeSpacing: 75,
  layerSpacing: 100,
  onNodeClick: (nodeId) => {
    console.log('Clicked event:', nodeId);
  },
  onNodeDoubleClick: (nodeId) => {
    // Time travel to this event
    const event = store.causalGraph.events.get(nodeId);
    if (event) {
      console.log('Time traveling to:', event.timestamp);
    }
  },
});

// Get layout for rendering
const { nodes, edges, universes } = map.getLayout();

// Interact
map.handleInteraction({ type: 'node-click', nodeId: 'some-event-id' });
map.zoomToFit();
```

**Layout Algorithms:**

1. **Hierarchical**: Time flows left-to-right, events positioned by timestamp
   - Best for: Linear timelines, debugging sequences
   
2. **Force-Directed**: Physics simulation, causally connected events attract
   - Best for: Understanding relationships, finding clusters
   
3. **Radial**: Spiral arrangement, events radiate outward from origin
   - Best for: Circular patterns, cyclical state changes

**Visual Encoding:**
- **Node Size**: Based on state complexity (entropy)
- **Node Color**: By universe (branch)
- **Edge Thickness**: Based on causal influence strength
- **Edge Animation**: Particles flow along causality direction

**React Three Fiber Integration:**
```jsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

const CausalMapVisualization = ({ map }) => {
  const { nodes, edges } = map.getLayout();
  
  return (
    <Canvas camera={{ position: [0, 100, 500], fov: 60 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      {/* Render nodes */}
      {Array.from(nodes.values()).map(node => (
        <mesh key={node.id} position={[node.position.x, node.position.y, node.position.z]}>
          <sphereGeometry args={[node.radius, 32, 32]} />
          <meshStandardMaterial color={node.color} />
        </mesh>
      ))}
      
      {/* Render edges */}
      {edges.map((edge, i) => (
        <CurvedLine key={i} points={edge.curve} color={edge.color} />
      ))}
      
      <OrbitControls />
    </Canvas>
  );
};
```

---

### 3. Branch Merge Tool

Visual diff and merge between universe branches.

```typescript
import { createBranchMergeSession } from 'fortistate';

const store = createCausalStore('data', { count: 0, name: 'Alice' });

// Create branches
store.set({ count: 1, name: 'Alice' });
const branchA = store.branch('feature-a');
store.set({ count: 10, name: 'Alice' }); // main branch

store.switchBranch(branchA);
store.set({ count: 5, name: 'Bob' }); // feature-a branch

// Start merge session
const session = createBranchMergeSession(store, {
  sourceUniverse: branchA,
  targetUniverse: 'universe-main',
  strategy: 'manual',
  onPreviewUpdate: (preview) => {
    console.log('Conflicts:', preview.conflicts.length);
  },
});

// Preview merge
const preview = session.getPreview();
console.log('Can auto-merge?', preview.canAutoMerge);

// Resolve conflicts
for (const conflict of preview.conflicts) {
  console.log(`Conflict at ${conflict.path.join('.')}:`);
  console.log('  Source:', conflict.sourceValue);
  console.log('  Target:', conflict.targetValue);
  
  session.resolveConflict(conflict.path, {
    strategy: 'accept-target', // or 'accept-source', 'manual'
  });
}

// Execute merge
const result = session.executeMerge();
console.log('Merge success:', result.success);
```

**Diff Types:**
- `unchanged`: Property is same in both branches
- `added`: Property only exists in target
- `removed`: Property only exists in source
- `changed`: Property differs (no conflict)
- `conflict`: Both branches changed from base

**Merge Strategies:**
- `ours`: Always prefer source branch
- `theirs`: Always prefer target branch
- `manual`: User resolves each conflict
- `last-write`: Timestamp wins

**UI Example:**
```jsx
const BranchMergeUI = ({ session }) => {
  const { source, target, preview } = session.getState();
  
  return (
    <div className="merge-ui">
      <div className="branch source">
        <h3>{source.name}</h3>
        <pre>{JSON.stringify(source.lastEvent.value, null, 2)}</pre>
      </div>
      
      <div className="conflicts">
        <h3>Conflicts ({preview.conflicts.length})</h3>
        {preview.conflicts.map((conflict, i) => (
          <div key={i} className="conflict">
            <div className="path">{conflict.path.join('.')}</div>
            <button onClick={() => session.resolveConflict(conflict.path, { strategy: 'accept-source' })}>
              Use Source: {conflict.sourceValue}
            </button>
            <button onClick={() => session.resolveConflict(conflict.path, { strategy: 'accept-target' })}>
              Use Target: {conflict.targetValue}
            </button>
          </div>
        ))}
      </div>
      
      <div className="branch target">
        <h3>{target.name}</h3>
        <pre>{JSON.stringify(target.lastEvent.value, null, 2)}</pre>
      </div>
      
      <button 
        disabled={!preview.canAutoMerge}
        onClick={() => session.executeMerge()}
      >
        Merge
      </button>
    </div>
  );
};
```

---

### 4. AI Narrator (LLM-Powered Storytelling)

Get natural language explanations of what happened in your state.

```typescript
import { createNarrator } from 'fortistate';

const narrator = createNarrator({
  type: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',
});

const store = createCausalStore('counter', { value: 0 });
// ... make changes ...

// Timeline summary
const story = await narrator.narrate(store, {
  type: 'timeline-summary',
  style: 'detective',
});

console.log(story.narrative);
// "Elementary! The counter began at 0. At precisely 14:32:15, our user
//  clicked the increment button thrice in rapid succession. Most curious
//  indeed - a reset occurred at 14:32:18, suggesting someone cleared the
//  evidence. The trail leads to..."
```

**Narration Types:**

1. **Event Chain**: Explain causality from A → B → C
   ```typescript
   await narrator.narrate(store, {
     type: 'event-chain',
     eventIds: ['event-1', 'event-2', 'event-3'],
     style: 'conversational',
   });
   ```

2. **Anomaly Detection**: Explain why event is unusual
   ```typescript
   await narrator.narrate(store, {
     type: 'anomaly',
     eventIds: ['suspicious-event-id'],
     style: 'technical',
   });
   ```

3. **Branch Divergence**: Explain how timelines split
   ```typescript
   await narrator.narrate(store, {
     type: 'branch-divergence',
     eventIds: [forkEventId],
     style: 'formal',
   });
   ```

4. **Root Cause Analysis**: Trace back to origin
   ```typescript
   await narrator.narrate(store, {
     type: 'root-cause',
     timeRange: [startTime, endTime],
     style: 'detective',
   });
   ```

5. **Timeline Summary**: Explain entire history
   ```typescript
   await narrator.narrate(store, {
     type: 'timeline-summary',
     style: 'poetic',
     maxLength: 500,
   });
   ```

**Narration Styles:**
- `technical`: Precise, developer-focused
- `conversational`: Friendly, easy to understand
- `formal`: Documentation-style
- `detective`: Sherlock Holmes debugging
- `poetic`: Creative, metaphorical

**Supported LLM Providers:**
```typescript
// OpenAI
const narrator = createNarrator({
  type: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',
});

// Anthropic Claude
const narrator = createNarrator({
  type: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-sonnet-20240229',
});

// Google Gemini
const narrator = createNarrator({
  type: 'gemini',
  apiKey: process.env.GOOGLE_API_KEY,
  model: 'gemini-pro',
});

// Ollama (local)
const narrator = createNarrator({
  type: 'ollama',
  baseURL: 'http://localhost:11434',
  model: 'llama2',
});

// Custom
const narrator = createNarrator({
  type: 'custom',
  generateFn: async (prompt) => {
    // Your custom LLM integration
    return 'Generated narrative...';
  },
});
```

---

## Complete Example

Here's a full example combining all Phase 2 features:

```typescript
import { 
  createCausalStore, 
  createTimeline, 
  createCausalMap,
  createBranchMergeSession,
  createNarrator,
} from 'fortistate';

// 1. Create store
const store = createCausalStore('shopping-cart', {
  items: [],
  total: 0,
});

// 2. Make some changes
store.set({ items: ['Apple'], total: 1.99 });
store.set({ items: ['Apple', 'Banana'], total: 3.48 });

// Branch for "discount experiment"
const discountBranch = store.branch('discount-experiment');
store.set({ items: ['Apple', 'Banana'], total: 2.99 }); // discount applied

store.switchBranch('universe-main');
store.set({ items: ['Apple', 'Banana', 'Orange'], total: 5.27 });

// 3. Time Travel
const timeline = createTimeline(store, {
  onTimeChange: (time) => {
    const state = store.at(time);
    console.log('State at time:', state);
  },
});

timeline.dispatch({ type: 'play' });
// Watch state evolve in real-time!

// 4. Visualize in 3D
const map = createCausalMap(store.causalGraph, {
  algorithm: 'hierarchical',
  onNodeDoubleClick: (eventId) => {
    // Jump timeline to this event
    const event = store.causalGraph.events.get(eventId);
    if (event) {
      timeline.dispatch({ type: 'seek', timestamp: event.timestamp });
    }
  },
});

// 5. Compare branches
const mergeSession = createBranchMergeSession(store, {
  sourceUniverse: discountBranch,
  targetUniverse: 'universe-main',
  strategy: 'manual',
});

const preview = mergeSession.getPreview();
console.log('Conflicts:', preview.conflicts);

// 6. Get AI explanation
const narrator = createNarrator({
  type: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
});

const story = await narrator.narrate(store, {
  type: 'branch-divergence',
  style: 'detective',
});

console.log(story.narrative);
// "Aha! At 15:42:03, our timeline forked into two parallel universes.
//  In Universe A (main), the customer added an Orange, bringing the
//  total to $5.27. Meanwhile, in Universe B (discount-experiment),
//  a promotional discount reduced the total to $2.99. These divergent
//  paths represent different business outcomes..."
```

---

## API Reference

### Timeline

```typescript
interface TimelineController {
  dispatch(command: TimelineCommand): void;
  getState(): Readonly<TimelineState>;
  getMarkers(width: number): TimelineMarker[];
  destroy(): void;
  
  // Convenience getters
  currentTime: number;
  isPlaying: boolean;
  speed: 0.5 | 1 | 2 | 4;
  viewport: [number, number];
}
```

### Causal Map

```typescript
interface CausalMapController {
  handleInteraction(interaction: GraphInteraction): void;
  getLayout(): { nodes: Map<EventId, GraphNode>; edges: GraphEdge[]; universes: Map<UniverseId, UniverseLayer> };
  getState(): Readonly<CausalMapState>;
  updateLayout(newGraph?: CausalGraph, newConfig?: Partial<LayoutConfig>): void;
  zoomToFit(): void;
}
```

### Branch Merge

```typescript
interface BranchMergeSession {
  resolveConflict(path: string[], resolution: ConflictResolution): void;
  clearResolution(path: string[]): void;
  clearAllResolutions(): void;
  getPreview(): MergePreview<T>;
  executeMerge(): MergeResult<T>;
  getState(): Readonly<MergeSessionState>;
}
```

### Narrator

```typescript
interface Narrator {
  narrate<T>(store: CausalStore<T>, request: NarrationRequest): Promise<NarrationResult>;
}
```

---

## Performance Considerations

- **Timeline**: Lazy event loading, only render visible range
- **Causal Map**: Use LOD (level of detail) for large graphs (>1000 nodes)
- **Branch Merge**: Diff calculation is O(n) where n = state size
- **Narrator**: LLM calls are async, cache narratives for repeated requests

---

## Future Enhancements (Phase 3+)

- 🎮 **VR/AR Inspector**: Explore causality in virtual reality
- 🔊 **Audio Narration**: Text-to-speech for narratives
- 📊 **Metrics Dashboard**: Real-time entropy, complexity, divergence charts
- 🤝 **Collaborative Debugging**: Share timelines with team
- 🎬 **Recording/Playback**: Export sessions as videos
- 🧪 **Hypothesis Testing**: Simulate "what if" scenarios

---

**Phase 2 Status**: ✅ **COMPLETE** (Rating: 3.5 → 7.0)

Next up: **Phase 3 - Constraint Physics Engine** (Rating: 7.0 → 9.0)
