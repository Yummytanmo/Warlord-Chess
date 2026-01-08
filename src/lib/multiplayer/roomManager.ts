/**
 * Room Manager
 *
 * Manages game rooms for multiplayer chess:
 * - Room creation and deletion
 * - Player management (join, leave, reconnect)
 * - Room cleanup (timeout, forfeit)
 */

import type { Room, RoomStatus, PlayerSession } from '@/types/multiplayer';
import { PlayerColor } from '@/types/game';
import { GameManager } from '@/lib/gameManager';

/**
 * Generates a UUIDv4
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * In-memory room storage
 */
const rooms = new Map<string, Room>();

/**
 * Room cleanup configuration
 */
const ROOM_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const DISCONNECT_GRACE_PERIOD_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute

/**
 * RoomManager class for handling all room operations
 */
export class RoomManager {
  private gameManager: GameManager;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.gameManager = new GameManager();
    this.startCleanupInterval();
  }

  /**
   * Create a new room
   *
   * @param sessionId - Session ID of the creating player
   * @param displayName - Optional display name
   * @returns Created room
   */
  createRoom(sessionId: string, displayName?: string): Room {
    const roomId = generateUUID();
    const now = Date.now();

    // Create initial game state
    const gameState = this.gameManager.createNewGame();

    // Create first player session
    const player: PlayerSession = {
      sessionId,
      socketId: '', // Will be set when socket connects
      color: PlayerColor.RED,
      displayName: displayName || 'Player 1',
      joinedAt: now,
      isConnected: true
    };

    // Create room
    const room: Room = {
      id: roomId,
      status: 'waiting' as RoomStatus,
      players: [player],
      gameState,
      createdAt: now,
      lastActivityAt: now,
      disconnectedPlayers: new Map(),
      settings: {}
    };

    rooms.set(roomId, room);

    console.log(`✅ Room created: ${roomId}`);
    return room;
  }

  /**
   * Join an existing room
   *
   * @param roomId - Room ID to join
   * @param sessionId - Session ID of the joining player
   * @param socketId - Socket ID of the joining player (optional, for socket tracking)
   * @param displayName - Optional display name
   * @returns Updated room or null if join failed
   */
  joinRoom(
    roomId: string,
    sessionId: string,
    socketId?: string,
    displayName?: string
  ): { success: boolean; room?: Room; error?: string } {
    const room = rooms.get(roomId);

    if (!room) {
      return { success: false, error: 'room_not_found' };
    }

    if (room.status === 'ended') {
      return { success: false, error: 'room_ended' };
    }

    // Check if player already in room
    const existingPlayer = room.players.find((p) => p.sessionId === sessionId);
    if (existingPlayer) {
      // If the player is already connected, we update their socket ID and treat it as a rejoin.
      // This handles race conditions where a client reconnects before the server processed the disconnect,
      // or if a user opens the room in a second tab (taking over the session).
      existingPlayer.isConnected = true;
      if (socketId) {
        existingPlayer.socketId = socketId;
      }
      room.disconnectedPlayers.delete(sessionId);
      room.lastActivityAt = Date.now();
      return { success: true, room };
    }

    // Check room capacity
    if (room.players.length >= 2) {
      return { success: false, error: 'room_full' };
    }

    // Add new player
    const player: PlayerSession = {
      sessionId,
      socketId: socketId || '',
      color: PlayerColor.BLACK, // Second player is always BLACK
      displayName: displayName || 'Player 2',
      joinedAt: Date.now(),
      isConnected: true
    };

    room.players.push(player);

    // Update room status to ACTIVE when 2 players joined
    if (room.players.length === 2) {
      room.status = 'active' as RoomStatus;
    }

    room.lastActivityAt = Date.now();

    console.log(`✅ Player joined room: ${roomId}`);
    return { success: true, room };
  }

  /**
   * Rejoin a room after disconnection
   *
   * @param roomId - Room ID
   * @param sessionId - Session ID
   * @param socketId - New socket ID (optional)
   * @returns Room or null if rejoin failed
   */
  rejoinRoom(
    roomId: string,
    sessionId: string,
    socketId?: string
  ): { success: boolean; room?: Room; error?: string } {
    const room = rooms.get(roomId);

    if (!room) {
      return { success: false, error: 'room_not_found' };
    }

    if (room.status === 'ended') {
      return { success: false, error: 'room_ended' };
    }

    // Find player in room
    const player = room.players.find((p) => p.sessionId === sessionId);
    if (!player) {
      return { success: false, error: 'session_not_in_room' };
    }

    // Reconnect player
    player.isConnected = true;
    if (socketId) {
      player.socketId = socketId;
    }
    room.disconnectedPlayers.delete(sessionId);
    room.lastActivityAt = Date.now();

    console.log(`✅ Player rejoined room: ${roomId}`);
    return { success: true, room };
  }

  /**
   * Handle player disconnect
   *
   * @param roomId - Room ID
   * @param sessionId - Session ID
   */
  handleDisconnect(roomId: string, sessionId: string): void {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.find((p) => p.sessionId === sessionId);
    if (!player) return;

    player.isConnected = false;
    room.disconnectedPlayers.set(sessionId, Date.now());

    console.log(`❌ Player disconnected from room: ${roomId}`);
  }

  /**
   * Update room's last activity timestamp
   *
   * @param roomId - Room ID
   */
  updateActivity(roomId: string): void {
    const room = rooms.get(roomId);
    if (room) {
      room.lastActivityAt = Date.now();
    }
  }

  /**
   * Execute a move in a room's game
   *
   * @param roomId - Room ID
   * @param move - Move to execute
   * @returns Result with updated game state or error
   */
  executeMove(
    roomId: string,
    move: import('@/types/game').Move
  ): { success: boolean; error?: import('@/types/game').GameError } {
    const room = rooms.get(roomId);
    if (!room) {
      return {
        success: false,
        error: {
          type: 'GAME_STATE_INVALID' as any,
          message: 'Room not found',
          context: { roomId }
        }
      };
    }

    // Execute move using GameManager
    const result = this.gameManager.executeMove(room.gameState, move);

    if (result.success && result.newGameState) {
      // Update room's game state
      room.gameState = result.newGameState;
      room.lastActivityAt = Date.now();
    }

    return {
      success: result.success,
      error: result.error
    };
  }

  /**
   * Get a room by ID
   *
   * @param roomId - Room ID
   * @returns Room or undefined
   */
  getRoom(roomId: string): Room | undefined {
    return rooms.get(roomId);
  }

  /**
   * Update a room in storage
   *
   * @param room - Room to update
   */
  updateRoom(room: Room): void {
    if (rooms.has(room.id)) {
      rooms.set(room.id, room);
    }
  }

  /**
   * End a game (checkmate, stalemate, forfeit, timeout)
   *
   * @param roomId - Room ID
   */
  endGame(roomId: string): void {
    const room = rooms.get(roomId);
    if (!room) return;

    room.status = 'ended' as RoomStatus;
    room.lastActivityAt = Date.now();

    console.log(`🏁 Game ended in room: ${roomId}`);
  }

  /**
   * End game by forfeit
   *
   * @param roomId - Room ID
   * @param _forfeiterSessionId - Session ID of player who forfeited (unused but kept for API consistency)
   */
  endGameByForfeit(roomId: string, _forfeiterSessionId: string): void {
    const room = rooms.get(roomId);
    if (!room) return;

    room.status = 'ended' as RoomStatus;
    room.lastActivityAt = Date.now();

    console.log(`🏁 Game ended by forfeit in room: ${roomId}`);
  }

  /**
   * Delete a room
   *
   * @param roomId - Room ID
   */
  deleteRoom(roomId: string): void {
    rooms.delete(roomId);
    console.log(`🗑️ Room deleted: ${roomId}`);
  }

  /**
   * Start cleanup interval
   *
   * Runs every minute to:
   * - Delete inactive rooms (>30min no activity)
   * - End games where player disconnected >5min ago
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();

      rooms.forEach((room, roomId) => {
        // Delete rooms with no activity for 30 minutes
        if (now - room.lastActivityAt > ROOM_TIMEOUT_MS) {
          this.deleteRoom(roomId);
          return;
        }

        // End games where player disconnected >5 minutes ago
        room.disconnectedPlayers.forEach((disconnectTime, sessionId) => {
          if (now - disconnectTime > DISCONNECT_GRACE_PERIOD_MS) {
            this.endGameByForfeit(roomId, sessionId);
            // Schedule room deletion after 1 minute
            setTimeout(() => this.deleteRoom(roomId), 60000);
          }
        });
      });
    }, CLEANUP_INTERVAL_MS);

    console.log('✅ Room cleanup interval started');
  }

  /**
   * Stop cleanup interval
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('❌ Room cleanup interval stopped');
    }
  }

  /**
   * Get all active rooms (for debugging)
   */
  getAllRooms(): Room[] {
    return Array.from(rooms.values());
  }

  /**
   * Get room count
   */
  getRoomCount(): number {
    return rooms.size;
  }
}

// Export singleton instance
export const roomManager = new RoomManager();
