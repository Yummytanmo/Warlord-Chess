/**
 * Unit tests for RoomManager - Room Creation
 * Tests room creation logic, UUID generation, and initial state
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoomManager } from '@/lib/multiplayer/roomManager';
import type { Room } from '@/types/multiplayer';
import { PlayerColor } from '@/types/game';

describe('RoomManager - Room Creation', () => {
  let roomManager: RoomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  describe('createRoom', () => {
    it('should create a room with unique UUID', () => {
      const sessionId = 'test-session-1';
      const room = roomManager.createRoom(sessionId);

      expect(room.id).toBeDefined();
      expect(room.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should generate unique IDs for multiple rooms', () => {
      const room1 = roomManager.createRoom('session-1');
      const room2 = roomManager.createRoom('session-2');
      const room3 = roomManager.createRoom('session-3');

      expect(room1.id).not.toBe(room2.id);
      expect(room2.id).not.toBe(room3.id);
      expect(room1.id).not.toBe(room3.id);
    });

    it('should initialize room with WAITING status', () => {
      const room = roomManager.createRoom('test-session');

      expect(room.status).toBe('waiting');
    });

    it('should add first player with RED color', () => {
      const sessionId = 'test-session-1';
      const room = roomManager.createRoom(sessionId);

      expect(room.players).toHaveLength(1);
      expect(room.players[0].sessionId).toBe(sessionId);
      expect(room.players[0].color).toBe(PlayerColor.RED);
    });

    it('should use provided display name', () => {
      const displayName = 'AliceTheAwesome';
      const room = roomManager.createRoom('test-session', displayName);

      expect(room.players[0].displayName).toBe(displayName);
    });

    it('should default to "Player 1" when no display name provided', () => {
      const room = roomManager.createRoom('test-session');

      expect(room.players[0].displayName).toBe('Player 1');
    });

    it('should mark first player as connected', () => {
      const room = roomManager.createRoom('test-session');

      expect(room.players[0].isConnected).toBe(true);
    });

    it('should initialize game state', () => {
      const room = roomManager.createRoom('test-session');

      expect(room.gameState).toBeDefined();
      expect(room.gameState.players).toHaveLength(2);
      expect(room.gameState.gamePhase).toBe('hero_selection');
    });

    it('should set creation timestamp', () => {
      const before = Date.now();
      const room = roomManager.createRoom('test-session');
      const after = Date.now();

      expect(room.createdAt).toBeGreaterThanOrEqual(before);
      expect(room.createdAt).toBeLessThanOrEqual(after);
    });

    it('should set last activity timestamp to creation time', () => {
      const room = roomManager.createRoom('test-session');

      expect(room.lastActivityAt).toBe(room.createdAt);
    });

    it('should initialize disconnected players map as empty', () => {
      const room = roomManager.createRoom('test-session');

      expect(room.disconnectedPlayers).toBeDefined();
      expect(room.disconnectedPlayers.size).toBe(0);
    });

    it('should initialize empty settings', () => {
      const room = roomManager.createRoom('test-session');

      expect(room.settings).toBeDefined();
      expect(Object.keys(room.settings!)).toHaveLength(0);
    });

    it('should set player joinedAt timestamp', () => {
      const before = Date.now();
      const room = roomManager.createRoom('test-session');
      const after = Date.now();

      expect(room.players[0].joinedAt).toBeGreaterThanOrEqual(before);
      expect(room.players[0].joinedAt).toBeLessThanOrEqual(after);
    });

    it('should store room in memory', () => {
      const room = roomManager.createRoom('test-session');
      const retrievedRoom = roomManager.getRoom(room.id);

      expect(retrievedRoom).toBeDefined();
      expect(retrievedRoom?.id).toBe(room.id);
    });

    it('should handle multiple concurrent room creations', () => {
      const rooms = Array.from({ length: 10 }, (_, i) =>
        roomManager.createRoom(`session-${i}`)
      );

      // All rooms should have unique IDs
      const ids = new Set(rooms.map(r => r.id));
      expect(ids.size).toBe(10);

      // All rooms should be retrievable
      rooms.forEach(room => {
        const retrieved = roomManager.getRoom(room.id);
        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(room.id);
      });
    });

    it('should initialize with empty socketId (to be set later)', () => {
      const room = roomManager.createRoom('test-session');

      expect(room.players[0].socketId).toBe('');
    });
  });

  describe('Room URL Generation', () => {
    it('should generate valid room URL format', () => {
      const room = roomManager.createRoom('test-session');
      const baseUrl = 'http://localhost:3000';
      const roomUrl = `${baseUrl}/room/${room.id}`;

      expect(roomUrl).toMatch(/^http:\/\/localhost:3000\/room\/[0-9a-f-]{36}$/i);
    });

    it('should generate unique URLs for different rooms', () => {
      const room1 = roomManager.createRoom('session-1');
      const room2 = roomManager.createRoom('session-2');

      const baseUrl = 'http://localhost:3000';
      const url1 = `${baseUrl}/room/${room1.id}`;
      const url2 = `${baseUrl}/room/${room2.id}`;

      expect(url1).not.toBe(url2);
    });

    it('should preserve room ID in URL', () => {
      const room = roomManager.createRoom('test-session');
      const baseUrl = 'http://localhost:3000';
      const roomUrl = `${baseUrl}/room/${room.id}`;

      // Extract room ID from URL
      const match = roomUrl.match(/\/room\/([^/]+)$/);
      expect(match).toBeTruthy();
      expect(match![1]).toBe(room.id);
    });
  });

  describe('getRoom', () => {
    it('should return room by ID', () => {
      const createdRoom = roomManager.createRoom('test-session');
      const retrievedRoom = roomManager.getRoom(createdRoom.id);

      expect(retrievedRoom).toBeDefined();
      expect(retrievedRoom?.id).toBe(createdRoom.id);
    });

    it('should return undefined for non-existent room', () => {
      const room = roomManager.getRoom('non-existent-id');

      expect(room).toBeUndefined();
    });
  });

  describe('joinRoom', () => {
    it('should add second player to room', () => {
      // Create room with first player
      const room = roomManager.createRoom('session-1');

      // Second player joins
      const result = roomManager.joinRoom(room.id, 'session-2', 'socket-2');

      expect(result.success).toBe(true);
      expect(result.room?.players).toHaveLength(2);
    });

    it('should assign BLACK color to second player', () => {
      // Create room with first player (RED)
      const room = roomManager.createRoom('session-1');

      // Second player joins
      const result = roomManager.joinRoom(room.id, 'session-2', 'socket-2');

      expect(result.success).toBe(true);
      expect(result.room?.players[1].color).toBe(PlayerColor.BLACK);
    });

    it('should change room status to ACTIVE when second player joins', () => {
      // Create room (WAITING status)
      const room = roomManager.createRoom('session-1');
      expect(room.status).toBe('waiting');

      // Second player joins
      const result = roomManager.joinRoom(room.id, 'session-2', 'socket-2');

      expect(result.success).toBe(true);
      expect(result.room?.status).toBe('active');
    });

    it('should reject third player (room full)', () => {
      // Create room with first player
      const room = roomManager.createRoom('session-1');

      // Second player joins
      roomManager.joinRoom(room.id, 'session-2', 'socket-2');

      // Third player attempts to join
      const result = roomManager.joinRoom(room.id, 'session-3', 'socket-3');

      expect(result.success).toBe(false);
      expect(result.error).toBe('room_full');
    });

    it('should return error for non-existent room', () => {
      const result = roomManager.joinRoom('non-existent-id', 'session-1', 'socket-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('room_not_found');
    });

    it('should use provided display name for second player', () => {
      const room = roomManager.createRoom('session-1');
      const displayName = 'BobTheBuilder';

      const result = roomManager.joinRoom(room.id, 'session-2', 'socket-2', displayName);

      expect(result.success).toBe(true);
      expect(result.room?.players[1].displayName).toBe(displayName);
    });

    it('should default to "Player 2" when no display name provided', () => {
      const room = roomManager.createRoom('session-1');

      const result = roomManager.joinRoom(room.id, 'session-2', 'socket-2');

      expect(result.success).toBe(true);
      expect(result.room?.players[1].displayName).toBe('Player 2');
    });

    it('should set socket ID for joining player', () => {
      const room = roomManager.createRoom('session-1');
      const socketId = 'socket-abc-123';

      const result = roomManager.joinRoom(room.id, 'session-2', socketId);

      expect(result.success).toBe(true);
      expect(result.room?.players[1].socketId).toBe(socketId);
    });

    it('should mark joining player as connected', () => {
      const room = roomManager.createRoom('session-1');

      const result = roomManager.joinRoom(room.id, 'session-2', 'socket-2');

      expect(result.success).toBe(true);
      expect(result.room?.players[1].isConnected).toBe(true);
    });

    it('should set joinedAt timestamp for second player', () => {
      const room = roomManager.createRoom('session-1');
      const before = Date.now();

      const result = roomManager.joinRoom(room.id, 'session-2', 'socket-2');

      const after = Date.now();

      expect(result.success).toBe(true);
      expect(result.room?.players[1].joinedAt).toBeGreaterThanOrEqual(before);
      expect(result.room?.players[1].joinedAt).toBeLessThanOrEqual(after);
    });

    it('should update lastActivityAt timestamp when player joins', () => {
      const room = roomManager.createRoom('session-1');
      const initialActivity = room.lastActivityAt;

      // Wait a tiny bit to ensure timestamp difference
      const before = Date.now();

      const result = roomManager.joinRoom(room.id, 'session-2', 'socket-2');

      expect(result.success).toBe(true);
      expect(result.room?.lastActivityAt).toBeGreaterThanOrEqual(before);
      expect(result.room?.lastActivityAt).toBeGreaterThanOrEqual(initialActivity);
    });

    it('should reject join for ENDED room', () => {
      const room = roomManager.createRoom('session-1');

      // Manually set room to ended (simulate game completion)
      room.status = 'ended' as any;
      roomManager.updateRoom(room);

      const result = roomManager.joinRoom(room.id, 'session-2', 'socket-2');

      expect(result.success).toBe(false);
      expect(result.error).toBe('room_ended');
    });

    it('should prevent same session from joining twice', () => {
      const room = roomManager.createRoom('session-1');
      const sessionId = 'session-duplicate';

      // First join
      const result1 = roomManager.joinRoom(room.id, sessionId, 'socket-1');
      expect(result1.success).toBe(true);

      // Attempt to join again with same session ID
      const result2 = roomManager.joinRoom(room.id, sessionId, 'socket-2');

      expect(result2.success).toBe(false);
      expect(result2.error).toBe('already_in_room');
    });

    it('should handle rapid successive joins correctly', () => {
      const room = roomManager.createRoom('session-1');

      // Attempt multiple joins rapidly
      const result1 = roomManager.joinRoom(room.id, 'session-2', 'socket-2');
      const result2 = roomManager.joinRoom(room.id, 'session-3', 'socket-3');
      const result3 = roomManager.joinRoom(room.id, 'session-4', 'socket-4');

      // First should succeed, rest should fail
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(false);
      expect(result3.success).toBe(false);

      // Room should have exactly 2 players
      expect(result1.room?.players).toHaveLength(2);
    });

    it('should return updated room state after successful join', () => {
      const room = roomManager.createRoom('session-1');

      const result = roomManager.joinRoom(room.id, 'session-2', 'socket-2');

      expect(result.success).toBe(true);
      expect(result.room).toBeDefined();
      expect(result.room?.id).toBe(room.id);
      expect(result.room?.status).toBe('active');
      expect(result.room?.players).toHaveLength(2);
    });
  });
});
