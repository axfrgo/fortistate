/**
 * ═══════════════════════════════════════════════════════════════
 *  TIMELINE COMPONENT - Interactive Temporal Navigator
 * ═══════════════════════════════════════════════════════════════
 * 
 * Phase 2: Multiversal Inspector
 * 
 * The Timeline is the primary interface for navigating through time in
 * the causal graph. Think of it as a "video player for state changes".
 * 
 * Features:
 * - Horizontal timeline with event markers
 * - Playback controls (play, pause, step forward/backward)
 * - Speed control (0.5x, 1x, 2x, 4x)
 * - Scrubber for direct time travel
 * - Zoom controls for different time scales
 * - Hover tooltips showing event details
 * - Multi-universe support (show all branches)
 * 
 * @module timeline
 */

import type { CausalEvent, EventId, UniverseId } from '../temporal/causalEvent.js';
import type { CausalStore } from '../temporal/causalStore.js';

/**
 * Timeline state management
 */
export interface TimelineState {
  /** Current playback position (timestamp) */
  currentTime: number;
  
  /** Is timeline playing? */
  isPlaying: boolean;
  
  /** Playback speed multiplier */
  speed: 0.5 | 1 | 2 | 4;
  
  /** Visible time range [start, end] */
  viewport: [number, number];
  
  /** Current universe being viewed */
  currentUniverse: UniverseId;
  
  /** All available universes */
  universes: UniverseId[];
  
  /** Events in current viewport */
  visibleEvents: CausalEvent<any>[];
  
  /** Currently selected/hovered event */
  selectedEventId?: EventId;
}

/**
 * Timeline configuration
 */
export interface TimelineConfig {
  /** Auto-play on load? */
  autoPlay?: boolean;
  
  /** Default playback speed */
  defaultSpeed?: 0.5 | 1 | 2 | 4;
  
  /** Show all universes or just current? */
  showAllBranches?: boolean;
  
  /** Callback when time changes */
  onTimeChange?: (timestamp: number) => void;
  
  /** Callback when event is selected */
  onEventSelect?: (eventId: EventId) => void;
  
  /** Callback when universe changes */
  onUniverseChange?: (universeId: UniverseId) => void;
}

/**
 * Timeline control commands
 */
export type TimelineCommand = 
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'step-forward' }
  | { type: 'step-backward' }
  | { type: 'seek'; timestamp: number }
  | { type: 'set-speed'; speed: 0.5 | 1 | 2 | 4 }
  | { type: 'zoom-in' }
  | { type: 'zoom-out' }
  | { type: 'fit-all' }
  | { type: 'select-event'; eventId: EventId }
  | { type: 'switch-universe'; universeId: UniverseId };

/**
 * Timeline event marker for rendering
 */
export interface TimelineMarker {
  eventId: EventId;
  timestamp: number;
  universeId: UniverseId;
  type: string;
  label: string;
  color: string;
  x: number; // Pixel position in viewport
}

/**
 * Create a timeline controller for a causal store
 * 
 * @example
 * ```typescript
 * const store = createCausalStore('counter', { value: 0 });
 * const timeline = createTimeline(store, {
 *   autoPlay: false,
 *   defaultSpeed: 1,
 *   onTimeChange: (time) => console.log('Time:', new Date(time)),
 * });
 * 
 * // Start playback
 * timeline.dispatch({ type: 'play' });
 * 
 * // Jump to specific time
 * timeline.dispatch({ type: 'seek', timestamp: Date.now() - 60000 });
 * 
 * // Step through events
 * timeline.dispatch({ type: 'step-forward' });
 * ```
 */
export function createTimeline<T>(
  store: CausalStore<T>,
  config: TimelineConfig = {}
) {
  // Initialize state
  const history = store.history;
  const startTime = history[0]?.timestamp || Date.now();
  const endTime = history[history.length - 1]?.timestamp || Date.now();
  
  const state: TimelineState = {
    currentTime: startTime,
    isPlaying: config.autoPlay || false,
    speed: config.defaultSpeed || 1,
    viewport: [startTime, endTime],
    currentUniverse: store.currentUniverse,
    universes: [store.currentUniverse],
    visibleEvents: history,
    selectedEventId: undefined,
  };

  // Playback animation frame ID
  let animationFrameId: number | null = null;
  let lastFrameTime = 0;

  /**
   * Update visible events based on viewport
   */
  function updateVisibleEvents() {
    const [start, end] = state.viewport;
    
    if (config.showAllBranches) {
      // Show events from all universes
      const allEvents = store.causalGraph.events;
      state.visibleEvents = Array.from(allEvents.values()).filter(
        (e: CausalEvent<any>) => e.timestamp >= start && e.timestamp <= end
      );
    } else {
      // Show only current universe
      state.visibleEvents = store.history.filter(
        (e: CausalEvent<any>) => e.timestamp >= start && e.timestamp <= end
      );
    }

    // Update universe list
    const universeSet = new Set<UniverseId>();
    for (const event of state.visibleEvents) {
      universeSet.add(event.universeId);
    }
    state.universes = Array.from(universeSet);
  }

  /**
   * Render timeline markers for UI
   */
  function getMarkers(width: number): TimelineMarker[] {
    const [start, end] = state.viewport;
    const timeRange = end - start;
    
    return state.visibleEvents.map(event => {
      const normalizedTime = (event.timestamp - start) / timeRange;
      const x = normalizedTime * width;
      
      return {
        eventId: event.id,
        timestamp: event.timestamp,
        universeId: event.universeId,
        type: event.type,
        label: formatEventLabel(event),
        color: getUniverseColor(event.universeId),
        x,
      };
    });
  }

  /**
   * Format event for display
   */
  function formatEventLabel(event: CausalEvent<any>): string {
    const time = new Date(event.timestamp).toLocaleTimeString();
    const storeKey = event.storeKey;
    const type = event.type;
    return `${time} - ${storeKey}.${type}`;
  }

  /**
   * Get color for universe (for visual distinction)
   */
  function getUniverseColor(universeId: UniverseId): string {
    const hash = universeId.split('').reduce((acc: number, char: string) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  }

  /**
   * Playback animation loop
   */
  function playbackLoop(timestamp: number) {
    if (!state.isPlaying) return;

    if (lastFrameTime === 0) {
      lastFrameTime = timestamp;
    }

    const delta = timestamp - lastFrameTime;
    lastFrameTime = timestamp;

    // Advance time based on speed
    const timeAdvance = delta * state.speed;
    state.currentTime += timeAdvance;

    // Loop back to start if we reach the end
    if (state.currentTime > state.viewport[1]) {
      state.currentTime = state.viewport[0];
    }

    // Notify listeners
    config.onTimeChange?.(state.currentTime);

    // Continue animation
    animationFrameId = requestAnimationFrame(playbackLoop);
  }

  /**
   * Start playback
   */
  function play() {
    if (state.isPlaying) return;
    
    state.isPlaying = true;
    lastFrameTime = 0;
    
    // Use requestAnimationFrame for smooth animation in browser
    // For Node.js environments, use setInterval instead
    if (typeof requestAnimationFrame !== 'undefined') {
      animationFrameId = requestAnimationFrame(playbackLoop);
    } else {
      // Node.js fallback (for testing)
      const interval = setInterval(() => {
        if (!state.isPlaying) {
          clearInterval(interval);
          return;
        }
        const now = Date.now();
        playbackLoop(now);
      }, 16); // ~60fps
    }
  }

  /**
   * Pause playback
   */
  function pause() {
    state.isPlaying = false;
    if (animationFrameId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  /**
   * Step to next event
   */
  function stepForward() {
    const nextEvents = state.visibleEvents.filter(
      e => e.timestamp > state.currentTime
    );
    
    if (nextEvents.length > 0) {
      // Sort by timestamp and take the nearest
      nextEvents.sort((a, b) => a.timestamp - b.timestamp);
      state.currentTime = nextEvents[0].timestamp;
      config.onTimeChange?.(state.currentTime);
    }
  }

  /**
   * Step to previous event
   */
  function stepBackward() {
    const prevEvents = state.visibleEvents.filter(
      e => e.timestamp < state.currentTime
    );
    
    if (prevEvents.length > 0) {
      // Sort by timestamp descending and take the nearest
      prevEvents.sort((a, b) => b.timestamp - a.timestamp);
      state.currentTime = prevEvents[0].timestamp;
      config.onTimeChange?.(state.currentTime);
    }
  }

  /**
   * Seek to specific timestamp
   */
  function seek(timestamp: number) {
    const [start, end] = state.viewport;
    state.currentTime = Math.max(start, Math.min(end, timestamp));
    config.onTimeChange?.(state.currentTime);
  }

  /**
   * Zoom in (halve time range)
   */
  function zoomIn() {
    const [start, end] = state.viewport;
    const center = state.currentTime;
    const range = end - start;
    const newRange = range / 2;
    
    state.viewport = [
      Math.max(start, center - newRange / 2),
      Math.min(end, center + newRange / 2),
    ];
    
    updateVisibleEvents();
  }

  /**
   * Zoom out (double time range)
   */
  function zoomOut() {
    const history = store.history;
    const absoluteStart = history[0]?.timestamp || Date.now();
    const absoluteEnd = history[history.length - 1]?.timestamp || Date.now();
    
    const [start, end] = state.viewport;
    const center = state.currentTime;
    const range = end - start;
    const newRange = range * 2;
    
    state.viewport = [
      Math.max(absoluteStart, center - newRange / 2),
      Math.min(absoluteEnd, center + newRange / 2),
    ];
    
    updateVisibleEvents();
  }

  /**
   * Fit entire timeline in view
   */
  function fitAll() {
    const history = store.history;
    const start = history[0]?.timestamp || Date.now();
    const end = history[history.length - 1]?.timestamp || Date.now();
    
    state.viewport = [start, end];
    updateVisibleEvents();
  }

  /**
   * Dispatch timeline command
   */
  function dispatch(command: TimelineCommand) {
    switch (command.type) {
      case 'play':
        play();
        break;
      
      case 'pause':
        pause();
        break;
      
      case 'step-forward':
        stepForward();
        break;
      
      case 'step-backward':
        stepBackward();
        break;
      
      case 'seek':
        seek(command.timestamp);
        break;
      
      case 'set-speed':
        state.speed = command.speed;
        break;
      
      case 'zoom-in':
        zoomIn();
        break;
      
      case 'zoom-out':
        zoomOut();
        break;
      
      case 'fit-all':
        fitAll();
        break;
      
      case 'select-event':
        state.selectedEventId = command.eventId;
        config.onEventSelect?.(command.eventId);
        break;
      
      case 'switch-universe':
        state.currentUniverse = command.universeId;
        config.onUniverseChange?.(command.universeId);
        updateVisibleEvents();
        break;
    }
  }

  /**
   * Get current state snapshot
   */
  function getState(): Readonly<TimelineState> {
    return { ...state };
  }

  /**
   * Cleanup resources
   */
  function destroy() {
    pause();
  }

  // Initialize
  updateVisibleEvents();

  // Return timeline API
  return {
    dispatch,
    getState,
    getMarkers,
    destroy,
    
    // Convenience getters
    get currentTime() { return state.currentTime; },
    get isPlaying() { return state.isPlaying; },
    get speed() { return state.speed; },
    get viewport() { return state.viewport; },
  };
}

/**
 * Type guard for timeline controller
 */
export function isTimeline(obj: any): obj is ReturnType<typeof createTimeline> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.dispatch === 'function' &&
    typeof obj.getState === 'function' &&
    typeof obj.getMarkers === 'function'
  );
}

/**
 * Export all types
 */
export type TimelineController = ReturnType<typeof createTimeline>;
