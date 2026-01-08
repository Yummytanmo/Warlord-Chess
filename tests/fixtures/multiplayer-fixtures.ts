/**
 * Test fixtures for multiplayer testing
 * Factory functions to create mock Room, PlayerSession, and GameState objects
 */

import type { Room, RoomStatus, PlayerSession } from '@/types/multiplayer';
import type { GameState, PlayerColor, GamePhase } from '@/types/game';

/**
 * Create a test room with default or override values
 */
export function createTestRoom(overrides?: Partial<Room>): Room {
  const now = Date.now();

  return {
    id: '00000000-0000-0000-0000-000000000000',
    status: 'waiting' as RoomStatus,
    players: [],
    gameState: createTestGameState(),
    createdAt: now,
    lastActivityAt: now,
    disconnectedPlayers: new Map(),
    settings: {
      timeLimit: 0,
      allowSpectators: false,
      restrictedHeroes: [],
    },
    ...overrides,
  };
}

/**
 * Create a test player session
 */
export function createTestPlayer(
  color: PlayerColor,
  overrides?: Partial<PlayerSession>
): PlayerSession {
  return {
    sessionId: `test-session-${color}`,
    socketId: `test-socket-${color}`,
    color,
    displayName: `Player ${color === 'red' ? '1' : '2'}`,
    joinedAt: Date.now(),
    isConnected: true,
    ...overrides,
  };
}

/**
 * Create a test game state
 */
export function createTestGameState(
  overrides?: Partial<GameState>
): GameState {
  return {
    id: 'test-game-state',
    board: {
      width: 9,
      height: 10,
      squares: [],
    },
    currentTurn: 'red' as PlayerColor,
    players: [
      {
        color: 'red' as PlayerColor,
        hero: null,
        capturedPieces: [],
      },
      {
        color: 'black' as PlayerColor,
        hero: null,
        capturedPieces: [],
      },
    ],
    moveHistory: [],
    capturedPieces: [],
    phase: 'hero_selection' as GamePhase,
    skillStates: [],
    checkState: {
      isInCheck: false,
      isCheckmate: false,
      isStalemate: false,
      checkingPieces: [],
    },
    ...overrides,
  };
}

/**
 * Create a room with two players (ACTIVE status)
 */
export function createActiveRoom(overrides?: Partial<Room>): Room {
  const room = createTestRoom({
    status: 'active' as RoomStatus,
    players: [
      createTestPlayer('red' as PlayerColor),
      createTestPlayer('black' as PlayerColor),
    ],
    ...overrides,
  });

  return room;
}

/**
 * Create a room with one player (WAITING status)
 */
export function createWaitingRoom(overrides?: Partial<Room>): Room {
  return createTestRoom({
    status: 'waiting' as RoomStatus,
    players: [createTestPlayer('red' as PlayerColor)],
    ...overrides,
  });
}

/**
 * Create a game in progress (with moves made)
 */
export function createGameInProgress(moveCount: number = 5): Room {
  const room = createActiveRoom({
    gameState: createTestGameState({
      phase: 'playing' as GamePhase,
      moveHistory: Array.from({ length: moveCount }, (_, i) => ({
        piece: {
          id: `piece-${i}`,
          type: 'soldier',
          color: i % 2 === 0 ? ('red' as PlayerColor) : ('black' as PlayerColor),
          position: { x: i, y: i },
        },
        from: { x: i, y: i },
        to: { x: i + 1, y: i + 1 },
      })),
    }),
  });

  return room;
}

/**
 * Create a room with disconnected player
 */
export function createRoomWithDisconnectedPlayer(): Room {
  const room = createActiveRoom();
  room.disconnectedPlayers.set('test-session-red', Date.now() - 60000); // 1 min ago
  room.players[0].isConnected = false;

  return room;
}

/**
 * Generate a unique room ID (for test isolation)
 */
export function generateTestRoomId(): string {
  return `test-room-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Generate a unique session ID (for test isolation)
 */
export function generateTestSessionId(): string {
  return `test-session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Helper to create multiple rooms for concurrent testing
 */
export function createMultipleRooms(count: number): Room[] {
  return Array.from({ length: count }, (_, i) =>
    createTestRoom({
      id: generateTestRoomId(),
      players: i % 2 === 0 ? [] : [createTestPlayer('red' as PlayerColor)],
    })
  );
}
