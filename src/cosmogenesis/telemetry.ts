/**
 * Cosmogenesis: Law telemetry definitions
 */

import type {
  EventId,
  ObserverId,
  UniverseId,
} from '../temporal/causalEvent.js';

export type LawTelemetryType =
  | 'violation'
  | 'repair'
  | 'reaction'
  | 'reaction-error'
  | 'audit-error';

export interface LawTelemetry {
  timestamp: number;
  type: LawTelemetryType;
  lawName: string;
  storeKey: string;
  universeId?: UniverseId;
  observerId?: ObserverId;
  eventId?: EventId;
  severity: 'info' | 'warn' | 'error';
  message: string;
  details?: Record<string, any>;
}

export type TelemetrySink = (entry: LawTelemetry) => void;
