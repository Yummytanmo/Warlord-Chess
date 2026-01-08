# Research: Online Multiplayer Implementation

**Feature**: 002-online-multiplayer
**Date**: 2026-01-07
**Status**: Complete

## Overview

This document consolidates research findings for implementing real-time multiplayer functionality in a Next.js chess application. Research focused on WebSocket technology selection, reconnection strategies, authentication approaches, and room timeout policies.

---

## 1. Communication Protocol Selection

### Decision: Socket.IO over WebSocket API

**Rationale**:
- **Automatic reconnection**: Built-in exponential backoff reconnection (critical for mobile networks)
- **Fallback mechanisms**: Degrades to HTTP long-polling if WebSocket blocked by firewall/proxy
- **Room abstraction**: Native room/namespace support simplifies broadcasting to specific game sessions
- **Message acknowledgment**: Built-in ack callbacks ensure critical messages (moves) are delivered
- **TypeScript support**: Excellent type inference for client/server events
- **Bundle size**: ~25KB gzipped (acceptable for feature value)

**Alternatives Considered**:

1. **Native WebSocket API**
   - **Rejected because**: No automatic reconnection, no fallback transport, requires manual room management
   - **Benefit**: Smaller bundle size (~0KB, native browser API)
   - **Why insufficient**: Reconnection logic is complex and error-prone; mobile users would experience poor experience during network transitions

2. **Server-Sent Events (SSE)**
   - **Rejected because**: Unidirectional (server → client), requires separate HTTP POST for client → server moves
   - **Benefit**: Simpler than WebSocket for one-way data
   - **Why insufficient**: Chess requires bidirectional low-latency communication; HTTP POST for moves adds 200-500ms overhead

3. **WebRTC Data Channels**
   - **Rejected because**: Peer-to-peer architecture enables cheating (client can modify game state), complex NAT traversal
   - **Benefit**: No server bandwidth cost after connection established
   - **Why insufficient**: Server-authoritative validation required to prevent cheating (constitution requirement)

**Implementation Pattern**:
```typescript
// Server (Next.js API Route)
import { Server } from 'socket.io';

const io = new Server(httpServer, {
  cors: { origin: process.env.NEXT_PUBLIC_APP_URL }
});

io.on('connection', (socket) => {
  socket.on('game:move', async (move, ack) => {
    // Validate move server-side
    // Broadcast to room
    // Send acknowledgment
    ack({ success: true });
  });
});

// Client
import io from 'socket.io-client';

const socket = io('/', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});
```

---

## 2. Room Timeout Duration

### Decision: 30-minute inactive timeout, 5-minute disconnection grace period

**Rationale**:
- **30-minute room timeout**: Balances server resource usage with legitimate slow games (players thinking)
- **5-minute grace period**: Accommodates temporary network issues, phone calls, page refresh without ending game
- **Activity definition**: Any move, skill use, or chat message resets timeout; mere connection does not

**Alternatives Considered**:

1. **60-minute timeout**
   - **Rejected because**: Excessive server resource allocation for abandoned games
   - **Scenario**: Player creates room, shares link, friend never joins → room wastes memory for 1 hour

2. **10-minute timeout**
   - **Rejected because**: Legitimate chess games can have 5-10 minute think periods; would frustrate players
   - **Scenario**: Player thinking about complex endgame position → kicked for inactivity

3. **No timeout (manual cleanup only)**
   - **Rejected because**: Memory leak risk; server would accumulate abandoned rooms indefinitely

**Implementation Strategy**:
```typescript
interface Room {
  id: string;
  createdAt: number;
  lastActivityAt: number;
  disconnectedPlayers: Map<string, number>; // playerId → disconnectTime
}

// Cleanup job runs every 1 minute
setInterval(() => {
  const now = Date.now();
  rooms.forEach((room, roomId) => {
    // Remove rooms inactive for 30 minutes
    if (now - room.lastActivityAt > 30 * 60 * 1000) {
      cleanupRoom(roomId);
    }
    // End games where player disconnected >5 minutes ago
    room.disconnectedPlayers.forEach((disconnectTime, playerId) => {
      if (now - disconnectTime > 5 * 60 * 1000) {
        forfeitGame(roomId, playerId);
      }
    });
  });
}, 60000);
```

---

## 3. Authentication Strategy

### Decision: Anonymous sessions with optional display names (no accounts required)

**Rationale**:
- **Zero friction onboarding**: Players can create/join games instantly via shared link (aligns with "player experience first" principle)
- **Session-based identity**: Generate unique session ID on first connection, store in sessionStorage for reconnection
- **Optional personalization**: Allow players to set display name in lobby (defaults to "Player 1"/"Player 2")
- **Future migration path**: Can add optional account linking later without breaking anonymous flow

**Alternatives Considered**:

1. **Required user accounts (email/password)**
   - **Rejected because**: Massive onboarding friction; user must register before playing with friend
   - **Use case**: Alice sends link to Bob → Bob must create account → Alice waits → poor experience
   - **Why insufficient**: Contradicts "player experience first" principle; adds 2-5 minute delay before first game

2. **OAuth (Google/Discord)**
   - **Rejected because**: Still requires authentication flow; some users lack Google/Discord accounts
   - **Benefit**: Persistent identity across devices
   - **Why insufficient**: Adds complexity and friction for casual play; can be added as optional enhancement later

3. **Guest names only (no session persistence)**
   - **Rejected because**: Cannot support reconnection (no way to identify returning player)
   - **Why insufficient**: Disconnection handling is critical (mobile networks, page refresh); session ID required

**Implementation Pattern**:
```typescript
// Client: Generate/retrieve session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('chess_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('chess_session_id', sessionId);
  }
  return sessionId;
}

// Server: Track sessions
interface PlayerSession {
  sessionId: string;      // For reconnection
  socketId: string;       // Current connection
  displayName: string;    // Optional (default "Player 1")
  color: PlayerColor;     // Assigned when joining room
  connectedAt: number;
}

socket.on('room:join', ({ roomId, sessionId, displayName }) => {
  // Check if sessionId already in room (reconnection)
  const existingPlayer = room.players.find(p => p.sessionId === sessionId);
  if (existingPlayer) {
    existingPlayer.socketId = socket.id; // Update connection
    socket.emit('room:rejoined', { ...room, yourColor: existingPlayer.color });
  } else {
    // New player
    const color = room.players.length === 0 ? PlayerColor.RED : PlayerColor.BLACK;
    room.players.push({ sessionId, socketId: socket.id, displayName, color });
    socket.emit('room:joined', { ...room, yourColor: color });
  }
});
```

---

## 4. State Synchronization Architecture

### Decision: Server-authoritative with optimistic client updates

**Rationale**:
- **Server authority**: All moves validated server-side using existing `moveValidator.ts` (prevents cheating, ensures consistency)
- **Optimistic UI**: Local player's move renders immediately, rollback if server rejects (maintains 60fps responsiveness)
- **Eventual consistency**: Server broadcasts canonical state after each move; clients reconcile

**Pattern**:
```typescript
// Client: Optimistic update
async function makeMove(from: Position, to: Position) {
  // 1. Optimistically update local UI
  gameStore.setState({
    pieces: applyMoveLocally(from, to),
    pendingMove: { from, to }
  });

  // 2. Send to server for validation
  socket.emit('game:move', { from, to, gameStateHash }, (response) => {
    if (response.success) {
      // Server accepted; clear pending state
      gameStore.setState({ pendingMove: null });
    } else {
      // Server rejected; rollback
      gameStore.setState({
        pieces: response.correctState.pieces,
        pendingMove: null
      });
      toast.error('Invalid move');
    }
  });
}

// Server: Validate and broadcast
socket.on('game:move', async (moveData, ack) => {
  const room = rooms.get(socket.roomId);
  const isValid = moveValidator.validate(room.gameState, moveData);

  if (isValid) {
    // Apply move to canonical state
    room.gameState = gameManager.applyMove(room.gameState, moveData);

    // Broadcast to room (including sender for reconciliation)
    io.to(socket.roomId).emit('game:state', room.gameState);

    // Acknowledge sender
    ack({ success: true });
  } else {
    // Reject and send correct state
    ack({ success: false, correctState: room.gameState });
  }
});
```

---

## 5. Reconnection Strategy

### Decision: Automatic reconnection with game state recovery

**Rationale**:
- **Socket.IO auto-reconnect**: Handles network transitions automatically (mobile data ↔ WiFi)
- **Session-based recovery**: Server recognizes returning sessionId, restores player's color and room
- **State resync**: Client fetches latest game state after reconnection
- **Grace period**: 5 minutes before opponent notified of forfeit

**Edge Cases Handled**:

1. **Page refresh during game**
   - sessionId persists in sessionStorage → rejoin same room
   - Server sends full game state including move history

2. **Both players disconnect simultaneously**
   - Game state persists in server memory for 5 minutes
   - First to reconnect resumes; second reconnects to active game

3. **Disconnection during move animation**
   - Server state is canonical; client resyncs on reconnect
   - Animation replays from server state (may skip if already completed)

**Implementation**:
```typescript
// Client: Handle reconnection
socket.on('connect', () => {
  const sessionId = getSessionId();
  const roomId = sessionStorage.getItem('current_room_id');

  if (roomId) {
    // Attempt to rejoin previous room
    socket.emit('room:rejoin', { roomId, sessionId }, (response) => {
      if (response.success) {
        gameStore.setState({
          gameState: response.gameState,
          roomId: roomId,
          isOnline: true
        });
        toast.success('Reconnected to game');
      } else {
        toast.error('Game no longer available');
        sessionStorage.removeItem('current_room_id');
      }
    });
  }
});

socket.on('disconnect', () => {
  gameStore.setState({ isOnline: false });
  toast.error('Connection lost. Reconnecting...');
});
```

---

## 6. Scalability Considerations (Future)

### Current: In-memory room storage (single server instance)

**Rationale for MVP**:
- Simple implementation; no external dependencies
- Sufficient for 10-50 concurrent rooms (20-100 users)
- Rooms stored in `Map<string, Room>` in API route memory

**Limitations**:
- Lost on server restart
- Cannot scale horizontally (sticky sessions required)

### Future: Redis adapter for multi-server scaling

**When to migrate**: >100 concurrent rooms or need zero-downtime deploys

**Pattern**:
```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

**Benefits**:
- Rooms persist across server restarts
- Horizontal scaling via load balancer
- Pub/sub enables cross-server room broadcasting

---

## 7. Testing Strategy

### Unit Tests (Vitest)
- `roomManager.ts`: Room CRUD, player join/leave logic, timeout enforcement
- `socketServer.ts`: Event handler logic (mocked Socket.IO)

### Integration Tests (Vitest + real Socket.IO)
- Two-client simulation: Create room → join → exchange moves → verify state sync
- Disconnection scenarios: Drop connection → reconnect → verify state restoration

### Property Tests (fast-check)
- **Invariant**: All clients in room have identical game state after move broadcast
- **Invariant**: Move sequence is totally ordered (no race conditions on simultaneous moves)
- **Invariant**: Disconnection/reconnection preserves game state

### E2E Tests (Playwright)
- Multi-context test: Open two browser tabs, create room in tab 1, join from tab 2, play full game
- Network simulation: Throttle connection → verify UI shows "reconnecting" → restore → verify game continues

---

## 8. Best Practices Research

### Socket.IO in Next.js 14 App Router

**Challenge**: Next.js 14 API routes are serverless by default (incompatible with stateful WebSocket server)

**Solution**: Custom server or API route with singleton pattern

**Pattern** (API route with singleton):
```typescript
// src/app/api/socket/route.ts
import { Server } from 'socket.io';
import type { NextApiRequest } from 'next';
import type { Server as HTTPServer } from 'http';

let io: Server;

export function GET(req: Request) {
  if (!io) {
    const httpServer: HTTPServer = (req as any).socket.server;
    io = new Server(httpServer);
    setupSocketHandlers(io); // Room management logic
  }

  return new Response('Socket.IO server running', { status: 200 });
}
```

**Alternative**: Custom server (more complex, better for production)
```typescript
// server.js
const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(handle);
  const io = new Server(server);

  setupSocketHandlers(io);

  server.listen(3000);
});
```

### Move Validation Performance

**Concern**: Server-side move validation must complete in <50ms (target 200ms total latency)

**Optimization**: Existing `moveValidator.ts` is synchronous and fast (tested at <5ms per move)

**No changes needed**: Current implementation sufficient for multiplayer

---

## Summary Table

| Requirement | Decision | Rationale |
|------------|----------|-----------|
| **Communication Protocol** | Socket.IO | Auto-reconnect, fallback transport, room abstraction, ack callbacks |
| **Room Timeout** | 30min inactive / 5min disconnect | Balances resource usage with legitimate slow games |
| **Authentication** | Anonymous sessions (sessionStorage) | Zero friction, supports reconnection, optional display names |
| **State Sync** | Server-authoritative + optimistic UI | Prevents cheating, maintains 60fps responsiveness |
| **Reconnection** | Auto-reconnect with state recovery | Handles mobile networks, page refresh, temporary disconnects |
| **Storage (MVP)** | In-memory (Map) | Simple, sufficient for 10-50 rooms |
| **Storage (Future)** | Redis adapter | Horizontal scaling, persistence across deploys |
| **Next.js Integration** | API route singleton | Compatible with App Router, simpler than custom server |

---

**All NEEDS CLARIFICATION items from spec.md resolved. Proceeding to Phase 1 (Design).**
