/**
 * Cosmogenesis: Universe Laws
 *
 * Provides first-class wrappers around existence constraints so we can model
 * programmable "laws of nature" that monitor and react to state changes.
 */

import type {
  ExistenceConstraint,
  ValidationResult,
  LawContext,
  LawReaction,
  UniverseLaw,
} from '../algebra/substrate.js';
import { validateState } from '../algebra/substrate.js';
import type {
  CausalEvent,
  EventId,
  ObserverId,
  UniverseId,
} from '../temporal/causalEvent.js';

// Re-export types for convenience
export type { LawContext, LawReaction, UniverseLaw } from '../algebra/substrate.js';

export interface LawViolation<T = any> {
  lawName: string;
  storeKey: string;
  universeId?: UniverseId;
  observerId?: ObserverId;
  event?: CausalEvent<T>;
  violations: ValidationResult['violations'];
}

export interface LawRepair<T = any> extends LawViolation<T> {
  repairedValue: T;
  repairEvaluation: ValidationResult;
}

export interface LawReactionEffect {
  lawName: string;
  targetStore: string;
  nextState: any;
}

export interface LawReactionError {
  lawName: string;
  targetStore: string;
  error: unknown;
}

export interface LawExecutionResult<T = any> {
  law: UniverseLaw<T>;
  storeKey: string;
  valid: boolean;
  evaluation: ValidationResult;
  repairedValue?: T;
  repairedEvaluation?: ValidationResult;
  reactionEffects: LawReactionEffect[];
  reactionErrors: LawReactionError[];
}

export interface ExecuteLawOptions<T> {
  state: T;
  storeKey: string;
  event?: CausalEvent<T>;
  attemptRepair?: boolean;
  context?: LawContext;
  applyReactions?: boolean;
}

export function defineLaw<T>(
  name: string,
  constraint: ExistenceConstraint<T>,
  options: Pick<UniverseLaw<T>, 'reactions' | 'onViolation' | 'onRepair'> = {}
): UniverseLaw<T> {
  return {
    name,
    constraint,
    reactions: options.reactions,
    onViolation: options.onViolation,
    onRepair: options.onRepair,
  };
}

export async function executeLaw<T>(
  law: UniverseLaw<T>,
  options: ExecuteLawOptions<T>
): Promise<LawExecutionResult<T>> {
  const {
    state,
    storeKey,
    event,
    attemptRepair = false,
    context,
    applyReactions = true,
  } = options;

  const evaluation = validateState(state, law.constraint);

  const result: LawExecutionResult<T> = {
    law,
    storeKey,
    valid: evaluation.valid,
    evaluation,
    reactionEffects: [],
    reactionErrors: [],
  };

  if (!evaluation.valid) {
    const violationPayload: LawViolation<T> = {
      lawName: law.name,
      storeKey,
      universeId: event?.universeId,
      observerId: event?.observerId,
      event,
      violations: evaluation.violations,
    };

    law.onViolation?.(violationPayload);

    if (attemptRepair && law.constraint.repair) {
      const repairedValue = law.constraint.repair(state);

      if (typeof repairedValue !== 'undefined') {
        const repairedEvaluation = validateState(
          repairedValue,
          law.constraint
        );

        result.repairedValue = repairedValue;
        result.repairedEvaluation = repairedEvaluation;
        result.valid = repairedEvaluation.valid;

        const repairPayload: LawRepair<T> = {
          ...violationPayload,
          repairedValue,
          repairEvaluation: repairedEvaluation,
        };

        law.onRepair?.(repairPayload);

        if (!repairedEvaluation.valid) {
          // Still invalid after repair — surface as violation again
          law.onViolation?.({
            ...violationPayload,
            violations: repairedEvaluation.violations,
          });
        }
      }
    }
  }

  const effectiveState =
    typeof result.repairedValue !== 'undefined' ? result.repairedValue : state;

  if (law.reactions && context && Object.keys(law.reactions).length > 0) {
    for (const [targetStore, reaction] of Object.entries(law.reactions)) {
      try {
        const reactionResult = await reaction(effectiveState, {
          ...context,
        });

        if (typeof reactionResult !== 'undefined') {
          result.reactionEffects.push({
            lawName: law.name,
            targetStore,
            nextState: reactionResult,
          });

          if (applyReactions !== false) {
            context.setState(targetStore, reactionResult, {
              source: 'law-reaction',
              tags: [law.name],
            });
          }
        }
      } catch (error) {
        result.reactionErrors.push({
          lawName: law.name,
          targetStore,
          error,
        });
      }
    }
  }

  return result;
}

export class LawRegistry {
  private readonly bindings = new Map<string, UniverseLaw<any>[]>()

  register<T>(storeKey: string, law: UniverseLaw<T>): void {
    const existing = this.bindings.get(storeKey) || [];
    if (!existing.find((candidate) => candidate.name === law.name)) {
      existing.push(law as UniverseLaw<any>);
      this.bindings.set(storeKey, existing);
    }
  }

  registerMany(bindings: Record<string, UniverseLaw<any>[]>) {
    for (const [storeKey, laws] of Object.entries(bindings)) {
      for (const law of laws) {
        this.register(storeKey, law);
      }
    }
  }

  get(storeKey: string): UniverseLaw<any>[] {
    return this.bindings.get(storeKey) || [];
  }

  entries(): Array<[string, UniverseLaw<any>[]]> {
    return Array.from(this.bindings.entries());
  }

  toMap(): Map<string, UniverseLaw<any>[]> {
    return new Map(this.bindings);
  }
}
