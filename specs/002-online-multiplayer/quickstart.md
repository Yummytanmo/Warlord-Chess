# Quickstart: Testing Online Multiplayer Locally

**Feature**: 002-online-multiplayer
**Audience**: Developers testing multiplayer functionality
**Prerequisites**: Node.js 18+, npm, Chess project cloned

---

## Setup Instructions

### 1. Install Dependencies

Socket.IO is already in package.json, but ensure all deps are installed:

```bash
npm install
```

**New dependency** (if not present):
```bash
npm install socket.io socket.io-client
```

---

### 2. Start Development Server

The Next.js dev server will run both the frontend and WebSocket server:

```bash
npm run dev
```

**Expected output**:
```
- Local:        http://localhost:3000
- Socket.IO server initialized
```

**Note**: The WebSocket server runs on the same port as Next.js via an API route at `/api/socket`.

---

## Testing Two-Player Flow

### Option A: Two Browser Windows (Same Machine)

**Recommended for quick testing**

1. **Open first browser window** (Chrome):
   ```
   http://localhost:3000
   ```

2. **Create a room**:
   - Click "Create Room" button
   - You'll be redirected to `/room/[roomId]`
   - **Copy the full URL** from address bar (e.g., `http://localhost:3000/room/abc-123`)

3. **Open second browser window** (Chrome Incognito or Firefox):
   ```
   Paste the room URL: http://localhost:3000/room/abc-123
   ```

4. **Play the game**:
   - Window 1: You are RED (moves first)
   - Window 2: You are BLACK (waits for RED's move)
   - Make moves in each window and verify they sync in real-time

**Expected behavior**:
- ✅ Both players see the same board state
- ✅ Moves appear in opponent's window <200ms
- ✅ Turn indicator shows whose turn it is
- ✅ Connection status shows "Connected" for both players

---

### Option B: Two Separate Devices (Local Network)

**Recommended for mobile testing**

1. **Find your local IP address**:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1

   # Windows
   ipconfig | findstr IPv4
   ```
   Example output: `192.168.1.100`

2. **Update Next.js to listen on network**:

   Edit `package.json`:
   ```json
   "scripts": {
     "dev": "next dev -H 0.0.0.0"
   }
   ```

   Or run directly:
   ```bash
   npm run dev -- -H 0.0.0.0
   ```

3. **Open on Device 1** (laptop):
   ```
   http://192.168.1.100:3000
   ```
   Create a room and get the share URL

4. **Open on Device 2** (phone/tablet):
   ```
   http://192.168.1.100:3000/room/abc-123
   ```

5. **Test mobile responsiveness** while playing

---

## Testing Reconnection

### Simulate Network Disconnect

**Chrome DevTools method**:

1. Open Chrome DevTools (F12) in one player's window
2. Go to **Network** tab
3. Select **Offline** from throttling dropdown
4. Wait 2-3 seconds (you should see "Connection lost, reconnecting..." toast)
5. Select **No throttling** to restore connection
6. Verify player reconnects and game state is restored

**Expected behavior**:
- ✅ Disconnected player sees "Connection lost" message
- ✅ Opponent sees "[Player] disconnected" message
- ✅ After reconnection, both players see latest game state
- ✅ Game continues from where it left off

---

### Simulate Page Refresh

1. Player 1 makes a move
2. Player 2 refreshes the page (Cmd+R / Ctrl+R)
3. Verify Player 2 rejoins the same game automatically
4. Verify board state matches Player 1's view

**Expected behavior**:
- ✅ `sessionStorage` persists `current_room_id`
- ✅ Client automatically calls `room:rejoin` on reconnect
- ✅ Player 2 sees full game state including move history

---

## Testing Edge Cases

### Case 1: Second Player Joins Full Room

1. Create room in Window 1
2. Join room in Window 2 (game starts)
3. Open Window 3 and try to join same room URL

**Expected**: Window 3 shows "Room is full" error message

---

### Case 2: Join Non-Existent Room

1. Navigate to `http://localhost:3000/room/invalid-id`

**Expected**: Shows "Room not found" error with button to return home

---

### Case 3: Creator Leaves Before Second Player Joins

1. Create room in Window 1
2. Close Window 1 before anyone joins
3. Try to join from Window 2 using the room URL

**Expected**: Room is cleaned up; Window 2 shows "Room not found"

---

### Case 4: Timeout After 30 Minutes

Automated, but can be simulated:

1. Edit `roomManager.ts` to reduce timeout (e.g., 2 minutes)
2. Create room and don't make any moves
3. Wait 2 minutes

**Expected**: Room is deleted, players receive "Game ended by timeout"

---

## Debugging Tips

### View Socket.IO Events in Real-Time

**Client-side** (browser console):
```javascript
// Enable debug logging
localStorage.debug = 'socket.io-client:socket';

// Refresh page to see all events logged
```

**Server-side** (terminal):
```bash
DEBUG=socket.io:* npm run dev
```

---

### Inspect Room State

**Server** (add temporary logging to `roomManager.ts`):
```typescript
// In room:join handler
console.log('Current rooms:', Array.from(rooms.entries()));
```

**Client** (browser console):
```javascript
// View current game state
console.log(useGameStore.getState().gameState);

// View connection status
console.log({
  isOnline: useGameStore.getState().isOnline,
  roomId: useGameStore.getState().roomId
});
```

---

### Common Issues

**Issue**: "Socket.IO server not initialized"
**Solution**: Ensure you've created `/src/app/api/socket/route.ts` with server initialization

**Issue**: Moves not syncing between windows
**Solution**: Check both windows are connected to same room ID (inspect URL)

**Issue**: "CORS error" when connecting from different device
**Solution**: Update Socket.IO CORS config:
```typescript
const io = new Server(httpServer, {
  cors: {
    origin: '*', // For local testing only
    methods: ['GET', 'POST']
  }
});
```

**Issue**: Reconnection not working after refresh
**Solution**: Check sessionStorage has `chess_session_id` and `current_room_id`

---

## Running Automated Tests

### Unit Tests (Room Logic)

```bash
npm test src/test/unit/roomManager.test.ts
```

**Expected**: All room creation, join, and timeout logic passes

---

### Integration Tests (Socket.IO)

```bash
npm test src/test/unit/socketIntegration.test.ts
```

**Expected**: Two-client simulation passes (create → join → move → sync)

---

### Property Tests (State Sync)

```bash
npm test src/test/properties/network-sync.test.ts
```

**Expected**: State synchronization invariants hold across random move sequences

---

### E2E Tests (Full Flow)

```bash
npm run test:e2e -- multiplayer-flow.spec.ts
```

**Expected**: Playwright orchestrates two browser contexts, plays full game

**Note**: Requires dev server to be running (`npm run dev`)

---

## Performance Profiling

### Measure Move Latency

**Client-side** (browser console):
```javascript
const start = performance.now();

socket.emit('game:move', moveData, (response) => {
  const latency = performance.now() - start;
  console.log(`Move round-trip: ${latency}ms`);
});
```

**Target**: <200ms on localhost, <500ms on local network

---

### Measure State Broadcast Size

**Server** (add logging):
```typescript
socket.on('game:move', async (move, ack) => {
  // After validation
  const stateJson = JSON.stringify(room.gameState);
  console.log(`State broadcast size: ${stateJson.length} bytes`);

  io.to(roomId).emit('game:state', room.gameState);
});
```

**Target**: <5KB per state update

---

## Next Steps

After verifying basic multiplayer works:

1. **Add hero skills**: Test that skills sync correctly (see `game:skill` event)
2. **Add lobby features**: Implement player names, ready state, chat
3. **Test on mobile**: Use Option B above to test on real devices
4. **Load testing**: Use `artillery` or similar to simulate 10+ concurrent rooms
5. **Production deployment**: Deploy to Vercel/Railway with Redis for room persistence

---

## Quick Checklist

Before marking feature complete, verify:

- [ ] Two players can create and join via shared link
- [ ] Moves synchronize <200ms on localhost
- [ ] Page refresh reconnects automatically
- [ ] Network disconnect → reconnect restores game
- [ ] "Room full" error shown for 3rd player
- [ ] Game ends correctly on checkmate/stalemate
- [ ] 5-minute disconnect grace period works
- [ ] Session IDs persist in sessionStorage
- [ ] All unit tests pass
- [ ] E2E test passes with two browser contexts

---

**Quickstart complete. Developers can now test multiplayer functionality locally.**
