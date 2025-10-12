/**
 * Comprehensive Ontogenetic Laws for Space Shooter Game
 * These laws define ALL rules and constraints that govern valid game state evolution
 * 
 * Categories:
 * - structural: Data structure integrity (types, ranges, relationships)
 * - semantic: Business logic rules (game mechanics, score, levels)
 * - temporal: Time-based constraints (durations, sequences)
 * - security: Integrity and validation rules
 * 
 * Coverage: 25 Laws
 * - Player: 5 laws (health, position, speed, maxHealth, game over)
 * - Score/Level: 3 laws (score, highScore, level)
 * - Resources: 3 laws (non-negative, capacity, capacity positive)
 * - Enemies: 5 laws (count, unique IDs, health, position, speed)
 * - Power-ups: 3 laws (expiration, removal, required fields)
 * - Game State: 4 laws (pause time, pause timestamp, unpause, bounds)
 * - Validation: 2 laws (validation flag, game over freeze)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface OntogeneticLaw {
  id: string;
  category: 'structural' | 'semantic' | 'temporal' | 'security';
  severity: 'error' | 'warning' | 'info';
  description: string;
  validate: (key: string, value: any, context?: any) => ValidationResult | null;
  autoFix?: (key: string, value: any) => any;
}

export interface ValidationResult {
  lawId: string;
  category: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  path?: string[];
  suggestion?: string;
}

/**
 * Comprehensive game-specific ontogenetic laws (25 laws)
 */
export const GAME_LAWS: OntogeneticLaw[] = [
  // ===== PLAYER LAWS =====
  {
    id: 'GAME-001',
    category: 'structural',
    severity: 'error',
    description: 'Player health must be between 0 and maxHealth',
    validate: (key, value) => {
      if (key === 'gameState' && value?.player?.health !== undefined) {
        const health = value.player.health;
        const maxHealth = value.player.maxHealth || 100;
        
        if (typeof health !== 'number' || health < 0 || health > maxHealth) {
          return {
            lawId: 'GAME-001',
            category: 'Player Health',
            severity: 'error',
            message: `Player health (${health}) must be between 0 and ${maxHealth}`,
            path: ['player', 'health'],
            suggestion: `Set health to a value between 0 and ${maxHealth}. Use Math.max(0, Math.min(maxHealth, health))`
          };
        }
      }
      return null;
    },
    autoFix: (key, value) => {
      if (key === 'gameState' && value?.player?.health !== undefined) {
        const maxHealth = value.player.maxHealth || 100;
        return {
          ...value,
          player: {
            ...value.player,
            health: Math.max(0, Math.min(maxHealth, value.player.health))
          }
        };
      }
      return value;
    }
  },

  {
    id: 'GAME-002',
    category: 'structural',
    severity: 'error',
    description: 'Player maxHealth must be positive',
    validate: (key, value) => {
      if (key === 'gameState' && value?.player?.maxHealth !== undefined) {
        const maxHealth = value.player.maxHealth;
        if (typeof maxHealth !== 'number' || maxHealth <= 0) {
          return {
            lawId: 'GAME-002',
            category: 'Player Stats',
            severity: 'error',
            message: `Player maxHealth (${maxHealth}) must be a positive number`,
            path: ['player', 'maxHealth'],
            suggestion: 'Set maxHealth to a positive value (e.g., 100)'
          };
        }
      }
      return null;
    },
    autoFix: (key, value) => {
      if (key === 'gameState' && value?.player?.maxHealth !== undefined) {
        return {
          ...value,
          player: {
            ...value.player,
            maxHealth: Math.max(1, value.player.maxHealth)
          }
        };
      }
      return value;
    }
  },

  {
    id: 'GAME-003',
    category: 'semantic',
    severity: 'error',
    description: 'Player position must be within game bounds',
    validate: (key, value) => {
      if (key === 'gameState' && value?.player?.position) {
        const { x, y } = value.player.position;
        const bounds = value.gameBounds || { width: 800, height: 600 };
        
        if (x < 0 || x > bounds.width || y < 0 || y > bounds.height) {
          return {
            lawId: 'GAME-003',
            category: 'Player Position',
            severity: 'error',
            message: `Player position (${x}, ${y}) is out of bounds (0-${bounds.width}, 0-${bounds.height})`,
            path: ['player', 'position'],
            suggestion: 'Clamp position to game bounds using Math.max/Math.min'
          };
        }
      }
      return null;
    },
    autoFix: (key, value) => {
      if (key === 'gameState' && value?.player?.position) {
        const bounds = value.gameBounds || { width: 800, height: 600 };
        return {
          ...value,
          player: {
            ...value.player,
            position: {
              x: Math.max(0, Math.min(bounds.width, value.player.position.x)),
              y: Math.max(0, Math.min(bounds.height, value.player.position.y))
            }
          }
        };
      }
      return value;
    }
  },

  {
    id: 'GAME-004',
    category: 'structural',
    severity: 'error',
    description: 'Player speed must be positive',
    validate: (key, value) => {
      if (key === 'gameState' && value?.player?.speed !== undefined) {
        const speed = value.player.speed;
        if (typeof speed !== 'number' || speed <= 0) {
          return {
            lawId: 'GAME-004',
            category: 'Player Stats',
            severity: 'error',
            message: `Player speed (${speed}) must be a positive number`,
            path: ['player', 'speed'],
            suggestion: 'Set speed to a positive value (e.g., 5-20)'
          };
        }
      }
      return null;
    },
    autoFix: (key, value) => {
      if (key === 'gameState' && value?.player?.speed !== undefined) {
        return {
          ...value,
          player: {
            ...value.player,
            speed: Math.max(1, value.player.speed)
          }
        };
      }
      return value;
    }
  },

  {
    id: 'GAME-005',
    category: 'semantic',
    severity: 'warning',
    description: 'Player health should trigger game over when zero',
    validate: (key, value) => {
      if (key === 'gameState' && value?.player?.health === 0 && !value?.isGameOver) {
        return {
          lawId: 'GAME-005',
          category: 'Game State',
          severity: 'warning',
          message: 'Player health is 0 but game is not over',
          path: ['isGameOver'],
          suggestion: 'Set isGameOver to true when health reaches 0'
        };
      }
      return null;
    },
    autoFix: (key, value) => {
      if (key === 'gameState' && value?.player?.health === 0 && !value?.isGameOver) {
        return {
          ...value,
          isGameOver: true
        };
      }
      return value;
    }
  },

  // ===== SCORE & LEVEL LAWS =====
  {
    id: 'GAME-006',
    category: 'semantic',
    severity: 'error',
    description: 'Score must be non-negative',
    validate: (key, value) => {
      if (key === 'gameState' && value?.score !== undefined) {
        if (typeof value.score !== 'number' || value.score < 0) {
          return {
            lawId: 'GAME-006',
            category: 'Score',
            severity: 'error',
            message: `Score (${value.score}) cannot be negative`,
            path: ['score'],
            suggestion: 'Set score to 0 or positive value'
          };
        }
      }
      return null;
    },
    autoFix: (key, value) => {
      if (key === 'gameState' && value?.score !== undefined) {
        return {
          ...value,
          score: Math.max(0, value.score)
        };
      }
      return value;
    }
  },

  {
    id: 'GAME-007',
    category: 'semantic',
    severity: 'warning',
    description: 'High score should be updated when current score exceeds it',
    validate: (key, value) => {
      if (key === 'gameState' && value?.score !== undefined && value?.highScore !== undefined) {
        if (value.score > value.highScore) {
          return {
            lawId: 'GAME-007',
            category: 'High Score',
            severity: 'warning',
            message: `Current score (${value.score}) exceeds high score (${value.highScore})`,
            path: ['highScore'],
            suggestion: 'Update highScore to match current score'
          };
        }
      }
      return null;
    },
    autoFix: (key, value) => {
      if (key === 'gameState' && value?.score > value?.highScore) {
        return {
          ...value,
          highScore: value.score
        };
      }
      return value;
    }
  },

  {
    id: 'GAME-008',
    category: 'structural',
    severity: 'error',
    description: 'Game level must be positive integer',
    validate: (key, value) => {
      if (key === 'gameState' && value?.level !== undefined) {
        if (!Number.isInteger(value.level) || value.level < 1) {
          return {
            lawId: 'GAME-008',
            category: 'Level',
            severity: 'error',
            message: `Level (${value.level}) must be a positive integer`,
            path: ['level'],
            suggestion: 'Set level to an integer >= 1'
          };
        }
      }
      return null;
    },
    autoFix: (key, value) => {
      if (key === 'gameState' && value?.level !== undefined) {
        return {
          ...value,
          level: Math.max(1, Math.floor(Math.abs(value.level)))
        };
      }
      return value;
    }
  },

  // ===== RESOURCE LAWS =====
  {
    id: 'GAME-009',
    category: 'semantic',
    severity: 'error',
    description: 'Resources must be non-negative',
    validate: (key, value) => {
      if (key === 'gameState' && value?.resources) {
        const violations = [];
        for (const [resourceKey, amount] of Object.entries(value.resources)) {
          if (typeof amount === 'number' && amount < 0) {
            violations.push(`${resourceKey}: ${amount}`);
          }
        }
        if (violations.length > 0) {
          return {
            lawId: 'GAME-009',
            category: 'Resources',
            severity: 'error',
            message: `Resources cannot be negative: ${violations.join(', ')}`,
            path: ['resources'],
            suggestion: 'Set negative resource values to 0'
          };
        }
      }
      return null;
    },
    autoFix: (key, value) => {
      if (key === 'gameState' && value?.resources) {
        const fixedResources = { ...value.resources };
        for (const [resourceKey, amount] of Object.entries(fixedResources)) {
          if (typeof amount === 'number' && amount < 0) {
            fixedResources[resourceKey] = 0;
          }
        }
        return {
          ...value,
          resources: fixedResources
        };
      }
      return value;
    }
  },

  {
    id: 'GAME-010',
    category: 'semantic',
    severity: 'warning',
    description: 'Resources should not exceed maximum capacity',
    validate: (key, value) => {
      if (key === 'gameState' && value?.resources) {
        const violations = [];
        for (const [resourceKey, amount] of Object.entries(value.resources)) {
          const capacity = value.resourceCapacity?.[resourceKey] || 1000;
          if (typeof amount === 'number' && amount > capacity) {
            violations.push(`${resourceKey}: ${amount}/${capacity}`);
          }
        }
        if (violations.length > 0) {
          return {
            lawId: 'GAME-010',
            category: 'Resources',
            severity: 'warning',
            message: `Resources exceed capacity: ${violations.join(', ')}`,
            path: ['resources'],
            suggestion: 'Clamp resources to capacity limits'
          };
        }
      }
      return null;
    },
    autoFix: (key, value) => {
      if (key === 'gameState' && value?.resources) {
        const fixedResources = { ...value.resources };
        for (const [resourceKey, amount] of Object.entries(fixedResources)) {
          const capacity = value.resourceCapacity?.[resourceKey] || 1000;
          if (typeof amount === 'number' && amount > capacity) {
            fixedResources[resourceKey] = capacity;
          }
        }
        return {
          ...value,
          resources: fixedResources
        };
      }
      return value;
    }
  },

  {
    id: 'GAME-011',
    category: 'structural',
    severity: 'error',
    description: 'Resource capacity must be positive',
    validate: (key, value) => {
      if (key === 'gameState' && value?.resourceCapacity) {
        const violations = [];
        for (const [resourceKey, capacity] of Object.entries(value.resourceCapacity)) {
          if (typeof capacity === 'number' && capacity <= 0) {
            violations.push(`${resourceKey}: ${capacity}`);
          }
        }
        if (violations.length > 0) {
          return {
            lawId: 'GAME-011',
            category: 'Resources',
            severity: 'error',
            message: `Resource capacity must be positive: ${violations.join(', ')}`,
            path: ['resourceCapacity'],
            suggestion: 'Set capacity to positive values'
          };
        }
      }
      return null;
    },
    autoFix: (key, value) => {
      if (key === 'gameState' && value?.resourceCapacity) {
        const fixedCapacity = { ...value.resourceCapacity };
        for (const [resourceKey, capacity] of Object.entries(fixedCapacity)) {
          if (typeof capacity === 'number' && capacity <= 0) {
            fixedCapacity[resourceKey] = 100;
          }
        }
        return {
          ...value,
          resourceCapacity: fixedCapacity
        };
      }
      return value;
    }
  },

  // ===== ENEMY LAWS =====
  {
    id: 'GAME-012',
    category: 'structural',
    severity: 'error',
    description: 'Enemy count must match enemies array length',
    validate: (key, value) => {
      if (key === 'gameState' && value?.enemies) {
        const arrayLength = Array.isArray(value.enemies) ? value.enemies.length : 0;
        const countField = value.enemyCount;
        
        if (countField !== undefined && countField !== arrayLength) {
          return {
            lawId: 'GAME-012',
            category: 'Enemies',
            severity: 'error',
            message: `Enemy count (${countField}) doesn't match enemies array length (${arrayLength})`,
            path: ['enemyCount'],
            suggestion: 'Sync enemyCount with enemies.length'
          };
        }
      }
      return null;
    },
    autoFix: (key, value) => {
      if (key === 'gameState' && value?.enemies) {
        return {
          ...value,
          enemyCount: Array.isArray(value.enemies) ? value.enemies.length : 0
        };
      }
      return value;
    }
  },

  {
    id: 'GAME-013',
    category: 'structural',
    severity: 'error',
    description: 'Each enemy must have unique ID',
    validate: (key, value) => {
      if (key === 'gameState' && Array.isArray(value?.enemies) && value.enemies.length > 0) {
        const ids = value.enemies.map((e: any) => e.id).filter((id: any) => id);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
          return {
            lawId: 'GAME-013',
            category: 'Enemies',
            severity: 'error',
            message: `Duplicate enemy IDs detected (${ids.length} enemies, ${uniqueIds.size} unique)`,
            path: ['enemies'],
            suggestion: 'Ensure each enemy has a unique ID (use timestamp or UUID)'
          };
        }
      }
      return null;
    }
  },

  {
    id: 'GAME-014',
    category: 'semantic',
    severity: 'error',
    description: 'Enemy health must be positive',
    validate: (key, value) => {
      if (key === 'gameState' && Array.isArray(value?.enemies)) {
        const invalidEnemies = value.enemies.filter((e: any) => 
          typeof e.health === 'number' && e.health <= 0
        );
        if (invalidEnemies.length > 0) {
          return {
            lawId: 'GAME-014',
            category: 'Enemies',
            severity: 'error',
            message: `${invalidEnemies.length} enemy/enemies have zero or negative health`,
            path: ['enemies'],
            suggestion: 'Remove dead enemies (health <= 0)'
          };
        }
      }
      return null;
    },
    autoFix: (key, value) => {
      if (key === 'gameState' && Array.isArray(value?.enemies)) {
        const filtered = value.enemies.filter((e: any) => e.health > 0);
        return {
          ...value,
          enemies: filtered,
          enemyCount: filtered.length
        };
      }
      return value;
    }
  },

  {
    id: 'GAME-015',
    category: 'semantic',
    severity: 'warning',
    description: 'Enemy positions should be within reasonable bounds',
    validate: (key, value) => {
      if (key === 'gameState' && Array.isArray(value?.enemies)) {
        const bounds = value.gameBounds || { width: 800, height: 600 };
        const outOfBounds = value.enemies.filter((e: any) => 
          e.x < -100 || e.x > bounds.width + 100 || e.y < -100 || e.y > bounds.height + 100
        );
        if (outOfBounds.length > 0) {
          return {
            lawId: 'GAME-015',
            category: 'Enemies',
            severity: 'warning',
            message: `${outOfBounds.length} enemy/enemies far out of bounds`,
            path: ['enemies'],
            suggestion: 'Remove enemies that are too far outside play area'
          };
        }
      }
      return null;
    },
    autoFix: (key, value) => {
      if (key === 'gameState' && Array.isArray(value?.enemies)) {
        const bounds = value.gameBounds || { width: 800, height: 600 };
        const filtered = value.enemies.filter((e: any) => 
          e.x >= -100 && e.x <= bounds.width + 100 && e.y >= -100 && e.y <= bounds.height + 100
        );
        return {
          ...value,
          enemies: filtered,
          enemyCount: filtered.length
        };
      }
      return value;
    }
  },

  {
    id: 'GAME-016',
    category: 'structural',
    severity: 'error',
    description: 'Enemy speed must be positive',
    validate: (key, value) => {
      if (key === 'gameState' && Array.isArray(value?.enemies)) {
        const invalidSpeeds = value.enemies.filter((e: any) => 
          typeof e.speed !== 'number' || e.speed <= 0
        );
        if (invalidSpeeds.length > 0) {
          return {
            lawId: 'GAME-016',
            category: 'Enemies',
            severity: 'error',
            message: `${invalidSpeeds.length} enemy/enemies have invalid speed`,
            path: ['enemies'],
            suggestion: 'Set enemy speed to positive values (e.g., 1-5)'
          };
        }
      }
      return null;
    },
    autoFix: (key, value) => {
      if (key === 'gameState' && Array.isArray(value?.enemies)) {
        return {
          ...value,
          enemies: value.enemies.map((e: any) => ({
            ...e,
            speed: Math.max(1, e.speed || 2)
          }))
        };
      }
      return value;
    }
  },

  // ===== POWER-UP LAWS =====
  {
    id: 'GAME-017',
    category: 'temporal',
    severity: 'warning',
    description: 'Power-ups should have expiration times',
    validate: (key, value) => {
      if (key === 'gameState' && Array.isArray(value?.activePowerUps) && value.activePowerUps.length > 0) {
        const missingExpiry = value.activePowerUps.filter(
          (powerUp: any) => !powerUp.expiresAt || typeof powerUp.expiresAt !== 'number'
        );
        if (missingExpiry.length > 0) {
          return {
            lawId: 'GAME-017',
            category: 'Power-ups',
            severity: 'warning',
            message: `${missingExpiry.length} power-up(s) missing expiration time`,
            path: ['activePowerUps'],
            suggestion: 'Add expiresAt timestamp to all power-ups'
          };
        }
      }
      return null;
    }
  },

  {
    id: 'GAME-018',
    category: 'temporal',
    severity: 'info',
    description: 'Expired power-ups should be removed',
    validate: (key, value) => {
      if (key === 'gameState' && Array.isArray(value?.activePowerUps)) {
        const now = Date.now();
        const expired = value.activePowerUps.filter(
          (powerUp: any) => powerUp.expiresAt && powerUp.expiresAt < now
        );
        if (expired.length > 0) {
          return {
            lawId: 'GAME-018',
            category: 'Power-ups',
            severity: 'info',
            message: `${expired.length} power-up(s) have expired and should be removed`,
            path: ['activePowerUps'],
            suggestion: 'Filter out power-ups where expiresAt < Date.now()'
          };
        }
      }
      return null;
    },
    autoFix: (key, value) => {
      if (key === 'gameState' && Array.isArray(value?.activePowerUps)) {
        const now = Date.now();
        return {
          ...value,
          activePowerUps: value.activePowerUps.filter((p: any) => 
            !p.expiresAt || p.expiresAt >= now
          )
        };
      }
      return value;
    }
  },

  {
    id: 'GAME-019',
    category: 'structural',
    severity: 'error',
    description: 'Power-ups must have required fields',
    validate: (key, value) => {
      if (key === 'gameState' && Array.isArray(value?.activePowerUps) && value.activePowerUps.length > 0) {
        const invalid = value.activePowerUps.filter((p: any) => 
          !p.type || !p.effect || typeof p.activatedAt !== 'number'
        );
        if (invalid.length > 0) {
          return {
            lawId: 'GAME-019',
            category: 'Power-ups',
            severity: 'error',
            message: `${invalid.length} power-up(s) missing required fields (type, effect, activatedAt)`,
            path: ['activePowerUps'],
            suggestion: 'Ensure all power-ups have type, effect, and activatedAt fields'
          };
        }
      }
      return null;
    }
  },

  // ===== GAME STATE LAWS =====
  {
    id: 'GAME-020',
    category: 'temporal',
    severity: 'warning',
    description: 'Game should not be paused for more than 5 minutes',
    validate: (key, value) => {
      if (key === 'gameState' && value?.isPaused && value?.pausedAt) {
        const pauseDuration = Date.now() - value.pausedAt;
        const fiveMinutes = 5 * 60 * 1000;
        if (pauseDuration > fiveMinutes) {
          return {
            lawId: 'GAME-020',
            category: 'Game State',
            severity: 'warning',
            message: `Game has been paused for ${Math.floor(pauseDuration / 60000)} minutes`,
            path: ['isPaused'],
            suggestion: 'Resume or reset the game'
          };
        }
      }
      return null;
    }
  },

  {
    id: 'GAME-021',
    category: 'semantic',
    severity: 'error',
    description: 'Paused game must have pausedAt timestamp',
    validate: (key, value) => {
      if (key === 'gameState' && value?.isPaused === true && !value?.pausedAt) {
        return {
          lawId: 'GAME-021',
          category: 'Game State',
          severity: 'error',
          message: 'Game is paused but pausedAt timestamp is missing',
          path: ['pausedAt'],
          suggestion: 'Set pausedAt to Date.now() when pausing'
        };
      }
      return null;
    },
    autoFix: (key, value) => {
      if (key === 'gameState' && value?.isPaused === true && !value?.pausedAt) {
        return {
          ...value,
          pausedAt: Date.now()
        };
      }
      return value;
    }
  },

  {
    id: 'GAME-022',
    category: 'semantic',
    severity: 'warning',
    description: 'Unpaused game should clear pausedAt timestamp',
    validate: (key, value) => {
      if (key === 'gameState' && value?.isPaused === false && value?.pausedAt !== null) {
        return {
          lawId: 'GAME-022',
          category: 'Game State',
          severity: 'warning',
          message: 'Game is not paused but pausedAt timestamp is set',
          path: ['pausedAt'],
          suggestion: 'Set pausedAt to null when resuming'
        };
      }
      return null;
    },
    autoFix: (key, value) => {
      if (key === 'gameState' && value?.isPaused === false && value?.pausedAt !== null) {
        return {
          ...value,
          pausedAt: null
        };
      }
      return value;
    }
  },

  {
    id: 'GAME-023',
    category: 'structural',
    severity: 'error',
    description: 'Game bounds must be positive dimensions',
    validate: (key, value) => {
      if (key === 'gameState' && value?.gameBounds) {
        const { width, height } = value.gameBounds;
        if (typeof width !== 'number' || width <= 0 || typeof height !== 'number' || height <= 0) {
          return {
            lawId: 'GAME-023',
            category: 'Game Bounds',
            severity: 'error',
            message: `Game bounds (${width}x${height}) must be positive numbers`,
            path: ['gameBounds'],
            suggestion: 'Set bounds to positive dimensions (e.g., 800x600)'
          };
        }
      }
      return null;
    },
    autoFix: (key, value) => {
      if (key === 'gameState' && value?.gameBounds) {
        return {
          ...value,
          gameBounds: {
            width: Math.max(100, value.gameBounds.width || 800),
            height: Math.max(100, value.gameBounds.height || 600)
          }
        };
      }
      return value;
    }
  },

  // ===== VALIDATION & SECURITY LAWS =====
  {
    id: 'GAME-024',
    category: 'security',
    severity: 'info',
    description: 'Game state should be validated',
    validate: (key, value) => {
      if (key === 'gameState' && value?._validated !== true) {
        return {
          lawId: 'GAME-024',
          category: 'Validation',
          severity: 'info',
          message: 'Game state has not been marked as validated',
          path: ['_validated'],
          suggestion: 'Set _validated: true after validation passes'
        };
      }
      return null;
    }
  },

  {
    id: 'GAME-025',
    category: 'semantic',
    severity: 'warning',
    description: 'Game over state should freeze most mutations',
    validate: (key, value) => {
      if (key === 'gameState' && value?.isGameOver === true) {
        // Check if player is still at full health (shouldn't happen in game over)
        if (value.player?.health === value.player?.maxHealth) {
          return {
            lawId: 'GAME-025',
            category: 'Game Over',
            severity: 'warning',
            message: 'Game is over but player has full health',
            path: ['isGameOver'],
            suggestion: 'Game over should only occur when health is 0 or explicit game end'
          };
        }
      }
      return null;
    }
  }
];

/**
 * Validate game state against all laws
 */
export function validateGameState(key: string, value: any): ValidationResult[] {
  const violations: ValidationResult[] = [];
  
  for (const law of GAME_LAWS) {
    const result = law.validate(key, value);
    if (result) {
      violations.push(result);
    }
  }
  
  return violations;
}

/**
 * Auto-fix game state violations where possible
 */
export function autoFixGameState(key: string, value: any): { fixed: any; violations: ValidationResult[] } {
  let fixed = value;
  const remainingViolations: ValidationResult[] = [];
  
  for (const law of GAME_LAWS) {
    const violation = law.validate(key, fixed);
    if (violation) {
      if (law.autoFix) {
        fixed = law.autoFix(key, fixed);
        // Re-validate after fix
        const stillViolated = law.validate(key, fixed);
        if (stillViolated) {
          remainingViolations.push(stillViolated);
        }
      } else {
        remainingViolations.push(violation);
      }
    }
  }
  
  return { fixed, violations: remainingViolations };
}

/**
 * Get laws by category
 */
export function getLawsByCategory(category: string): OntogeneticLaw[] {
  return GAME_LAWS.filter(law => law.category === category);
}

/**
 * Get laws by severity
 */
export function getLawsBySeverity(severity: string): OntogeneticLaw[] {
  return GAME_LAWS.filter(law => law.severity === severity);
}

/**
 * Get law by ID
 */
export function getLawById(id: string): OntogeneticLaw | undefined {
  return GAME_LAWS.find(law => law.id === id);
}

/**
 * Get law statistics
 */
export function getLawStats() {
  return {
    total: GAME_LAWS.length,
    byCategory: {
      structural: getLawsByCategory('structural').length,
      semantic: getLawsByCategory('semantic').length,
      temporal: getLawsByCategory('temporal').length,
      security: getLawsByCategory('security').length,
    },
    bySeverity: {
      error: getLawsBySeverity('error').length,
      warning: getLawsBySeverity('warning').length,
      info: getLawsBySeverity('info').length,
    },
    withAutoFix: GAME_LAWS.filter(law => law.autoFix).length,
  };
}
