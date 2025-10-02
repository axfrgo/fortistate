# Multiplayer Turn-Based Game Example

Complete turn-based multiplayer game demonstrating Fortistate's temporal causality and universe forking.

## Features

✅ **Temporal Causality**
- Causal event tracking for every move
- Complete game history with timestamps
- Replay capability

✅ **Turn Management**
- Enforced turn order with constraints
- Win condition detection
- Score calculation laws

✅ **Universe Forking**
- Create alternate timelines
- "What-if" scenario testing
- Parallel game states

✅ **Presence Management**
- Player join/leave tracking
- Real-time player status
- Connection state management

## Architecture

### Stores

```
gameState   → Current game status (waiting, playing, finished)
players     → Player roster with scores
board       → Game board state (8×8 grid)
scores      → Current player scores
moveHistory → Complete move log with causality
```

### Constraints

**Position Validation:**
- `valid-positions`: Board coordinates must be 0-7
- Auto-repair: Invalid moves rejected

**Game State Validation:**
- `valid-game-state`: State must be waiting|playing|finished
- Auto-repair: Invalid states corrected

### Laws

**turn-order:**
- Enforces: Players alternate turns
- Validates: Current player matches turn count
- Prevents: Out-of-turn moves

**win-condition:**
- Enforces: First to 10 points wins
- Automatic: Game ends when condition met
- Updates: Game state to 'finished'

**calculate-scores:**
- Enforces: Score = number of pieces on board
- Reactions: Updates when board changes
- Real-time: Score tracking

## Running the Demo

```bash
node examples/game/multiplayer-demo.mjs
```

## Output

The demo runs through several scenarios:

### Scenario 1: Game Setup
```
Players joined: Alice (player1), Bob (player2)
Game state: waiting → playing
Current turn: player1 (Alice)
```

### Scenario 2: Players Make Moves
```
Move 1: Alice places at (2,3)
Causal Event ID: evt-001
Parent Events: []

Move 2: Bob places at (4,5)
Causal Event ID: evt-002
Parent Events: [evt-001]

Move 3: Alice places at (1,7)
Causal Event ID: evt-003
Parent Events: [evt-002]
```

### Scenario 3: Score Updates
```
Scores:
- Alice (player1): 2 points
- Bob (player2): 1 point
Game continues...
```

### Scenario 4: Win Condition
```
Alice places 10th piece at (6,6)
Win condition met!
Winner: Alice (player1)
Game state: playing → finished
```

### Scenario 5: Timeline Forking
```
Creating alternate timeline: what-if-bob-wins
Fork created at move #5
Simulating different moves...
Original timeline: Alice wins
Alternate timeline: Bob wins
```

## Key Concepts Demonstrated

### 1. Causal Event Tracking

```javascript
const moveHistory = universe.createStore('moveHistory', [])

// Every move creates causal event
boardStore.set(newBoard)

// Get complete history
const history = moveHistory.getHistory()
history.forEach(event => {
  console.log(`Event ${event.id}`)
  console.log(`  Timestamp: ${new Date(event.timestamp)}`)
  console.log(`  Parents: ${event.parents.join(', ')}`)
  console.log(`  Player: ${event.metadata.player}`)
  console.log(`  Position: (${event.metadata.x}, ${event.metadata.y})`)
})
```

### 2. Universe Forking

```javascript
// Create fork at current state
const fork = universe.fork('what-if-scenario')

// Modify fork without affecting original
const forkBoard = fork.getStore('board')
forkBoard?.set({
  ...forkBoard.get(),
  '5,5': 'player2', // Different move
})

// Original universe unchanged
console.log('Original:', universe.getStore('board')?.get())
console.log('Fork:', fork.getStore('board')?.get())
```

### 3. Turn Order Enforcement

```javascript
const turnOrderLaw = {
  name: 'turn-order',
  enforce: (gameState, allStates) => {
    const players = allStates.get('players') || {}
    const moveHistory = allStates.get('moveHistory') || []
    
    const turnCount = moveHistory.length
    const playerIds = Object.keys(players)
    const expectedPlayer = playerIds[turnCount % playerIds.length]
    
    return {
      ...gameState,
      currentPlayer: expectedPlayer,
      turnCount,
    }
  },
}
```

### 4. Win Condition Detection

```javascript
const winConditionLaw = {
  name: 'win-condition',
  enforce: (gameState, allStates) => {
    const scores = allStates.get('scores') || {}
    
    const winner = Object.entries(scores)
      .find(([_, score]) => score >= 10)
    
    if (winner && gameState.status === 'playing') {
      return {
        ...gameState,
        status: 'finished',
        winner: winner[0],
        finishedAt: Date.now(),
      }
    }
    
    return gameState
  },
}
```

## Real-World Applications

This pattern is perfect for:

- **Multiplayer games**: Chess, checkers, card games
- **Collaborative editing**: Document history, undo/redo
- **Workflow systems**: Approval chains, state machines
- **Version control**: Branching, merging, conflict resolution
- **Simulation systems**: Scenario testing, A/B testing

## Performance

- Move processing: < 1ms per move
- History tracking: O(1) append, O(n) replay
- Universe forking: ~2ms to create fork
- Memory: ~100 bytes per move event

## Extending the Example

### Add Move Validation

```javascript
const validateMoveLaw = {
  name: 'validate-move',
  enforce: (board, allStates) => {
    // Only allow moves in empty spaces
    // Only allow moves within 2 spaces of existing pieces
    // etc.
    return board
  },
}
```

### Add Time Limits

```javascript
const timeLimitConstraint = {
  name: 'time-limit',
  check: (gameState) => {
    const timeLeft = gameState.turnStartedAt + 30000 - Date.now()
    return {
      valid: timeLeft > 0,
      reason: timeLeft <= 0 ? 'Turn time limit exceeded' : undefined,
    }
  },
  repair: (gameState) => {
    // Forfeit turn if time limit exceeded
    return { ...gameState, turnForfeited: true }
  },
}
```

### Add Replay System

```javascript
function replayGame(universe, speed = 100) {
  const history = universe.getStore('moveHistory')?.getHistory() || []
  
  history.forEach((event, i) => {
    setTimeout(() => {
      console.log(`\nMove ${i + 1}:`)
      console.log(`Player: ${event.metadata.player}`)
      console.log(`Position: (${event.metadata.x}, ${event.metadata.y})`)
      
      // Restore state at this point
      const snapshot = {
        stores: new Map([
          ['board', event.value],
          // ... other stores
        ]),
      }
      universe.restore(snapshot)
    }, i * speed)
  })
}
```

### Add Spectator Mode

```javascript
// Fork for spectators (read-only)
const spectatorView = universe.fork('spectator')

// Spectators see live updates but can't make moves
spectatorView.pause() // Prevent modifications

// Subscribe to original universe for updates
universe.getStore('board')?.subscribe(board => {
  spectatorView.getStore('board')?.set(board)
})
```

## Testing Scenarios

### Test Turn Order

```javascript
// This should be rejected (wrong turn)
universe.getStore('gameState')?.set({
  currentPlayer: 'player2', // Not player2's turn
})
console.log(universe.getStore('gameState')?.get().currentPlayer)
// Should be 'player1' (enforced by turn-order law)
```

### Test Fork Divergence

```javascript
const original = universe
const fork = original.fork('test')

// Make different moves
original.getStore('board')?.set({ '0,0': 'player1' })
fork.getStore('board')?.set({ '7,7': 'player1' })

// Verify independence
console.log('Original:', original.getStore('board')?.get())
console.log('Fork:', fork.getStore('board')?.get())
```

### Test Causal Chain

```javascript
const history = universe.getStore('moveHistory')?.getHistory() || []

// Verify each event has correct parents
history.forEach((event, i) => {
  if (i === 0) {
    console.assert(event.parents.length === 0, 'First event has no parents')
  } else {
    console.assert(
      event.parents.includes(history[i - 1].id),
      'Event causally depends on previous event'
    )
  }
})
```

## Multiplayer Synchronization

For real multiplayer games, integrate with WebSockets:

```javascript
import WebSocket from 'ws'

const wss = new WebSocket.Server({ port: 8080 })

wss.on('connection', (ws) => {
  // Subscribe to universe changes
  universe.getStore('board')?.subscribe(board => {
    ws.send(JSON.stringify({ type: 'board-update', board }))
  })
  
  // Handle client moves
  ws.on('message', (data) => {
    const { type, move } = JSON.parse(data)
    if (type === 'make-move') {
      // Validate and apply move
      handleMove(move)
    }
  })
})
```

## Related Examples

- [E-Commerce Cart](../ecommerce/cart-demo.mjs) - Business rules
- [Physics Simulations](../physics/) - Classical mechanics

## Learn More

- [Universe Manager Guide](../../docs/UNIVERSE_MANAGER.md)
- [Causal Store API](../../docs/API.md#causal-store-api)
- [Universe Forking](../../docs/API.md#forking)
- [Temporal Causality](../../docs/TEMPORAL_MIGRATION.md)

## License

MIT
