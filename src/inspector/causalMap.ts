/**
 * ═══════════════════════════════════════════════════════════════
 *  CAUSAL MAP - 3D Graph Visualization
 * ═══════════════════════════════════════════════════════════════
 * 
 * Phase 2: Multiversal Inspector
 * 
 * The Causal Map renders the causal graph in 3D space, making causality
 * relationships visually navigable. Think "Git graph visualization" but
 * for state events in a 3D cosmos.
 * 
 * Visual Design:
 * - **Nodes**: Spheres representing events
 *   - Size based on entropy/complexity
 *   - Color based on universe
 *   - Glow effect for recent events
 * 
 * - **Edges**: Arrows showing causality
 *   - Curved paths following causal flow
 *   - Animated particles flowing along edges
 *   - Thicker lines for high-influence paths
 * 
 * - **Universes**: Each branch occupies a "layer" in 3D space
 *   - Main universe at center
 *   - Branches spread outward radially
 *   - Fork points show divergence clearly
 * 
 * Interactions:
 * - Click node → inspect event details
 * - Drag to rotate camera
 * - Scroll to zoom
 * - Double-click → time travel to that event
 * - Hover → show causality chains highlighted
 * 
 * @module causalMap
 */

import type { CausalGraph, CausalEvent, EventId, UniverseId } from '../temporal/causalEvent.js';

/**
 * 3D position in space
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Node in the 3D graph
 */
export interface GraphNode {
  id: EventId;
  event: CausalEvent<any>;
  position: Vector3;
  radius: number;
  color: string;
  universeId: UniverseId;
  label: string;
}

/**
 * Edge connecting two nodes
 */
export interface GraphEdge {
  from: EventId;
  to: EventId;
  curve: Vector3[]; // Bezier control points
  thickness: number;
  color: string;
}

/**
 * Universe layer in 3D space
 */
export interface UniverseLayer {
  id: UniverseId;
  name: string;
  centerY: number; // Y-axis position
  color: string;
  nodeCount: number;
}

/**
 * Camera configuration
 */
export interface CameraConfig {
  position: Vector3;
  target: Vector3;
  fov: number;
  near: number;
  far: number;
}

/**
 * Causal map layout configuration
 */
export interface LayoutConfig {
  /** Layout algorithm */
  algorithm: 'force-directed' | 'hierarchical' | 'radial';
  
  /** Spacing between nodes */
  nodeSpacing: number;
  
  /** Vertical spacing between universe layers */
  layerSpacing: number;
  
  /** Node size range [min, max] */
  nodeSizeRange: [number, number];
  
  /** Edge curve amount (0 = straight, 1 = very curved) */
  edgeCurvature: number;
  
  /** Show ancestor highlighting? */
  highlightAncestors: boolean;
  
  /** Show descendant highlighting? */
  highlightDescendants: boolean;
  
  /** Animate layout transitions? */
  animateLayout: boolean;
}

/**
 * Interaction event
 */
export type GraphInteraction =
  | { type: 'node-click'; nodeId: EventId }
  | { type: 'node-hover'; nodeId: EventId }
  | { type: 'node-double-click'; nodeId: EventId }
  | { type: 'edge-click'; fromId: EventId; toId: EventId }
  | { type: 'background-click' }
  | { type: 'camera-move'; position: Vector3; target: Vector3 };

/**
 * Causal map state
 */
export interface CausalMapState {
  nodes: Map<EventId, GraphNode>;
  edges: GraphEdge[];
  universes: Map<UniverseId, UniverseLayer>;
  camera: CameraConfig;
  selectedNodeId?: EventId;
  hoveredNodeId?: EventId;
  highlightedNodes: Set<EventId>;
}

/**
 * Calculate 3D layout for causal graph
 * 
 * @param graph - The causal graph to visualize
 * @param config - Layout configuration
 * @returns 3D positioned nodes and edges
 */
export function calculateLayout(
  graph: CausalGraph,
  config: Partial<LayoutConfig> = {}
): { nodes: Map<EventId, GraphNode>; edges: GraphEdge[]; universes: Map<UniverseId, UniverseLayer> } {
  const layoutConfig: LayoutConfig = {
    algorithm: config.algorithm || 'hierarchical',
    nodeSpacing: config.nodeSpacing || 50,
    layerSpacing: config.layerSpacing || 100,
    nodeSizeRange: config.nodeSizeRange || [5, 20],
    edgeCurvature: config.edgeCurvature || 0.3,
    highlightAncestors: config.highlightAncestors !== false,
    highlightDescendants: config.highlightDescendants !== false,
    animateLayout: config.animateLayout !== false,
  };

  // Organize events by universe
  const eventsByUniverse = new Map<UniverseId, CausalEvent<any>[]>();
  for (const [_, event] of graph.events) {
    if (!eventsByUniverse.has(event.universeId)) {
      eventsByUniverse.set(event.universeId, []);
    }
    eventsByUniverse.get(event.universeId)!.push(event);
  }

  // Create universe layers
  const universes = new Map<UniverseId, UniverseLayer>();
  let layerIndex = 0;
  for (const [universeId, events] of eventsByUniverse) {
    const color = getUniverseColor(universeId);
    universes.set(universeId, {
      id: universeId,
      name: getUniverseName(universeId),
      centerY: layerIndex * layoutConfig.layerSpacing,
      color,
      nodeCount: events.length,
    });
    layerIndex++;
  }

  // Position nodes based on algorithm
  const nodes = new Map<EventId, GraphNode>();
  
  switch (layoutConfig.algorithm) {
    case 'hierarchical':
      positionHierarchical(graph, nodes, universes, layoutConfig);
      break;
    case 'force-directed':
      positionForceDirected(graph, nodes, universes, layoutConfig);
      break;
    case 'radial':
      positionRadial(graph, nodes, universes, layoutConfig);
      break;
  }

  // Create edges with bezier curves
  const edges: GraphEdge[] = [];
  for (const [eventId, event] of graph.events) {
    const toNode = nodes.get(eventId);
    if (!toNode) continue;

    for (const parentId of event.causedBy) {
      const fromNode = nodes.get(parentId);
      if (!fromNode) continue;

      const curve = createBezierCurve(
        fromNode.position,
        toNode.position,
        layoutConfig.edgeCurvature
      );

      edges.push({
        from: parentId,
        to: eventId,
        curve,
        thickness: 2,
        color: fromNode.color,
      });
    }
  }

  return { nodes, edges, universes };
}

/**
 * Hierarchical layout (time flows left-to-right, events at their time positions)
 */
function positionHierarchical(
  graph: CausalGraph,
  nodes: Map<EventId, GraphNode>,
  universes: Map<UniverseId, UniverseLayer>,
  config: LayoutConfig
): void {
  // Sort events by timestamp
  const sortedEvents = Array.from(graph.events.values()).sort(
    (a, b) => a.timestamp - b.timestamp
  );

  const minTime = sortedEvents[0]?.timestamp || 0;
  const maxTime = sortedEvents[sortedEvents.length - 1]?.timestamp || 0;
  const timeRange = maxTime - minTime || 1;

  // Track how many nodes at each time slice for vertical distribution
  const nodesAtTime = new Map<number, number>();

  for (const event of sortedEvents) {
    const normalizedTime = (event.timestamp - minTime) / timeRange;
    const x = normalizedTime * config.nodeSpacing * sortedEvents.length;

    // Y position based on universe layer
    const layer = universes.get(event.universeId);
    const y = layer?.centerY || 0;

    // Z position varies within layer to avoid overlap
    const timeKey = Math.floor(x / config.nodeSpacing);
    const countAtTime = nodesAtTime.get(timeKey) || 0;
    nodesAtTime.set(timeKey, countAtTime + 1);
    const z = (countAtTime - 5) * (config.nodeSpacing / 3);

    nodes.set(event.id, {
      id: event.id,
      event,
      position: { x, y, z },
      radius: config.nodeSizeRange[0],
      color: layer?.color || '#888888',
      universeId: event.universeId,
      label: formatEventLabel(event),
    });
  }
}

/**
 * Force-directed layout (physics simulation)
 */
function positionForceDirected(
  graph: CausalGraph,
  nodes: Map<EventId, GraphNode>,
  universes: Map<UniverseId, UniverseLayer>,
  config: LayoutConfig
): void {
  // Initialize nodes at random positions
  const events = Array.from(graph.events.values());
  for (const event of events) {
    const layer = universes.get(event.universeId);
    nodes.set(event.id, {
      id: event.id,
      event,
      position: {
        x: Math.random() * 500 - 250,
        y: layer?.centerY || 0,
        z: Math.random() * 500 - 250,
      },
      radius: config.nodeSizeRange[0],
      color: layer?.color || '#888888',
      universeId: event.universeId,
      label: formatEventLabel(event),
    });
  }

  // Run force simulation (simplified version)
  const iterations = 100;
  const repulsion = config.nodeSpacing * 2;
  const attraction = config.nodeSpacing / 2;

  for (let i = 0; i < iterations; i++) {
    const forces = new Map<EventId, Vector3>();

    // Initialize forces
    for (const nodeId of nodes.keys()) {
      forces.set(nodeId, { x: 0, y: 0, z: 0 });
    }

    // Repulsion between all nodes
    const nodeArray = Array.from(nodes.values());
    for (let j = 0; j < nodeArray.length; j++) {
      for (let k = j + 1; k < nodeArray.length; k++) {
        const n1 = nodeArray[j];
        const n2 = nodeArray[k];
        
        const dx = n2.position.x - n1.position.x;
        const dy = n2.position.y - n1.position.y;
        const dz = n2.position.z - n1.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

        const force = (repulsion * repulsion) / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        const fz = (dz / dist) * force;

        const f1 = forces.get(n1.id)!;
        const f2 = forces.get(n2.id)!;
        
        f1.x -= fx; f1.y -= fy; f1.z -= fz;
        f2.x += fx; f2.y += fy; f2.z += fz;
      }
    }

    // Attraction along edges
    for (const [eventId, event] of graph.events) {
      const toNode = nodes.get(eventId)!;
      const toForce = forces.get(eventId)!;

      for (const parentId of event.causedBy) {
        const fromNode = nodes.get(parentId);
        if (!fromNode) continue;

        const dx = fromNode.position.x - toNode.position.x;
        const dy = fromNode.position.y - toNode.position.y;
        const dz = fromNode.position.z - toNode.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

        const force = dist / attraction;
        toForce.x += (dx / dist) * force;
        toForce.y += (dy / dist) * force;
        toForce.z += (dz / dist) * force;
      }
    }

    // Apply forces
    const damping = 0.5;
    for (const [nodeId, node] of nodes) {
      const force = forces.get(nodeId)!;
      node.position.x += force.x * damping;
      node.position.y += force.y * damping;
      node.position.z += force.z * damping;

      // Keep nodes near their universe layer
      const layer = universes.get(node.universeId);
      if (layer) {
        node.position.y = node.position.y * 0.9 + layer.centerY * 0.1;
      }
    }
  }
}

/**
 * Radial layout (circular/spiral arrangement)
 */
function positionRadial(
  graph: CausalGraph,
  nodes: Map<EventId, GraphNode>,
  universes: Map<UniverseId, UniverseLayer>,
  config: LayoutConfig
): void {
  const sortedEvents = Array.from(graph.events.values()).sort(
    (a, b) => a.timestamp - b.timestamp
  );

  let angle = 0;
  const angleStep = (Math.PI * 2) / sortedEvents.length;
  let radius = config.nodeSpacing;

  for (const event of sortedEvents) {
    const layer = universes.get(event.universeId);
    
    const x = Math.cos(angle) * radius;
    const y = layer?.centerY || 0;
    const z = Math.sin(angle) * radius;

    nodes.set(event.id, {
      id: event.id,
      event,
      position: { x, y, z },
      radius: config.nodeSizeRange[0],
      color: layer?.color || '#888888',
      universeId: event.universeId,
      label: formatEventLabel(event),
    });

    angle += angleStep;
    // Spiral outward slowly
    radius += config.nodeSpacing / sortedEvents.length;
  }
}

/**
 * Create bezier curve for edge
 */
function createBezierCurve(from: Vector3, to: Vector3, curvature: number): Vector3[] {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const midZ = (from.z + to.z) / 2;

  // Control point perpendicular to the line
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  const perpX = -dz;
  const perpZ = dx;
  const len = Math.sqrt(perpX * perpX + perpZ * perpZ) || 1;

  const offsetX = (perpX / len) * dist * curvature;
  const offsetY = dist * curvature * 0.5;
  const offsetZ = (perpZ / len) * dist * curvature;

  return [
    from,
    { x: midX + offsetX, y: midY + offsetY, z: midZ + offsetZ },
    to,
  ];
}

/**
 * Format event for display
 */
function formatEventLabel(event: CausalEvent<any>): string {
  return `${event.storeKey}.${event.type}`;
}

/**
 * Get color for universe
 */
function getUniverseColor(universeId: UniverseId): string {
  if (universeId === 'universe-main') return '#00d4ff'; // Cyan for main

  const hash = universeId.split('').reduce((acc: number, char: string) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 80%, 60%)`;
}

/**
 * Get universe name
 */
function getUniverseName(universeId: UniverseId): string {
  if (universeId === 'universe-main') return 'Main Universe';
  
  // Extract name from universe-{name}-{timestamp} format
  const parts = universeId.split('-');
  if (parts.length >= 2) {
    return parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
  }
  
  return universeId;
}

/**
 * Create causal map visualization controller
 * 
 * @example
 * ```typescript
 * const store = createCausalStore('counter', { value: 0 });
 * const map = createCausalMap(store.causalGraph, {
 *   algorithm: 'hierarchical',
 *   nodeSpacing: 75,
 *   onNodeClick: (nodeId) => console.log('Clicked:', nodeId),
 * });
 * 
 * // Get nodes and edges for rendering
 * const { nodes, edges, universes } = map.getLayout();
 * ```
 */
export function createCausalMap(
  graph: CausalGraph,
  config: Partial<LayoutConfig> & {
    onNodeClick?: (nodeId: EventId) => void;
    onNodeHover?: (nodeId: EventId) => void;
    onNodeDoubleClick?: (nodeId: EventId) => void;
  } = {}
) {
  // Calculate initial layout
  const { nodes, edges, universes } = calculateLayout(graph, config);

  const state: CausalMapState = {
    nodes,
    edges,
    universes,
    camera: {
      position: { x: 0, y: 100, z: 500 },
      target: { x: 0, y: 0, z: 0 },
      fov: 60,
      near: 0.1,
      far: 10000,
    },
    highlightedNodes: new Set(),
  };

  /**
   * Handle interactions
   */
  function handleInteraction(interaction: GraphInteraction) {
    switch (interaction.type) {
      case 'node-click':
        state.selectedNodeId = interaction.nodeId;
        config.onNodeClick?.(interaction.nodeId);
        break;

      case 'node-hover':
        state.hoveredNodeId = interaction.nodeId;
        config.onNodeHover?.(interaction.nodeId);
        
        // Highlight ancestors/descendants if configured
        if (config.highlightAncestors || config.highlightDescendants) {
          state.highlightedNodes.clear();
          const node = state.nodes.get(interaction.nodeId);
          if (node) {
            // TODO: Implement ancestor/descendant highlighting
            // This would use findAncestors/findDescendants from causalEvent
          }
        }
        break;

      case 'node-double-click':
        config.onNodeDoubleClick?.(interaction.nodeId);
        break;

      case 'camera-move':
        state.camera.position = interaction.position;
        state.camera.target = interaction.target;
        break;

      case 'background-click':
        state.selectedNodeId = undefined;
        state.highlightedNodes.clear();
        break;
    }
  }

  /**
   * Get current layout
   */
  function getLayout() {
    return {
      nodes: state.nodes,
      edges: state.edges,
      universes: state.universes,
    };
  }

  /**
   * Get current state
   */
  function getState(): Readonly<CausalMapState> {
    return { ...state };
  }

  /**
   * Recalculate layout with new graph or config
   */
  function updateLayout(newGraph?: CausalGraph, newConfig?: Partial<LayoutConfig>) {
    const targetGraph = newGraph || graph;
    const targetConfig = { ...config, ...newConfig };
    
    const { nodes: newNodes, edges: newEdges, universes: newUniverses } = 
      calculateLayout(targetGraph, targetConfig);

    state.nodes = newNodes;
    state.edges = newEdges;
    state.universes = newUniverses;
  }

  /**
   * Zoom to fit all nodes
   */
  function zoomToFit() {
    // Calculate bounding box
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (const node of state.nodes.values()) {
      minX = Math.min(minX, node.position.x);
      maxX = Math.max(maxX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxY = Math.max(maxY, node.position.y);
      minZ = Math.min(minZ, node.position.z);
      maxZ = Math.max(maxZ, node.position.z);
    }

    // Center camera on bounding box
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;

    const sizeX = maxX - minX;
    const sizeY = maxY - minY;
    const sizeZ = maxZ - minZ;
    const maxSize = Math.max(sizeX, sizeY, sizeZ);

    state.camera.target = { x: centerX, y: centerY, z: centerZ };
    state.camera.position = {
      x: centerX,
      y: centerY + maxSize,
      z: centerZ + maxSize * 1.5,
    };
  }

  return {
    handleInteraction,
    getLayout,
    getState,
    updateLayout,
    zoomToFit,
  };
}

/**
 * Export all types
 */
export type CausalMapController = ReturnType<typeof createCausalMap>;
