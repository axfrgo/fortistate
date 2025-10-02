/**
 * ═══════════════════════════════════════════════════════════════
 *  NARRATOR - AI-Powered Causality Storyteller
 * ═══════════════════════════════════════════════════════════════
 * 
 * Phase 2: Multiversal Inspector
 * 
 * The Narrator uses Large Language Models to transform dry event logs
 * into compelling narratives that explain *why* your state looks the way it does.
 * 
 * Think "Git blame" but it explains causality in plain English:
 * - "The counter increased because the user clicked '+' 3 times in rapid succession"
 * - "This error occurred because validation failed after the API timeout"
 * - "These two universes diverged when the shopping cart was cleared vs. item added"
 * 
 * Features:
 * - Event chain narration (A caused B which led to C)
 * - Anomaly explanation (why is this event unusual?)
 * - Branch divergence stories (how did these timelines split?)
 * - Debugging assistance (trace back to root cause)
 * - Documentation generation (auto-generate state flow docs)
 * 
 * LLM Integration:
 * - OpenAI GPT-4/GPT-3.5
 * - Anthropic Claude
 * - Google Gemini
 * - Local models via Ollama
 * - Custom endpoints
 * 
 * @module narrator
 */

import type { CausalEvent, EventId, CausalGraph } from '../temporal/causalEvent.js';
import { findAncestors, findDescendants } from '../temporal/causalEvent.js';
import type { CausalStore } from '../temporal/causalStore.js';

/**
 * LLM provider configuration
 */
export type LLMProvider = 
  | { type: 'openai'; apiKey: string; model?: string; baseURL?: string }
  | { type: 'anthropic'; apiKey: string; model?: string }
  | { type: 'gemini'; apiKey: string; model?: string }
  | { type: 'ollama'; baseURL?: string; model?: string }
  | { type: 'custom'; generateFn: (prompt: string) => Promise<string> };

/**
 * Narration style
 */
export type NarrationStyle = 
  | 'technical'      // Precise, developer-focused
  | 'conversational' // Friendly, easy to understand
  | 'formal'         // Documentation-style
  | 'detective'      // Sherlock Holmes debugging style
  | 'poetic';        // Creative, metaphorical

/**
 * Narration request
 */
export interface NarrationRequest {
  /** What to narrate */
  type: 
    | 'event-chain'         // Explain causality from A to B
    | 'anomaly'             // Explain why this event is unusual
    | 'branch-divergence'   // Explain how branches split
    | 'root-cause'          // Find root cause of current state
    | 'timeline-summary';   // Summarize entire timeline
  
  /** Event ID(s) to focus on */
  eventIds?: EventId[];
  
  /** Time range [start, end] */
  timeRange?: [number, number];
  
  /** Narration style */
  style?: NarrationStyle;
  
  /** Max length (characters) */
  maxLength?: number;
  
  /** Include code snippets? */
  includeCode?: boolean;
  
  /** Include timestamps? */
  includeTimestamps?: boolean;
}

/**
 * Narration result
 */
export interface NarrationResult {
  /** Generated narrative */
  narrative: string;
  
  /** Events referenced in narrative */
  referencedEvents: EventId[];
  
  /** Confidence score (0-1) */
  confidence: number;
  
  /** Token usage */
  tokensUsed?: number;
  
  /** Generation time (ms) */
  generationTimeMs: number;
}

/**
 * Create narrator instance
 * 
 * @example
 * ```typescript
 * const narrator = createNarrator({
 *   type: 'openai',
 *   apiKey: process.env.OPENAI_API_KEY,
 *   model: 'gpt-4',
 * });
 * 
 * const store = createCausalStore('counter', { value: 0 });
 * // ... make some changes ...
 * 
 * const story = await narrator.narrate(store, {
 *   type: 'timeline-summary',
 *   style: 'detective',
 * });
 * 
 * console.log(story.narrative);
 * // "Elementary! The counter began at 0, then our user clicked
 * //  the increment button thrice in rapid succession at 14:32:15.
 * //  Most curious indeed - a reset occurred at 14:32:18, suggesting
 * //  a deliberate clearing of evidence..."
 * ```
 */
export function createNarrator(provider: LLMProvider) {
  /**
   * Generate narrative using LLM
   */
  async function generate(prompt: string): Promise<string> {
    switch (provider.type) {
      case 'openai':
        return await generateOpenAI(prompt, provider);
      
      case 'anthropic':
        return await generateAnthropic(prompt, provider);
      
      case 'gemini':
        return await generateGemini(prompt, provider);
      
      case 'ollama':
        return await generateOllama(prompt, provider);
      
      case 'custom':
        return await provider.generateFn(prompt);
    }
  }

  /**
   * Build prompt for narration request
   */
  function buildPrompt(
    graph: CausalGraph,
    events: CausalEvent<any>[],
    request: NarrationRequest
  ): string {
    const style = request.style || 'conversational';
    const styleInstructions = getStyleInstructions(style);

    let prompt = `${styleInstructions}\n\n`;

    switch (request.type) {
      case 'event-chain':
        prompt += buildEventChainPrompt(graph, events);
        break;
      
      case 'anomaly':
        prompt += buildAnomalyPrompt(graph, events);
        break;
      
      case 'branch-divergence':
        prompt += buildBranchDivergencePrompt(graph, events);
        break;
      
      case 'root-cause':
        prompt += buildRootCausePrompt(graph, events);
        break;
      
      case 'timeline-summary':
        prompt += buildTimelineSummaryPrompt(graph, events);
        break;
    }

    if (request.maxLength) {
      prompt += `\n\nKeep your response under ${request.maxLength} characters.`;
    }

    return prompt;
  }

  /**
   * Narrate events from a store
   */
  async function narrate<T>(
    store: CausalStore<T>,
    request: NarrationRequest
  ): Promise<NarrationResult> {
    const startTime = Date.now();
    const graph = store.causalGraph;
    
    // Gather relevant events
    let events: CausalEvent<any>[] = [];
    
    if (request.eventIds && request.eventIds.length > 0) {
      events = request.eventIds
        .map(id => graph.events.get(id))
        .filter((e): e is CausalEvent<any> => e !== undefined);
    } else if (request.timeRange) {
      const [start, end] = request.timeRange;
      events = Array.from(graph.events.values()).filter(
        e => e.timestamp >= start && e.timestamp <= end
      );
    } else {
      // Use all events from current universe
      events = store.history;
    }

    if (events.length === 0) {
      return {
        narrative: 'No events to narrate.',
        referencedEvents: [],
        confidence: 0,
        generationTimeMs: Date.now() - startTime,
      };
    }

    // Build prompt and generate narrative
    const prompt = buildPrompt(graph, events, request);
    const narrative = await generate(prompt);

    // Extract referenced event IDs from narrative
    const referencedEvents = extractReferencedEvents(narrative, events);

    return {
      narrative,
      referencedEvents,
      confidence: 0.85, // TODO: Calculate based on LLM response quality
      generationTimeMs: Date.now() - startTime,
    };
  }

  return {
    narrate,
  };
}

/**
 * Get style instructions for LLM
 */
function getStyleInstructions(style: NarrationStyle): string {
  switch (style) {
    case 'technical':
      return `You are a senior software engineer explaining state changes in a technical but clear manner.
Use precise terminology. Focus on causality and data flow.`;
    
    case 'conversational':
      return `You are a friendly developer explaining state changes to a colleague.
Use natural language. Make it easy to understand without being condescending.`;
    
    case 'formal':
      return `You are writing technical documentation for state transitions.
Use formal, structured language. Include technical details.`;
    
    case 'detective':
      return `You are Sherlock Holmes investigating a mystery in the codebase.
Analyze clues (events), deduce causality, reveal the story with dramatic flair.
Use phrases like "Elementary!", "Most curious...", "The evidence suggests..."`;
    
    case 'poetic':
      return `You are a poet describing the dance of state through time.
Use metaphors and creative language while maintaining accuracy.`;
  }
}

/**
 * Build event chain prompt
 */
function buildEventChainPrompt(graph: CausalGraph, events: CausalEvent<any>[]): string {
  const eventDescriptions = events.map(e => 
    `- ${new Date(e.timestamp).toISOString()}: ${e.storeKey}.${e.type} → ${JSON.stringify(e.value)}`
  ).join('\n');

  return `Explain the causal chain of these events. How did one lead to the next?

Events:
${eventDescriptions}

Your explanation:`;
}

/**
 * Build anomaly prompt
 */
function buildAnomalyPrompt(graph: CausalGraph, events: CausalEvent<any>[]): string {
  // Calculate statistics
  const allEvents = Array.from(graph.events.values());
  const avgTimeBetween = calculateAverageTimeBetween(allEvents);
  
  const anomalousEvent = events[0];
  const ancestors = findAncestors(graph, anomalousEvent.id);

  return `This event appears anomalous. Explain why:

Anomalous Event:
- Time: ${new Date(anomalousEvent.timestamp).toISOString()}
- Store: ${anomalousEvent.storeKey}
- Type: ${anomalousEvent.type}
- Value: ${JSON.stringify(anomalousEvent.value)}

Context:
- Average time between events: ${avgTimeBetween}ms
- Number of ancestors: ${ancestors.length}
- Total events in graph: ${allEvents.length}

Why is this event unusual? What might have caused it?`;
}

/**
 * Build branch divergence prompt
 */
function buildBranchDivergencePrompt(graph: CausalGraph, events: CausalEvent<any>[]): string {
  // Find fork point (event with multiple children)
  const forkPoints = events.filter(e => {
    const children = graph.forward.get(e.id);
    return children && children.size > 1;
  });

  const forkPoint = forkPoints[0];
  const children = forkPoint ? Array.from(graph.forward.get(forkPoint.id) || []) : [];

  return `Explain how and why these universe branches diverged:

Fork Point:
- Time: ${forkPoint ? new Date(forkPoint.timestamp).toISOString() : 'unknown'}
- State: ${forkPoint ? JSON.stringify(forkPoint.value) : 'unknown'}

Branches (${children.length} divergent paths):
${children.map((childId, i) => {
  const child = graph.events.get(childId);
  return `Branch ${i + 1}: ${child ? `${child.storeKey}.${child.type}` : childId}`;
}).join('\n')}

What caused this divergence? What are the key differences?`;
}

/**
 * Build root cause prompt
 */
function buildRootCausePrompt(graph: CausalGraph, events: CausalEvent<any>[]): string {
  const latestEvent = events[events.length - 1];
  const ancestors = findAncestors(graph, latestEvent.id);
  
  // Find the root cause (event with no parents)
  const roots = ancestors.filter(e => e.causedBy.length === 0);

  return `Trace back to the root cause of this current state:

Current State:
- Time: ${new Date(latestEvent.timestamp).toISOString()}
- Store: ${latestEvent.storeKey}
- Value: ${JSON.stringify(latestEvent.value)}

Causal Chain (${ancestors.length} events):
${ancestors.slice(0, 10).map(e => 
  `- ${new Date(e.timestamp).toISOString()}: ${e.storeKey}.${e.type}`
).join('\n')}
${ancestors.length > 10 ? `... and ${ancestors.length - 10} more` : ''}

Root Event(s):
${roots.map(e => 
  `- ${new Date(e.timestamp).toISOString()}: ${e.storeKey}.${e.type} → ${JSON.stringify(e.value)}`
).join('\n')}

What is the root cause? How did we get from there to here?`;
}

/**
 * Build timeline summary prompt
 */
function buildTimelineSummaryPrompt(graph: CausalGraph, events: CausalEvent<any>[]): string {
  const sortedEvents = events.sort((a, b) => a.timestamp - b.timestamp);
  const first = sortedEvents[0];
  const last = sortedEvents[sortedEvents.length - 1];
  const duration = last.timestamp - first.timestamp;

  // Group by store
  const byStore = new Map<string, CausalEvent<any>[]>();
  for (const event of events) {
    if (!byStore.has(event.storeKey)) {
      byStore.set(event.storeKey, []);
    }
    byStore.get(event.storeKey)!.push(event);
  }

  return `Summarize this timeline of state changes:

Timeline:
- Duration: ${formatDuration(duration)}
- Total events: ${events.length}
- Stores affected: ${byStore.size}

Key Events:
${sortedEvents.slice(0, 20).map(e => 
  `- ${new Date(e.timestamp).toISOString()}: ${e.storeKey}.${e.type}`
).join('\n')}
${sortedEvents.length > 20 ? `... and ${sortedEvents.length - 20} more` : ''}

Provide a coherent narrative of what happened during this timeline.`;
}

/**
 * Calculate average time between events
 */
function calculateAverageTimeBetween(events: CausalEvent<any>[]): number {
  if (events.length < 2) return 0;
  
  const sorted = events.sort((a, b) => a.timestamp - b.timestamp);
  let sum = 0;
  
  for (let i = 1; i < sorted.length; i++) {
    sum += sorted[i].timestamp - sorted[i - 1].timestamp;
  }
  
  return sum / (sorted.length - 1);
}

/**
 * Format duration for display
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Extract event IDs referenced in narrative
 */
function extractReferencedEvents(narrative: string, events: CausalEvent<any>[]): EventId[] {
  const referenced = new Set<EventId>();
  
  for (const event of events) {
    // Check if event ID or store.type appears in narrative
    if (narrative.includes(event.id) || 
        narrative.includes(`${event.storeKey}.${event.type}`)) {
      referenced.add(event.id);
    }
  }
  
  return Array.from(referenced);
}

/**
 * OpenAI generation
 */
async function generateOpenAI(
  prompt: string,
  config: Extract<LLMProvider, { type: 'openai' }>
): Promise<string> {
  const model = config.model || 'gpt-4';
  const baseURL = config.baseURL || 'https://api.openai.com/v1';

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are an expert at explaining software state changes and causality.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Anthropic Claude generation
 */
async function generateAnthropic(
  prompt: string,
  config: Extract<LLMProvider, { type: 'anthropic' }>
): Promise<string> {
  const model = config.model || 'claude-3-sonnet-20240229';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1000,
      messages: [
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

/**
 * Google Gemini generation
 */
async function generateGemini(
  prompt: string,
  config: Extract<LLMProvider, { type: 'gemini' }>
): Promise<string> {
  const model = config.model || 'gemini-pro';

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${config.apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: prompt }] },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

/**
 * Ollama local model generation
 */
async function generateOllama(
  prompt: string,
  config: Extract<LLMProvider, { type: 'ollama' }>
): Promise<string> {
  const baseURL = config.baseURL || 'http://localhost:11434';
  const model = config.model || 'llama2';

  const response = await fetch(`${baseURL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.response;
}

/**
 * Export all types
 */
export type Narrator = ReturnType<typeof createNarrator>;
