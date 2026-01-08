/**
 * Integration tests for Socket.IO room:create event
 * Tests actual Socket.IO communication for room creation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Socket } from 'socket.io-client';
import {
  createTestSocketClient,
  waitForConnection,
  waitForEvent,
  emitWithAck,
  cleanupSockets,
} from '../../../tests/helpers/socket-helpers';
import { generateTestSessionId } from '../../../tests/fixtures/multiplayer-fixtures';
import type { Room } from '@/types/multiplayer';
import { PlayerColor } from '@/types/game';

describe('Integration: Socket.IO room:create event', () => {
  let client: Socket;

  beforeEach(async () => {
    client = createTestSocketClient();
    await waitForConnection(client);
  });

  afterEach(() => {
    cleanupSockets(client);
  });

  it('should create room and return room:created response', async () => {
    const sessionId = generateTestSessionId();

    const response = await emitWithAck<any>(client, 'room:create', {
      sessionId,
      timestamp: Date.now(),
    });

    expect(response).toBeDefined();
    expect(response.type).toBe('room:created');
    expect(response.room).toBeDefined();
    expect(response.room.id).toBeDefined();
    expect(response.yourColor).toBe(PlayerColor.RED);
    expect(response.shareUrl).toContain(`/room/${response.room.id}`);
  });

  it('should return room with WAITING status', async () => {
    const sessionId = generateTestSessionId();

    const response = await emitWithAck<any>(client, 'room:create', {
      sessionId,
      timestamp: Date.now(),
    });

    expect(response.room.status).toBe('waiting');
  });

  it('should return room with one player (creator)', async () => {
    const sessionId = generateTestSessionId();

    const response = await emitWithAck<any>(client, 'room:create', {
      sessionId,
      timestamp: Date.now(),
    });

    expect(response.room.players).toHaveLength(1);
    expect(response.room.players[0].sessionId).toBe(sessionId);
    expect(response.room.players[0].color).toBe(PlayerColor.RED);
  });

  it('should use provided display name', async () => {
    const sessionId = generateTestSessionId();
    const displayName = 'TestPlayer123';

    const response = await emitWithAck<any>(client, 'room:create', {
      sessionId,
      displayName,
      timestamp: Date.now(),
    });

    expect(response.room.players[0].displayName).toBe(displayName);
  });

  it('should default to "Player 1" when no display name provided', async () => {
    const sessionId = generateTestSessionId();

    const response = await emitWithAck<any>(client, 'room:create', {
      sessionId,
      timestamp: Date.now(),
    });

    expect(response.room.players[0].displayName).toBe('Player 1');
  });

  it('should return valid share URL with room ID', async () => {
    const sessionId = generateTestSessionId();

    const response = await emitWithAck<any>(client, 'room:create', {
      sessionId,
      timestamp: Date.now(),
    });

    expect(response.shareUrl).toBeDefined();
    expect(response.shareUrl).toMatch(/\/room\/[0-9a-f-]{36}$/i);
    expect(response.shareUrl).toContain(response.room.id);
  });

  it('should initialize game state in hero_selection phase', async () => {
    const sessionId = generateTestSessionId();

    const response = await emitWithAck<any>(client, 'room:create', {
      sessionId,
      timestamp: Date.now(),
    });

    expect(response.room.gameState).toBeDefined();
    expect(response.room.gameState.phase).toBe('hero_selection');
  });

  it('should assign RED color to room creator', async () => {
    const sessionId = generateTestSessionId();

    const response = await emitWithAck<any>(client, 'room:create', {
      sessionId,
      timestamp: Date.now(),
    });

    expect(response.yourColor).toBe(PlayerColor.RED);
  });

  it('should create multiple independent rooms', async () => {
    const session1 = generateTestSessionId();
    const session2 = generateTestSessionId();

    const response1 = await emitWithAck<any>(client, 'room:create', {
      sessionId: session1,
      timestamp: Date.now(),
    });

    const response2 = await emitWithAck<any>(client, 'room:create', {
      sessionId: session2,
      timestamp: Date.now(),
    });

    // Rooms should have different IDs
    expect(response1.room.id).not.toBe(response2.room.id);

    // Both should be valid rooms
    expect(response1.room.status).toBe('waiting');
    expect(response2.room.status).toBe('waiting');
  });

  it('should set creation and activity timestamps', async () => {
    const sessionId = generateTestSessionId();
    const before = Date.now();

    const response = await emitWithAck<any>(client, 'room:create', {
      sessionId,
      timestamp: Date.now(),
    });

    const after = Date.now();

    expect(response.room.createdAt).toBeGreaterThanOrEqual(before);
    expect(response.room.createdAt).toBeLessThanOrEqual(after);
    expect(response.room.lastActivityAt).toBe(response.room.createdAt);
  });

  it('should initialize empty disconnected players map', async () => {
    const sessionId = generateTestSessionId();

    const response = await emitWithAck<any>(client, 'room:create', {
      sessionId,
      timestamp: Date.now(),
    });

    // Map is serialized as object in JSON
    expect(response.room.disconnectedPlayers).toBeDefined();
  });

  it('should handle rapid successive room creation', async () => {
    const sessionIds = Array.from({ length: 5 }, () => generateTestSessionId());

    const responses = await Promise.all(
      sessionIds.map(sessionId =>
        emitWithAck<any>(client, 'room:create', {
          sessionId,
          timestamp: Date.now(),
        })
      )
    );

    // All should succeed
    expect(responses).toHaveLength(5);

    // All should have unique room IDs
    const roomIds = new Set(responses.map(r => r.room.id));
    expect(roomIds.size).toBe(5);

    // All should be in waiting status
    responses.forEach(response => {
      expect(response.room.status).toBe('waiting');
      expect(response.room.players).toHaveLength(1);
    });
  });

  it('should emit room:created event to creating client', async () => {
    const sessionId = generateTestSessionId();

    // Listen for room:created event
    const eventPromise = waitForEvent<any>(client, 'room:created');

    // Create room (without waiting for ack)
    client.emit('room:create', {
      sessionId,
      timestamp: Date.now(),
    });

    // Should receive room:created event
    const event = await eventPromise;

    expect(event).toBeDefined();
    expect(event.type).toBe('room:created');
    expect(event.room).toBeDefined();
  });

  it('should store socket ID in player session', async () => {
    const sessionId = generateTestSessionId();

    const response = await emitWithAck<any>(client, 'room:create', {
      sessionId,
      timestamp: Date.now(),
    });

    expect(response.room.players[0].socketId).toBeDefined();
    expect(response.room.players[0].socketId).toBe(client.id);
  });

  it('should mark player as connected', async () => {
    const sessionId = generateTestSessionId();

    const response = await emitWithAck<any>(client, 'room:create', {
      sessionId,
      timestamp: Date.now(),
    });

    expect(response.room.players[0].isConnected).toBe(true);
  });
});

describe('Integration: Room state persistence', () => {
  let client1: Socket;
  let client2: Socket;

  beforeEach(async () => {
    client1 = createTestSocketClient();
    client2 = createTestSocketClient();
    await waitForConnection(client1);
    await waitForConnection(client2);
  });

  afterEach(() => {
    cleanupSockets(client1, client2);
  });

  it('should persist room after creation', async () => {
    const sessionId = generateTestSessionId();

    // Create room with client1
    const createResponse = await emitWithAck<any>(client1, 'room:create', {
      sessionId,
      timestamp: Date.now(),
    });

    const roomId = createResponse.room.id;

    // Attempt to join with client2 (verifies room exists)
    const joinResponse = await emitWithAck<any>(client2, 'room:join', {
      roomId,
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    expect(joinResponse.type).toBe('room:joined');
    expect(joinResponse.room.id).toBe(roomId);
  });

  it('should maintain room state across multiple client connections', async () => {
    const displayName = 'PersistentPlayer';

    // Create room
    const createResponse = await emitWithAck<any>(client1, 'room:create', {
      sessionId: generateTestSessionId(),
      displayName,
      timestamp: Date.now(),
    });

    const roomId = createResponse.room.id;

    // Join with second client
    await emitWithAck<any>(client2, 'room:join', {
      roomId,
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    // Disconnect first client
    client1.disconnect();

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 500));

    // Room should still exist and be accessible
    const client3 = createTestSocketClient();
    await waitForConnection(client3);

    try {
      // Try to join with third client (should fail if room is full)
      const response = await emitWithAck<any>(client3, 'room:join', {
        roomId,
        sessionId: generateTestSessionId(),
        timestamp: Date.now(),
      });

      // Should get room_full error since 2 players already in room
      expect(response.type).toBe('room:join_error');
      expect(response.reason).toBe('room_full');
    } finally {
      cleanupSockets(client3);
    }
  });

  it('should preserve game state after player disconnection', async () => {
    // Create room
    const createResponse = await emitWithAck<any>(client1, 'room:create', {
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    const roomId = createResponse.room.id;
    const initialGameStateId = createResponse.room.gameState.id;

    // Disconnect creator
    client1.disconnect();

    // Wait for disconnect to process
    await new Promise(resolve => setTimeout(resolve, 300));

    // Reconnect and join same room with different client
    const client3 = createTestSocketClient();
    await waitForConnection(client3);

    try {
      const joinResponse = await emitWithAck<any>(client3, 'room:join', {
        roomId,
        sessionId: generateTestSessionId(),
        timestamp: Date.now(),
      });

      // Game state should be preserved
      expect(joinResponse.room.gameState).toBeDefined();
      expect(joinResponse.room.gameState.id).toBe(initialGameStateId);
    } finally {
      cleanupSockets(client3);
    }
  });

  it('should maintain room status during player activity', async () => {
    // Create room
    const createResponse = await emitWithAck<any>(client1, 'room:create', {
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    const roomId = createResponse.room.id;

    // Verify initial status
    expect(createResponse.room.status).toBe('waiting');

    // Second player joins
    const joinResponse = await emitWithAck<any>(client2, 'room:join', {
      roomId,
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    // Status should change to active
    expect(joinResponse.room.status).toBe('active');

    // Both clients should see active status
    expect(joinResponse.room.players).toHaveLength(2);
  });

  it('should persist room for duration of game session', async () => {
    // Create room
    const createResponse = await emitWithAck<any>(client1, 'room:create', {
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    const roomId = createResponse.room.id;

    // Wait some time (simulating game in progress)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Room should still be accessible
    const joinResponse = await emitWithAck<any>(client2, 'room:join', {
      roomId,
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    expect(joinResponse.type).toBe('room:joined');
    expect(joinResponse.room.id).toBe(roomId);
  });

  it('should update lastActivityAt timestamp on room creation', async () => {
    const before = Date.now();

    const response = await emitWithAck<any>(client1, 'room:create', {
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    const after = Date.now();

    expect(response.room.lastActivityAt).toBeGreaterThanOrEqual(before);
    expect(response.room.lastActivityAt).toBeLessThanOrEqual(after);
  });
});

describe('Integration: Socket.IO room:join event', () => {
  let client1: Socket;
  let client2: Socket;

  beforeEach(async () => {
    client1 = createTestSocketClient();
    client2 = createTestSocketClient();
    await waitForConnection(client1);
    await waitForConnection(client2);
  });

  afterEach(() => {
    cleanupSockets(client1, client2);
  });

  it('should join existing room successfully', async () => {
    // Create room with client1
    const createResponse = await emitWithAck<any>(client1, 'room:create', {
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    const roomId = createResponse.room.id;

    // Join with client2
    const joinResponse = await emitWithAck<any>(client2, 'room:join', {
      roomId,
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    expect(joinResponse.type).toBe('room:joined');
    expect(joinResponse.room).toBeDefined();
    expect(joinResponse.room.id).toBe(roomId);
  });

  it('should assign BLACK color to second player', async () => {
    // Create room
    const createResponse = await emitWithAck<any>(client1, 'room:create', {
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    // Join with second player
    const joinResponse = await emitWithAck<any>(client2, 'room:join', {
      roomId: createResponse.room.id,
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    expect(joinResponse.yourColor).toBe(PlayerColor.BLACK);
    expect(joinResponse.room.players[1].color).toBe(PlayerColor.BLACK);
  });

  it('should transition room status to ACTIVE', async () => {
    // Create room (WAITING status)
    const createResponse = await emitWithAck<any>(client1, 'room:create', {
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    expect(createResponse.room.status).toBe('waiting');

    // Second player joins
    const joinResponse = await emitWithAck<any>(client2, 'room:join', {
      roomId: createResponse.room.id,
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    expect(joinResponse.room.status).toBe('active');
  });

  it('should have 2 players after join', async () => {
    // Create room
    const createResponse = await emitWithAck<any>(client1, 'room:create', {
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    // Join room
    const joinResponse = await emitWithAck<any>(client2, 'room:join', {
      roomId: createResponse.room.id,
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    expect(joinResponse.room.players).toHaveLength(2);
  });

  it('should use provided display name', async () => {
    // Create room
    const createResponse = await emitWithAck<any>(client1, 'room:create', {
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    const displayName = 'SecondPlayer123';

    // Join with display name
    const joinResponse = await emitWithAck<any>(client2, 'room:join', {
      roomId: createResponse.room.id,
      sessionId: generateTestSessionId(),
      displayName,
      timestamp: Date.now(),
    });

    expect(joinResponse.room.players[1].displayName).toBe(displayName);
  });

  it('should default to "Player 2" when no display name', async () => {
    // Create room
    const createResponse = await emitWithAck<any>(client1, 'room:create', {
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    // Join without display name
    const joinResponse = await emitWithAck<any>(client2, 'room:join', {
      roomId: createResponse.room.id,
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    expect(joinResponse.room.players[1].displayName).toBe('Player 2');
  });

  it('should broadcast player:status to first player', async () => {
    // Create room
    const createResponse = await emitWithAck<any>(client1, 'room:create', {
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    // Listen for player:status on client1
    const statusPromise = waitForEvent<any>(client1, 'player:status');

    // Second player joins
    await emitWithAck<any>(client2, 'room:join', {
      roomId: createResponse.room.id,
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    // First player should receive status update
    const statusEvent = await statusPromise;

    expect(statusEvent.type).toBe('player:status');
    expect(statusEvent.status).toBe('connected');
  });

  it('should update lastActivityAt on join', async () => {
    // Create room
    const createResponse = await emitWithAck<any>(client1, 'room:create', {
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    const initialActivity = createResponse.room.lastActivityAt;

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    // Join room
    const joinResponse = await emitWithAck<any>(client2, 'room:join', {
      roomId: createResponse.room.id,
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    expect(joinResponse.room.lastActivityAt).toBeGreaterThan(initialActivity);
  });
});

describe('Integration: Socket.IO room:join error handling', () => {
  let client1: Socket;
  let client2: Socket;
  let client3: Socket;

  beforeEach(async () => {
    client1 = createTestSocketClient();
    client2 = createTestSocketClient();
    client3 = createTestSocketClient();
    await waitForConnection(client1);
    await waitForConnection(client2);
    await waitForConnection(client3);
  });

  afterEach(() => {
    cleanupSockets(client1, client2, client3);
  });

  it('should return room_full error when third player joins', async () => {
    // Create room
    const createResponse = await emitWithAck<any>(client1, 'room:create', {
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    const roomId = createResponse.room.id;

    // Second player joins successfully
    await emitWithAck<any>(client2, 'room:join', {
      roomId,
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    // Third player attempts to join
    const errorResponse = await emitWithAck<any>(client3, 'room:join', {
      roomId,
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    expect(errorResponse.type).toBe('room:join_error');
    expect(errorResponse.reason).toBe('room_full');
    expect(errorResponse.message).toBeDefined();
  });

  it('should return room_not_found error for invalid room ID', async () => {
    const response = await emitWithAck<any>(client1, 'room:join', {
      roomId: 'non-existent-room-id',
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    expect(response.type).toBe('room:join_error');
    expect(response.reason).toBe('room_not_found');
  });

  it('should prevent same session from joining twice', async () => {
    // Create room
    const createResponse = await emitWithAck<any>(client1, 'room:create', {
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    const roomId = createResponse.room.id;
    const duplicateSessionId = generateTestSessionId();

    // First join
    await emitWithAck<any>(client2, 'room:join', {
      roomId,
      sessionId: duplicateSessionId,
      timestamp: Date.now(),
    });

    // Try to join again with same session
    const errorResponse = await emitWithAck<any>(client3, 'room:join', {
      roomId,
      sessionId: duplicateSessionId,
      timestamp: Date.now(),
    });

    expect(errorResponse.type).toBe('room:join_error');
    expect(errorResponse.reason).toBe('already_in_room');
  });

  it('should handle rapid successive join attempts', async () => {
    // Create room
    const createResponse = await emitWithAck<any>(client1, 'room:create', {
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    const roomId = createResponse.room.id;

    // Multiple clients try to join simultaneously
    const [response2, response3] = await Promise.all([
      emitWithAck<any>(client2, 'room:join', {
        roomId,
        sessionId: generateTestSessionId(),
        timestamp: Date.now(),
      }),
      emitWithAck<any>(client3, 'room:join', {
        roomId,
        sessionId: generateTestSessionId(),
        timestamp: Date.now(),
      }),
    ]);

    // One should succeed, one should fail
    const succeeded = [response2, response3].filter(r => r.type === 'room:joined');
    const failed = [response2, response3].filter(r => r.type === 'room:join_error');

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect(failed[0].reason).toBe('room_full');
  });

  it('should provide helpful error message for room_full', async () => {
    // Create room and fill it
    const createResponse = await emitWithAck<any>(client1, 'room:create', {
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    await emitWithAck<any>(client2, 'room:join', {
      roomId: createResponse.room.id,
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    // Try to join full room
    const errorResponse = await emitWithAck<any>(client3, 'room:join', {
      roomId: createResponse.room.id,
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    expect(errorResponse.message).toMatch(/full|capacity|2.*players/i);
  });

  it('should provide helpful error message for room_not_found', async () => {
    const errorResponse = await emitWithAck<any>(client1, 'room:join', {
      roomId: 'invalid-id',
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    expect(errorResponse.message).toMatch(/not found|does not exist|invalid/i);
  });
});
