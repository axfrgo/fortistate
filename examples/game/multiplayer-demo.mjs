/**
 * Multiplayer Turn-Based Game Example
 * 
 * Demonstrates temporal causality and presence in a game scenario:
 * - Turn-based gameplay with causal event tracking
 * - Player presence management
 * - Conflict resolution
 * - Game state validation
 * - Move history and replay
 */

import { createUniverse, createSubstrate } from '../../dist/index.js';

// Define game constraints
const gameConstraints = new Map();

// Valid board positions
gameConstraints.set('board', [
  {
    name: 'valid-positions',
    check: (state) => {
      const { pieces } = state;
      for (const piece of pieces || []) {
        if (piece.x < 0 || piece.x >= 8 || piece.y < 0 || piece.y >= 8) {
          return { 
            valid: false, 
            reason: `Piece at (${piece.x}, ${piece.y}) is out of bounds` 
          };
        }
      }
      return { valid: true };
    },
    repair: (state) => ({
      ...state,
      pieces: (state.pieces || []).filter(
        p => p.x >= 0 && p.x < 8 && p.y >= 0 && p.y < 8
      ),
    }),
  },
]);

// Game state must be valid
gameConstraints.set('gameState', [
  {
    name: 'valid-game-state',
    check: (state) => {
      if (!['waiting', 'active', 'finished'].includes(state.status)) {
        return { valid: false, reason: `Invalid status: ${state.status}` };
      }
      if (state.status === 'active' && !state.currentPlayer) {
        return { valid: false, reason: 'Active game must have currentPlayer' };
      }
      return { valid: true };
    },
    repair: (state) => ({
      status: 'waiting',
      currentPlayer: null,
      turn: 0,
      winner: null,
    }),
  },
]);

// Define game laws
const gameLaws = new Map();

// Law: Turn management
gameLaws.set('gameState', [
  {
    name: 'turn-order',
    description: 'Players alternate turns',
    enforce: (state, allStates) => {
      const players = allStates.get('players') || {};
      const playerIds = Object.keys(players);
      
      if (state.status === 'active' && playerIds.length >= 2) {
        // Alternate between players
        const currentIndex = playerIds.indexOf(state.currentPlayer);
        const nextIndex = (currentIndex + 1) % playerIds.length;
        
        return {
          ...state,
          currentPlayer: playerIds[nextIndex],
          turn: state.turn + 1,
        };
      }
      
      return state;
    },
  },
  {
    name: 'win-condition',
    description: 'Check for game end conditions',
    enforce: (state, allStates) => {
      const board = allStates.get('board') || { pieces: [] };
      const scores = allStates.get('scores') || {};
      
      // Simple win condition: first to 10 points
      for (const [playerId, score] of Object.entries(scores)) {
        if (score >= 10) {
          return {
            ...state,
            status: 'finished',
            winner: playerId,
          };
        }
      }
      
      return state;
    },
  },
]);

// Law: Score updates
gameLaws.set('scores', [
  {
    name: 'calculate-scores',
    description: 'Update scores based on board state',
    reactions: {
      board: (scoresState, boardChanged, allStates) => {
        const board = allStates.get('board') || { pieces: [] };
        const updated = { ...scoresState };
        
        // Count pieces per player
        const counts = {};
        for (const piece of board.pieces || []) {
          counts[piece.owner] = (counts[piece.owner] || 0) + 1;
        }
        
        // Update scores
        for (const [playerId, count] of Object.entries(counts)) {
          updated[playerId] = count;
        }
        
        return updated;
      },
    },
  },
]);

// Create the game universe
const substrate = createSubstrate(
  'turn-based-game',
  gameConstraints,
  undefined,
  { laws: gameLaws }
);

const universe = createUniverse({
  id: 'multiplayer-game',
  substrate,
  autoRepair: true,
  applyReactions: true,
  observerId: 'game-server',
});

// Initialize game stores
const gameState = universe.createStore('gameState', {
  status: 'waiting',
  currentPlayer: null,
  turn: 0,
  winner: null,
});

const players = universe.createStore('players', {});

const board = universe.createStore('board', {
  pieces: [],
});

const scores = universe.createStore('scores', {});

const moveHistory = universe.createStore('moveHistory', {
  moves: [],
});

// Start the universe
universe.start();

console.log('🎮 Multiplayer Turn-Based Game Demo');
console.log('═'.repeat(50));
console.log();

// Display game state
function displayGameState() {
  const game = gameState.get();
  const plrs = players.get();
  const brd = board.get();
  const scrs = scores.get();
  
  console.log(`📊 Game Status: ${game.status.toUpperCase()}`);
  if (game.status === 'active') {
    console.log(`   Current Turn: ${game.turn}`);
    console.log(`   Current Player: ${game.currentPlayer}`);
  }
  if (game.winner) {
    console.log(`   🏆 Winner: ${game.winner}`);
  }
  console.log();
  
  console.log('👥 Players:');
  for (const [id, player] of Object.entries(plrs)) {
    const score = scrs[id] || 0;
    console.log(`   ${id}: ${player.name} (Score: ${score})`);
  }
  console.log();
  
  console.log('🎯 Board:');
  if (brd.pieces.length === 0) {
    console.log('   (empty)');
  } else {
    for (const piece of brd.pieces) {
      console.log(`   ${piece.owner}'s piece at (${piece.x}, ${piece.y})`);
    }
  }
  console.log();
}

displayGameState();

// Scenario 1: Players join
console.log('➕ Player1 joins...');
players.set({
  player1: { name: 'Alice', joinedAt: Date.now() },
});

setTimeout(() => {
  console.log('➕ Player2 joins...');
  players.set({
    player1: { name: 'Alice', joinedAt: Date.now() - 1000 },
    player2: { name: 'Bob', joinedAt: Date.now() },
  });
  
  setTimeout(() => {
    displayGameState();
    
    // Scenario 2: Start game
    console.log('🎬 Starting game...');
    gameState.set({
      status: 'active',
      currentPlayer: 'player1',
      turn: 1,
      winner: null,
    });
    
    setTimeout(() => {
      displayGameState();
      
      // Scenario 3: Player1 makes a move
      console.log('🎲 Player1 places piece at (3, 3)...');
      board.set({
        pieces: [
          { owner: 'player1', x: 3, y: 3, placedAt: Date.now() },
        ],
      });
      
      setTimeout(() => {
        displayGameState();
        
        // Scenario 4: Player2's turn
        console.log('🔄 Switching to Player2...');
        gameState.set({
          status: 'active',
          currentPlayer: 'player2',
          turn: 2,
          winner: null,
        });
        
        setTimeout(() => {
          console.log('🎲 Player2 places piece at (4, 4)...');
          board.set({
            pieces: [
              { owner: 'player1', x: 3, y: 3, placedAt: Date.now() - 100 },
              { owner: 'player2', x: 4, y: 4, placedAt: Date.now() },
            ],
          });
          
          setTimeout(() => {
            displayGameState();
            
            // Scenario 5: Add many pieces to trigger win
            console.log('⚡ Fast-forwarding: Player1 places 8 more pieces...');
            board.set({
              pieces: [
                { owner: 'player1', x: 3, y: 3 },
                { owner: 'player2', x: 4, y: 4 },
                { owner: 'player1', x: 0, y: 0 },
                { owner: 'player1', x: 1, y: 1 },
                { owner: 'player1', x: 2, y: 2 },
                { owner: 'player1', x: 5, y: 5 },
                { owner: 'player1', x: 6, y: 6 },
                { owner: 'player1', x: 7, y: 7 },
                { owner: 'player1', x: 0, y: 7 },
                { owner: 'player1', x: 7, y: 0 },
              ],
            });
            
            setTimeout(() => {
              // Check win condition
              gameState.set({
                ...gameState.get(),
                turn: 10,
              });
              
              setTimeout(() => {
                displayGameState();
                
                // Show causal history
                console.log('📜 Move History (Causal Chain):');
                const snapshot = universe.snapshot();
                console.log(`   Total events recorded: ${snapshot.metadata.eventCount}`);
                console.log(`   Last event at: ${new Date(snapshot.metadata.lastEventAt).toISOString()}`);
                console.log();
                
                // Display telemetry
                console.log('📊 Game Telemetry:');
                const telemetry = universe.getTelemetry();
                console.log(`   Laws executed: ${telemetry.length}`);
                console.log(`   Turn changes: ${telemetry.filter(t => t.lawName === 'turn-order').length}`);
                console.log(`   Win checks: ${telemetry.filter(t => t.lawName === 'win-condition').length}`);
                console.log();
                
                // Test forking (alternate timeline)
                console.log('🌿 Creating alternate timeline (fork)...');
                const altUniverse = universe.fork('alternate-timeline');
                const altBoard = altUniverse.getStore('board');
                altBoard.set({
                  pieces: [
                    { owner: 'player2', x: 0, y: 0 },
                    { owner: 'player2', x: 1, y: 0 },
                  ],
                });
                
                console.log('   Main timeline still shows player1 winning');
                console.log('   Alternate timeline has different board state');
                console.log();
                
                altUniverse.destroy();
                universe.destroy();
                console.log('✅ Demo complete!');
              }, 100);
            }, 100);
          }, 100);
        }, 100);
      }, 100);
    }, 100);
  }, 100);
}, 100);
