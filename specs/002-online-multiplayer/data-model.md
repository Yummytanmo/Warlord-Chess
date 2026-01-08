# Data Model: Online Multiplayer

**Feature**: 002-online-multiplayer
**Date**: 2026-01-07
**Status**: Complete

## Overview

This document defines the data structures for online multiplayer functionality. All models use TypeScript interfaces with strict typing. Models are separated into:
- **Core Multiplayer Entities**: Room, PlayerSession, NetworkMessage
- **Extended Game Entities**: Reuse existing GameState, Move, Piece from `/src/types/game.ts`

---

## Core Multiplayer Entities

### Room

Represents a game session that can hold up to 2 players.

```typescript
/**
 * Enum for room lifecycle states
 */
export enum RoomStatus {
  WAITING = 'waiting',    // Created, waiting for second player
  ACTIVE = 'active',      // Both players joined, game in progress
  ENDED = 'ended'         // Game completed or abandoned
}

/**
 * Main room entity stored on server
 */
export interface Room {
  /** Unique room identifier (UUIDv4) */
  id: string;

  /** Room lifecycle status */
  status: RoomStatus;

  /** Players in this room (max 2) */
  players: PlayerSession[];

  /** Current game state (reuses existing GameState type) */
  gameState: GameState;

  /** Unix timestamp when room was created */
  createdAt: number;

  /** Unix timestamp of last activity (move, skill use, chat) */
  lastActivityAt: number;

  /** Map of disconnected player IDs to disconnect timestamp */
  disconnectedPlayers: Map<string, number>;

  /** Optional display settings (future: time limits, rated, etc.) */
  settings?: RoomSettings;
}

/**
 * Optional room configuration (future extensibility)
 */
export interface RoomSettings {
  /** Time limit per player in seconds (0 = no limit) */
  timeLimit?: number;

  /** Allow spectators (future feature) */
  allowSpectators?: boolean;

  /** Require specific hero selections */
  restrictedHeroes?: string[];
}
```

**Validation Rules**:
- `id`: Must be valid UUIDv4
- `players.length`: 0-2 (enforced by join logic)
- `status`: WAITING when players.length === 1, ACTIVE when === 2, ENDED when game completed
- `lastActivityAt`: Updated on every move, skill use, chat message
- `disconnectedPlayers`: Entry removed when player reconnects; room cleaned up if disconnect >5min

**State Transitions**:
```
┌─────────┐  join (1st player)  ┌─────────┐  join (2nd player)  ┌────────┐
│ (none)  │ ──────────────────→ │ WAITING │ ──────────────────→ │ ACTIVE │
└─────────┘                      └─────────┘                      └────────┘
                                     │                                │
                                     │ timeout (30min)                │ game end / timeout
                                     ↓                                ↓
                                 ┌───────┐ ←──────────────────────────┘
                                 │ ENDED │
                                 └───────┘
```

---

### PlayerSession

Represents a connected player within a room.

```typescript
/**
 * Player connection and identity within a room
 */
export interface PlayerSession {
  /** Unique session identifier (persists across reconnections) */
  sessionId: string;

  /** Current Socket.IO connection ID (changes on reconnect) */
  socketId: string;

  /** Assigned chess color (determined when joining room) */
  color: PlayerColor; // Reuse existing enum: RED | BLACK

  /** Optional display name (defaults to "Player 1"/"Player 2") */
  displayName: string;

  /** Unix timestamp when player joined room */
  joinedAt: number;

  /** Whether player is currently connected */
  isConnected: boolean;
}
```

**Validation Rules**:
- `sessionId`: Must be valid UUIDv4, generated client-side, stored in sessionStorage
- `socketId`: Provided by Socket.IO on connection
- `color`: First player gets RED, second gets BLACK (enforced in join handler)
- `displayName`: 1-20 characters, alphanumeric + spaces, defaults to "Player {1|2}"
- `isConnected`: Set to false on disconnect event, true on reconnect

**Relationships**:
- Belongs to exactly one `Room`
- Maps to exactly one `Player` in `GameState.players[]` via `color`

---

### NetworkMessage

Discriminated union for all Socket.IO events. Uses TypeScript discriminated unions for type safety.

```typescript
/**
 * Base message interface
 */
interface BaseMessage {
  /** Message type discriminator */
  type: string;

  /** Unix timestamp when message was sent */
  timestamp: number;
}

/**
 * Client → Server: Create new room
 */
export interface CreateRoomMessage extends BaseMessage {
  type: 'room:create';
  sessionId: string;
  displayName?: string;
}

/**
 * Client → Server: Join existing room
 */
export interface JoinRoomMessage extends BaseMessage {
  type: 'room:join';
  roomId: string;
  sessionId: string;
  displayName?: string;
}

/**
 * Client → Server: Attempt to rejoin after disconnect
 */
export interface RejoinRoomMessage extends BaseMessage {
  type: 'room:rejoin';
  roomId: string;
  sessionId: string;
}

/**
 * Client → Server: Make a move
 */
export interface GameMoveMessage extends BaseMessage {
  type: 'game:move';
  move: Move; // Reuse existing Move type
  gameStateHash: string; // SHA-256 hash for optimistic concurrency control
}

/**
 * Client → Server: Use hero skill
 */
export interface UseSkillMessage extends BaseMessage {
  type: 'game:skill';
  skillId: string;
  targetPieceId?: string; // For targeted skills
}

/**
 * Server → Client: Room created successfully
 */
export interface RoomCreatedMessage extends BaseMessage {
  type: 'room:created';
  room: Room;
  yourColor: PlayerColor;
  shareUrl: string; // Full URL to share with opponent
}

/**
 * Server → Client: Successfully joined room
 */
export interface RoomJoinedMessage extends BaseMessage {
  type: 'room:joined';
  room: Room;
  yourColor: PlayerColor;
}

/**
 * Server → Client: Failed to join room
 */
export interface RoomJoinErrorMessage extends BaseMessage {
  type: 'room:join_error';
  reason: 'room_full' | 'room_not_found' | 'room_ended';
  message: string;
}

/**
 * Server → Client: Game state update (broadcast to room)
 */
export interface GameStateUpdateMessage extends BaseMessage {
  type: 'game:state';
  gameState: GameState; // Canonical server state
  lastMove?: Move;
}

/**
 * Server → Client: Move validation result (ack response)
 */
export interface MoveResultMessage {
  success: boolean;
  error?: string;
  correctState?: GameState; // Sent if client state diverged
}

/**
 * Server → Client: Opponent connected/disconnected
 */
export interface PlayerStatusMessage extends BaseMessage {
  type: 'player:status';
  playerId: string;
  status: 'connected' | 'disconnected' | 'reconnected';
  displayName: string;
}

/**
 * Server → Client: Game ended
 */
export interface GameEndMessage extends BaseMessage {
  type: 'game:end';
  result: 'checkmate' | 'stalemate' | 'forfeit' | 'timeout';
  winner?: PlayerColor;
}

/**
 * Union type for all network messages (enables exhaustive type checking)
 */
export type NetworkMessage =
  | CreateRoomMessage
  | JoinRoomMessage
  | RejoinRoomMessage
  | GameMoveMessage
  | UseSkillMessage
  | RoomCreatedMessage
  | RoomJoinedMessage
  | RoomJoinErrorMessage
  | GameStateUpdateMessage
  | PlayerStatusMessage
  | GameEndMessage;
```

**Type Safety Pattern**:
```typescript
// Exhaustive type checking in message handlers
function handleMessage(msg: NetworkMessage) {
  switch (msg.type) {
    case 'room:create':
      // TypeScript knows msg.sessionId exists
      return handleCreateRoom(msg.sessionId, msg.displayName);

    case 'game:move':
      // TypeScript knows msg.move exists
      return handleMove(msg.move, msg.gameStateHash);

    // ... other cases

    default:
      // TypeScript error if any case is missing
      const _exhaustive: never = msg;
      throw new Error(`Unhandled message type: ${(msg as any).type}`);
  }
}
```

---

## Reused Entities

These entities are already defined in `/src/types/game.ts` and will be reused without modification:

### GameState
```typescript
export interface GameState {
  id: string;
  board: Board;
  currentTurn: PlayerColor;
  players: Player[];
  moveHistory: Move[];
  capturedPieces: Piece[];
  phase: GamePhase;
  skillStates: SkillState[];
  checkState: CheckState;
}
```
**Usage in Multiplayer**: Stored in `Room.gameState`, authoritative server copy, broadcast to clients after each move.

### Move
```typescript
export interface Move {
  piece: Piece;
  from: Position;
  to: Position;
  capturedPiece?: Piece;
  isCheck?: boolean;
  isCheckmate?: boolean;
  skillUsed?: string;
}
```
**Usage in Multiplayer**: Sent in `GameMoveMessage`, validated server-side, broadcast in `GameStateUpdateMessage.lastMove`.

### PlayerColor
```typescript
export enum PlayerColor {
  RED = 'red',
  BLACK = 'black'
}
```
**Usage in Multiplayer**: Assigned in `PlayerSession.color`, determines turn order, used in `GameEndMessage.winner`.

---

## Client-Side Storage

Data persisted in browser storage for reconnection:

### sessionStorage
```typescript
interface ClientSessionData {
  /** Player's session ID (generated once, reused for reconnection) */
  chess_session_id: string; // UUIDv4

  /** Currently active room ID (cleared when leaving room) */
  current_room_id?: string;

  /** Preferred display name (persisted across games) */
  display_name?: string;
}
```

**Persistence Rules**:
- `chess_session_id`: Generated on first visit, never cleared (survives page refresh, lost on tab close)
- `current_room_id`: Set when joining room, cleared when leaving or game ends
- `display_name`: Set in lobby, reused for subsequent games

**Security Note**: sessionStorage (not localStorage) prevents session hijacking across tabs.

---

## Server-Side Storage (MVP)

In-memory storage for MVP (single server instance):

```typescript
// Server global state
const rooms = new Map<string, Room>();
const playerSockets = new Map<string, string>(); // sessionId → current socketId
```

**Cleanup Logic**:
```typescript
// Runs every 60 seconds
setInterval(() => {
  const now = Date.now();

  rooms.forEach((room, roomId) => {
    // Delete rooms with no activity for 30 minutes
    if (now - room.lastActivityAt > 30 * 60 * 1000) {
      rooms.delete(roomId);
      return;
    }

    // Forfeit games where player disconnected >5 minutes ago
    room.disconnectedPlayers.forEach((disconnectTime, sessionId) => {
      if (now - disconnectTime > 5 * 60 * 1000) {
        endGameByForfeit(room, sessionId);
        rooms.delete(roomId);
      }
    });
  });
}, 60000);
```

---

## Database Schema (Future: Redis)

When migrating to Redis for scalability:

### Room Storage (Hash)
```
Key: room:{roomId}
Fields:
  - id: string
  - status: string
  - players: JSON (PlayerSession[])
  - gameState: JSON
  - createdAt: number
  - lastActivityAt: number
  - disconnectedPlayers: JSON (Map)
Expiry: 30 minutes (TTL refreshed on activity)
```

### Session Mapping (String)
```
Key: session:{sessionId}
Value: current socketId
Expiry: 5 minutes (refreshed on heartbeat)
```

### Room Index (Set)
```
Key: rooms:active
Members: roomId (all ACTIVE rooms)
```

**Migration Path**: Introduce `StorageAdapter` interface, swap in-memory Map with Redis client.

---

## Validation Summary

| Entity | Key Constraints | Validation Location |
|--------|----------------|-------------------|
| **Room** | id (UUIDv4), players.length ≤ 2, status transitions | Server: roomManager.ts |
| **PlayerSession** | sessionId (UUIDv4), color (RED\|BLACK), displayName (1-20 chars) | Server: join handler |
| **Move** | Existing chess rules (moveValidator.ts) | Server: game:move handler |
| **NetworkMessage** | Type discriminator, required fields per type | TypeScript compile-time |
| **sessionStorage** | chess_session_id (UUIDv4), current_room_id (exists in rooms) | Client: socketClient.ts |

---

**Data model complete. All entities type-safe, relationships defined, validation rules specified.**
