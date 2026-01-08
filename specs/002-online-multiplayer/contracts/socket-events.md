# Socket.IO Event Contracts

**Feature**: 002-online-multiplayer
**Version**: 1.0.0
**Protocol**: Socket.IO 4.7+
**Transport**: WebSocket (fallback: HTTP long-polling)

---

## Connection

### Client → Server: Initial Connection

**Event**: `connection` (automatic Socket.IO event)

**Client Setup**:
```typescript
import io from 'socket.io-client';

const socket = io('/', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000
});
```

**Server Handler**:
```typescript
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  // Register event handlers for this socket
});
```

---

## Room Management Events

### 1. Create Room

**Direction**: Client → Server
**Event Name**: `room:create`

**Payload**:
```typescript
interface CreateRoomPayload {
  sessionId: string;      // UUIDv4 from client sessionStorage
  displayName?: string;   // Optional player name (1-20 chars)
}
```

**Response** (acknowledgment callback):
```typescript
interface CreateRoomResponse {
  success: true;
  room: Room;
  yourColor: PlayerColor;  // Always RED for room creator
  shareUrl: string;        // e.g., "https://app.com/room/abc-123"
}

// OR on error
interface CreateRoomError {
  success: false;
  error: string;
}
```

**Client Example**:
```typescript
socket.emit('room:create', {
  sessionId: getSessionId(),
  displayName: 'Alice'
}, (response) => {
  if (response.success) {
    console.log('Room created:', response.shareUrl);
    // Navigate to /room/[roomId]
  } else {
    console.error('Failed to create room:', response.error);
  }
});
```

**Server Validation**:
- `sessionId` must be valid UUIDv4
- `displayName` (if provided) must be 1-20 alphanumeric characters + spaces

---

### 2. Join Room

**Direction**: Client → Server
**Event Name**: `room:join`

**Payload**:
```typescript
interface JoinRoomPayload {
  roomId: string;         // Room UUID from URL
  sessionId: string;      // Client session UUID
  displayName?: string;   // Optional player name
}
```

**Response**:
```typescript
interface JoinRoomResponse {
  success: true;
  room: Room;
  yourColor: PlayerColor;  // RED or BLACK depending on join order
}

// OR on error
interface JoinRoomError {
  success: false;
  error: 'room_full' | 'room_not_found' | 'room_ended';
  message: string;
}
```

**Client Example**:
```typescript
socket.emit('room:join', {
  roomId: roomIdFromUrl,
  sessionId: getSessionId(),
  displayName: 'Bob'
}, (response) => {
  if (response.success) {
    console.log('Joined as', response.yourColor);
    initializeGame(response.room.gameState);
  } else {
    showError(response.message);
  }
});
```

**Server Validation**:
- `roomId` must exist in rooms map
- Room must have `status !== 'ended'`
- Room must have `players.length < 2`
- `sessionId` must not already be in room (unless reconnecting)

**Side Effects**:
- Server broadcasts `player:status` to room
- Room status changes to `ACTIVE` when 2nd player joins

---

### 3. Rejoin Room (Reconnection)

**Direction**: Client → Server
**Event Name**: `room:rejoin`

**Payload**:
```typescript
interface RejoinRoomPayload {
  roomId: string;
  sessionId: string;
}
```

**Response**:
```typescript
interface RejoinRoomResponse {
  success: true;
  room: Room;
  yourColor: PlayerColor;
  gameState: GameState;  // Full state sync
}

// OR on error
interface RejoinRoomError {
  success: false;
  error: 'room_not_found' | 'session_not_in_room' | 'room_ended';
  message: string;
}
```

**Client Example**:
```typescript
// Called automatically on reconnect
socket.on('connect', () => {
  const roomId = sessionStorage.getItem('current_room_id');
  if (roomId) {
    socket.emit('room:rejoin', {
      roomId,
      sessionId: getSessionId()
    }, (response) => {
      if (response.success) {
        toast.success('Reconnected');
        gameStore.setState({ gameState: response.gameState });
      } else {
        sessionStorage.removeItem('current_room_id');
        toast.error('Game no longer available');
      }
    });
  }
});
```

**Server Behavior**:
- Find player in room by `sessionId`
- Update `socketId` to new connection
- Set `isConnected = true`
- Remove from `disconnectedPlayers` map
- Broadcast `player:status` (reconnected) to room

---

### 4. Leave Room

**Direction**: Client → Server
**Event Name**: `room:leave`

**Payload**:
```typescript
interface LeaveRoomPayload {
  roomId: string;
}
```

**Response**: None (fire-and-forget)

**Server Behavior**:
- Remove player from room
- If room becomes empty, mark for cleanup
- If game was active, end with forfeit
- Broadcast `player:status` (disconnected) to remaining player

---

## Game Events

### 5. Make Move

**Direction**: Client → Server
**Event Name**: `game:move`

**Payload**:
```typescript
interface GameMovePayload {
  move: Move;             // from/to positions, piece
  gameStateHash: string;  // Client's hash of current state (for concurrency detection)
}
```

**Response**:
```typescript
interface MoveResponse {
  success: true;
  // No additional data; server broadcasts new state via game:state event
}

// OR on error
interface MoveError {
  success: false;
  error: 'invalid_move' | 'not_your_turn' | 'state_mismatch';
  message: string;
  correctState?: GameState;  // If client state diverged
}
```

**Client Example**:
```typescript
socket.emit('game:move', {
  move: { from: {x:0, y:0}, to: {x:0, y:1}, piece: selectedPiece },
  gameStateHash: computeHash(gameState)
}, (response) => {
  if (!response.success) {
    // Rollback optimistic update
    gameStore.setState({ gameState: response.correctState });
    toast.error(response.message);
  }
});
```

**Server Validation**:
1. Verify player owns the piece (color matches session)
2. Verify it's player's turn
3. Validate move using `moveValidator.ts`
4. Verify `gameStateHash` matches (optimistic concurrency)
5. Apply move to canonical state
6. Broadcast updated state via `game:state`

**Performance Target**: Validation + broadcast <50ms

---

### 6. Use Skill

**Direction**: Client → Server
**Event Name**: `game:skill`

**Payload**:
```typescript
interface UseSkillPayload {
  skillId: string;
  targetPieceId?: string;  // For targeted skills (e.g., Han Xin's "突击")
}
```

**Response**:
```typescript
interface SkillResponse {
  success: true;
  // Server broadcasts state update via game:state
}

// OR on error
interface SkillError {
  success: false;
  error: 'skill_not_available' | 'invalid_target' | 'cooldown_active';
  message: string;
}
```

**Server Validation**:
- Verify skill belongs to player's hero
- Check cooldown and usage limits via `skillEngine.ts`
- Validate target (if applicable)
- Apply skill effects to game state
- Broadcast updated state

---

## Broadcast Events (Server → Clients)

### 7. Game State Update

**Direction**: Server → All clients in room
**Event Name**: `game:state`

**Payload**:
```typescript
interface GameStatePayload {
  gameState: GameState;  // Canonical server state
  lastMove?: Move;       // The move that caused this update
  timestamp: number;     // Server timestamp
}
```

**Client Handler**:
```typescript
socket.on('game:state', ({ gameState, lastMove }) => {
  // Update store with canonical state
  gameStore.setState({ gameState });

  // Animate opponent's move
  if (lastMove && lastMove.piece.color !== myColor) {
    animateMove(lastMove);
  }
});
```

**Broadcast Timing**: Sent after every successful move, skill use, or state-changing event

---

### 8. Player Status Update

**Direction**: Server → All clients in room
**Event Name**: `player:status`

**Payload**:
```typescript
interface PlayerStatusPayload {
  playerId: string;       // sessionId of affected player
  status: 'connected' | 'disconnected' | 'reconnected';
  displayName: string;
  timestamp: number;
}
```

**Client Handler**:
```typescript
socket.on('player:status', ({ status, displayName }) => {
  switch (status) {
    case 'connected':
      toast.success(`${displayName} joined`);
      break;
    case 'disconnected':
      toast.warning(`${displayName} disconnected`);
      break;
    case 'reconnected':
      toast.success(`${displayName} reconnected`);
      break;
  }
});
```

**Triggered By**:
- Player joins room → `connected`
- Socket disconnects → `disconnected`
- Player rejoins → `reconnected`
- Player leaves voluntarily → `disconnected`

---

### 9. Game End

**Direction**: Server → All clients in room
**Event Name**: `game:end`

**Payload**:
```typescript
interface GameEndPayload {
  result: 'checkmate' | 'stalemate' | 'forfeit' | 'timeout';
  winner?: PlayerColor;  // Undefined for stalemate
  timestamp: number;
}
```

**Client Handler**:
```typescript
socket.on('game:end', ({ result, winner }) => {
  sessionStorage.removeItem('current_room_id');

  if (result === 'checkmate') {
    showModal(`${winner} wins by checkmate!`);
  } else if (result === 'forfeit') {
    showModal(`${winner} wins by forfeit`);
  } else {
    showModal('Game ended in stalemate');
  }
});
```

**Triggered By**:
- Checkmate detected in move validation
- Player disconnects >5 minutes → forfeit
- Room inactive >30 minutes → timeout
- Manual game abandonment

---

## Error Events

### 10. General Error

**Direction**: Server → Client
**Event Name**: `error`

**Payload**:
```typescript
interface ErrorPayload {
  code: string;           // Error code (e.g., "ROOM_NOT_FOUND")
  message: string;        // Human-readable error
  timestamp: number;
}
```

**Client Handler**:
```typescript
socket.on('error', ({ code, message }) => {
  console.error(`Socket error [${code}]:`, message);
  toast.error(message);
});
```

---

## Connection Events (Socket.IO built-in)

### 11. Connect

**Event**: `connect`
**Client Handler**:
```typescript
socket.on('connect', () => {
  console.log('Connected to server');
  attemptRejoinIfNeeded();
});
```

---

### 12. Disconnect

**Event**: `disconnect`
**Client Handler**:
```typescript
socket.on('disconnect', (reason) => {
  console.warn('Disconnected:', reason);
  gameStore.setState({ isOnline: false });

  if (reason === 'io server disconnect') {
    // Server forcibly disconnected; manual reconnect needed
    toast.error('Server disconnected you');
  } else {
    // Network issue; auto-reconnect will trigger
    toast.warning('Connection lost, reconnecting...');
  }
});
```

---

### 13. Reconnect Attempt

**Event**: `reconnect_attempt`
**Client Handler**:
```typescript
socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`Reconnection attempt ${attemptNumber}...`);
});
```

---

### 14. Reconnect Failed

**Event**: `reconnect_failed`
**Client Handler**:
```typescript
socket.on('reconnect_failed', () => {
  toast.error('Unable to reconnect. Please refresh the page.');
});
```

---

## Event Flow Diagrams

### Create and Join Flow
```
Client A                    Server                     Client B
   │                          │                           │
   │─── room:create ─────────→│                           │
   │←─── room:created ────────│                           │
   │                          │                           │
   │                          │←──── room:join ───────────│
   │                          │                           │
   │                          │───── room:joined ────────→│
   │←─ player:status ─────────│                           │
   │                          │───── player:status ──────→│
   │←─ game:state ────────────│                           │
   │                          │───── game:state ─────────→│
```

### Move Flow (Optimistic Update)
```
Client (Local)                Server                 Client (Opponent)
   │                            │                          │
   │ [Optimistic render] ◄──────┼────────────────────────  │
   │─── game:move ─────────────→│                          │
   │                            │ [Validate move]          │
   │                            │                          │
   │←─ ack({success:true}) ─────│                          │
   │                            │                          │
   │←─ game:state ──────────────│                          │
   │                            │──── game:state ─────────→│
   │                            │                          │ [Render move]
```

### Reconnection Flow
```
Client                       Server
   │                           │
   │ [disconnect]              │
   │                           │─── player:status(disconnected) → Other Client
   │                           │
   │ [auto-reconnect]          │
   │─── connect ──────────────→│
   │                           │
   │─── room:rejoin ──────────→│
   │                           │
   │←─── ack({gameState}) ─────│
   │                           │
   │                           │─── player:status(reconnected) → Other Client
```

---

## Message Size Estimates

| Event | Typical Payload Size | Notes |
|-------|---------------------|-------|
| `room:create` | ~50 bytes | UUID + short name |
| `room:join` | ~70 bytes | UUID + UUID + name |
| `game:move` | ~200 bytes | Move object + hash |
| `game:state` | ~2-5 KB | Full game state with 32 pieces |
| `player:status` | ~100 bytes | UUID + status enum |
| `game:end` | ~80 bytes | Result + winner |

**Total bandwidth per game**: ~50-100 KB (20-40 moves × 2-5KB per state broadcast)

---

## Security Considerations

1. **Server-Side Validation**: All game logic validated server-side; client input is untrusted
2. **Session Binding**: Moves validated against `sessionId` to prevent impersonation
3. **Rate Limiting**: Max 10 moves/minute per session (prevents spam)
4. **State Hashing**: `gameStateHash` prevents race conditions from concurrent moves
5. **No Sensitive Data**: No authentication tokens or personal data in messages

---

## Contract Versioning

**Version**: 1.0.0
**Breaking Changes**: Will increment major version (2.0.0)
**Backward Compatibility**: Server will support v1.x for 6 months after v2 release

---

**Contract complete. All Socket.IO events documented with TypeScript types, examples, and validation rules.**
