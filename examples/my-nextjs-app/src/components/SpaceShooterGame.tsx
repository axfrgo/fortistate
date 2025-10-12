/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '@/hooks/useClientStore';
import type { GameState } from '@/stores';
import { GAME_LAWS, validateGameState, autoFixGameState, type OntogeneticLaw } from '@/stores/gameLaws';

interface Enemy {
  id: string;
  x: number;
  y: number;
  health: number;
  speed: number;
}

interface PowerUp {
  type: string;
  activatedAt: number;
  expiresAt: number;
  effect: string;
}

export default function SpaceShooterGame() {
  const [gameState, gameStateUtils] = useStore.gameState() as [GameState, any];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [violations, setViolations] = useState<any[]>([]);
  const [showLawPanel, setShowLawPanel] = useState(true);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize game state
  useEffect(() => {
    if (!gameState) {
      gameStateUtils.set({
        player: {
          health: 100,
          maxHealth: 100,
          position: { x: 400, y: 550 },
          speed: 10,
        },
        score: 0,
        highScore: 0,
        level: 1,
        enemies: [],
        enemyCount: 0,
        resources: {
          energy: 100,
          shields: 50,
          ammo: 100,
        },
        resourceCapacity: {
          energy: 100,
          shields: 100,
          ammo: 200,
        },
        activePowerUps: [],
        isPaused: false,
        pausedAt: null,
        isGameOver: false,
        gameBounds: { width: 800, height: 600 },
        _validated: false,
      });
    }
  }, []);

  // Validate game state on every change
  useEffect(() => {
    if (gameState) {
      const result = validateGameState('gameState', gameState);
      setViolations(result);
    }
  }, [gameState]);

  // Game loop
  useEffect(() => {
    if (!gameState || gameState.isPaused || gameState.isGameOver) return;

    const gameLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, gameState.gameBounds.width, gameState.gameBounds.height);

      // Draw background
      ctx.fillStyle = '#000033';
      ctx.fillRect(0, 0, gameState.gameBounds.width, gameState.gameBounds.height);

      // Update enemies
      if (gameState.enemies.length > 0) {
        const updatedEnemies = gameState.enemies.map((enemy: Enemy) => ({
          ...enemy,
          y: enemy.y + enemy.speed,
        })).filter((enemy: Enemy) => enemy.y < gameState.gameBounds.height);

        gameStateUtils.set({
          ...gameState,
          enemies: updatedEnemies,
          enemyCount: updatedEnemies.length,
        });
      }

      // Remove expired power-ups
      if (gameState.activePowerUps.length > 0) {
        const now = Date.now();
        const activePowerUps = gameState.activePowerUps.filter((p: PowerUp) => p.expiresAt > now);
        if (activePowerUps.length !== gameState.activePowerUps.length) {
          gameStateUtils.set({
            ...gameState,
            activePowerUps,
          });
        }
      }

      // Draw player
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(
        gameState.player.position.x,
        gameState.player.position.y,
        40,
        40
      );

      // Draw player health bar
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(gameState.player.position.x, gameState.player.position.y - 10, 40, 5);
      ctx.fillStyle = '#00ff00';
      const healthWidth = (gameState.player.health / gameState.player.maxHealth) * 40;
      ctx.fillRect(gameState.player.position.x, gameState.player.position.y - 10, healthWidth, 5);

      // Draw enemies
      ctx.fillStyle = '#ff4444';
      gameState.enemies.forEach((enemy: Enemy) => {
        ctx.fillRect(enemy.x, enemy.y, 30, 30);
      });

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState]);

  const moveLeft = useCallback(() => {
    if (!gameState || gameState.isPaused) return;
    gameStateUtils.set({
      ...gameState,
      player: {
        ...gameState.player,
        position: {
          ...gameState.player.position,
          x: Math.max(0, gameState.player.position.x - gameState.player.speed),
        },
      },
    });
  }, [gameState]);

  const moveRight = useCallback(() => {
    if (!gameState || gameState.isPaused) return;
    const newX = Math.min(
      gameState.player.position.x + gameState.player.speed,
      gameState.gameBounds.width - 40
    );
    gameStateUtils.set({
      ...gameState,
      player: {
        ...gameState.player,
        position: { ...gameState.player.position, x: newX },
      },
    });
  }, [gameState]);

  const moveUp = useCallback(() => {
    if (!gameState || gameState.isPaused) return;
    const newY = Math.max(
      gameState.player.position.y - gameState.player.speed,
      0
    );
    gameStateUtils.set({
      ...gameState,
      player: {
        ...gameState.player,
        position: { ...gameState.player.position, y: newY },
      },
    });
  }, [gameState]);

  const moveDown = useCallback(() => {
    if (!gameState || gameState.isPaused) return;
    const newY = Math.min(
      gameState.player.position.y + gameState.player.speed,
      gameState.gameBounds.height - 40
    );
    gameStateUtils.set({
      ...gameState,
      player: {
        ...gameState.player,
        position: { ...gameState.player.position, y: newY },
      },
    });
  }, [gameState]);

  const shoot = useCallback(() => {
    if (!gameState || gameState.isPaused || gameState.resources.ammo <= 0) return;
    gameStateUtils.set({
      ...gameState,
      resources: {
        ...gameState.resources,
        ammo: gameState.resources.ammo - 1,
      },
    });
  }, [gameState]);

  const spawnEnemy = useCallback(() => {
    if (!gameState || gameState.isPaused) return;
    const newEnemy: Enemy = {
      id: `enemy-${Date.now()}`,
      x: Math.random() * (gameState.gameBounds.width - 30),
      y: 0,
      health: 100,
      speed: 2 + Math.random() * 2,
    };
    gameStateUtils.set({
      ...gameState,
      enemies: [...gameState.enemies, newEnemy],
      enemyCount: gameState.enemies.length + 1,
    });
  }, [gameState]);

  const addScore = useCallback(() => {
    if (!gameState) return;
    gameStateUtils.set({
      ...gameState,
      score: gameState.score + 100,
    });
  }, [gameState]);

  const levelUp = useCallback(() => {
    if (!gameState) return;
    gameStateUtils.set({
      ...gameState,
      level: gameState.level + 1,
    });
  }, [gameState]);

  const takeDamage = useCallback(() => {
    if (!gameState) return;
    gameStateUtils.set({
      ...gameState,
      player: {
        ...gameState.player,
        health: Math.max(0, gameState.player.health - 20),
      },
    });
  }, [gameState]);

  // Law violation trigger functions
  const breakHealthLaw = useCallback(() => {
    if (!gameState) return;
    gameStateUtils.set({
      ...gameState,
      player: {
        ...gameState.player,
        health: 150, // Exceeds maxHealth
      },
    });
  }, [gameState]);

  const breakScoreLaw = useCallback(() => {
    if (!gameState) return;
    gameStateUtils.set({
      ...gameState,
      score: -100, // Negative score
    });
  }, [gameState]);

  const breakLevelLaw = useCallback(() => {
    if (!gameState) return;
    gameStateUtils.set({
      ...gameState,
      level: 0, // Level must be positive
    });
  }, [gameState]);

  const breakResourceLaw = useCallback(() => {
    if (!gameState) return;
    gameStateUtils.set({
      ...gameState,
      resources: {
        ...gameState.resources,
        ammo: 300, // Exceeds capacity
      },
    });
  }, [gameState]);

  const breakPauseLaw = useCallback(() => {
    if (!gameState) return;
    gameStateUtils.set({
      ...gameState,
      isPaused: true,
      pausedAt: Date.now() - (5 * 60 * 1000) - 1, // Paused for >5 minutes
    });
  }, [gameState]);

  const breakPositionLaw = useCallback(() => {
    if (!gameState) return;
    gameStateUtils.set({
      ...gameState,
      player: {
        ...gameState.player,
        position: { x: -100, y: 1000 }, // Out of bounds
      },
    });
  }, [gameState]);

  const applyAutoFix = useCallback(() => {
    if (!gameState) return;
    const { fixed } = autoFixGameState('gameState', gameState);
    gameStateUtils.set(fixed);
  }, [gameState]);

  if (!gameState) {
    return <div className="p-4">Loading game...</div>;
  }

  const errorCount = violations.filter(v => v.severity === 'error').length;
  const warningCount = violations.filter(v => v.severity === 'warning').length;
  const infoCount = violations.filter(v => v.severity === 'info').length;

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-2">🎮 Space Shooter</h2>
        <p className="text-gray-600">
          A game demonstrating real-time ontogenetic law enforcement.
          Try the buttons below to trigger law violations and see the inspector detect them!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Game Canvas */}
        <div className="bg-white rounded-lg shadow p-6">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="border-2 border-gray-300 rounded w-full"
            style={{ maxWidth: '100%', height: 'auto' }}
          />

          {/* Game Stats */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Health</div>
              <div className="text-xl font-bold">{gameState.player.health}/{gameState.player.maxHealth}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Score</div>
              <div className="text-xl font-bold">{gameState.score}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Level</div>
              <div className="text-xl font-bold">{gameState.level}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Enemies</div>
              <div className="text-xl font-bold">{gameState.enemyCount}</div>
            </div>
          </div>

          {/* Resources */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <div className="text-sm text-gray-600">Ammo</div>
              <div className="w-full bg-gray-200 rounded h-4">
                <div
                  className="bg-yellow-500 h-4 rounded"
                  style={{
                    width: `${(gameState.resources.ammo / gameState.resourceCapacity.ammo) * 100}%`,
                  }}
                />
              </div>
              <div className="text-xs text-gray-500">{gameState.resources.ammo}/{gameState.resourceCapacity.ammo}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Shields</div>
              <div className="w-full bg-gray-200 rounded h-4">
                <div
                  className="bg-blue-500 h-4 rounded"
                  style={{
                    width: `${(gameState.resources.shields / gameState.resourceCapacity.shields) * 100}%`,
                  }}
                />
              </div>
              <div className="text-xs text-gray-500">{gameState.resources.shields}/{gameState.resourceCapacity.shields}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Energy</div>
              <div className="w-full bg-gray-200 rounded h-4">
                <div
                  className="bg-green-500 h-4 rounded"
                  style={{
                    width: `${(gameState.resources.energy / gameState.resourceCapacity.energy) * 100}%`,
                  }}
                />
              </div>
              <div className="text-xs text-gray-500">{gameState.resources.energy}/{gameState.resourceCapacity.energy}</div>
            </div>
          </div>

          {/* Game Controls */}
          <div className="grid grid-cols-3 gap-2 mt-6">
            <button onClick={moveUp} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">↑ Up</button>
            <button onClick={spawnEnemy} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Spawn Enemy</button>
            <button onClick={shoot} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">Shoot</button>
            <button onClick={moveLeft} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">← Left</button>
            <button onClick={addScore} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">+Score</button>
            <button onClick={moveRight} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Right →</button>
            <button onClick={moveDown} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">↓ Down</button>
            <button onClick={levelUp} className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">Level Up</button>
            <button onClick={takeDamage} className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">Take Damage</button>
          </div>
        </div>

        {/* Law Enforcement Panel */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">⚖️ Law Enforcement</h3>
            <button
              onClick={() => setShowLawPanel(!showLawPanel)}
              className="text-sm text-blue-600 hover:underline"
            >
              {showLawPanel ? 'Hide' : 'Show'}
            </button>
          </div>

          {showLawPanel && (
            <>
              {/* Violation Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-red-50 rounded">
                  <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                  <div className="text-sm text-red-600">Errors</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded">
                  <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
                  <div className="text-sm text-yellow-600">Warnings</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">{infoCount}</div>
                  <div className="text-sm text-blue-600">Info</div>
                </div>
              </div>

              {/* Violations List */}
              {violations.length > 0 ? (
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                  {violations.map((violation, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded border-l-4 ${
                        violation.severity === 'error'
                          ? 'bg-red-50 border-red-500'
                          : violation.severity === 'warning'
                          ? 'bg-yellow-50 border-yellow-500'
                          : 'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <div className="font-semibold text-sm">{violation.lawId}: {violation.category}</div>
                      <div className="text-sm text-gray-700">{violation.message}</div>
                      {violation.suggestion && (
                        <div className="text-xs text-gray-600 mt-1">💡 {violation.suggestion}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  ✅ No violations - All laws satisfied!
                </div>
              )}

              {/* Auto-Fix Button */}
              {violations.length > 0 && (
                <button
                  onClick={applyAutoFix}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-6"
                >
                  🔧 Auto-Fix All Violations
                </button>
              )}

              {/* Violation Triggers */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 text-sm">🧪 Test Law Violations:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={breakHealthLaw} className="text-xs bg-gray-100 px-3 py-2 rounded hover:bg-gray-200">Break Health Law</button>
                  <button onClick={breakScoreLaw} className="text-xs bg-gray-100 px-3 py-2 rounded hover:bg-gray-200">Break Score Law</button>
                  <button onClick={breakLevelLaw} className="text-xs bg-gray-100 px-3 py-2 rounded hover:bg-gray-200">Break Level Law</button>
                  <button onClick={breakResourceLaw} className="text-xs bg-gray-100 px-3 py-2 rounded hover:bg-gray-200">Break Resource Law</button>
                  <button onClick={breakPauseLaw} className="text-xs bg-gray-100 px-3 py-2 rounded hover:bg-gray-200">Break Pause Law</button>
                  <button onClick={breakPositionLaw} className="text-xs bg-gray-100 px-3 py-2 rounded hover:bg-gray-200">Break Position Law</button>
                </div>
              </div>

              {/* Inspector Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded text-sm">
                <div className="font-semibold mb-2">🔍 Inspector Integration</div>
                <div className="text-xs text-gray-700 space-y-1">
                  <div>• Open inspector to see real-time law violations</div>
                  <div>• Apply law presets (Strict, Production, etc.)</div>
                  <div>• View timeline of all state changes</div>
                  <div>• Export violations for analysis</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Game Laws Reference */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">📜 Active Game Laws</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GAME_LAWS.map((law: OntogeneticLaw) => (
            <div key={law.id} className="p-3 border rounded">
              <div className="font-semibold text-sm">{law.id}</div>
              <div className="text-xs text-gray-600 mb-1">{law.category}</div>
              <div className="text-xs text-gray-700">{law.description}</div>
              <div className="text-xs text-gray-500 mt-1">
                Severity: <span className={`font-semibold ${
                  law.severity === 'error' ? 'text-red-600' : 
                  law.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                }`}>{law.severity}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
