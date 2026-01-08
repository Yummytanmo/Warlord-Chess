/**
 * Game state assertion utilities for multiplayer testing
 * Provides helper functions to compare and validate game states
 */

import type { GameState, PlayerColor, Move, Piece, Position } from '@/types/game';
import type { Room, PlayerSession } from '@/types/multiplayer';

/**
 * Deep equality check for game states (ignoring timestamps)
 */
export function assertGameStatesEqual(
  actual: GameState,
  expected: GameState,
  message?: string
): void {
  const errors: string[] = [];

  // Check basic properties
  if (actual.id !== expected.id) {
    errors.push(`Game ID mismatch: expected ${expected.id}, got ${actual.id}`);
  }

  if (actual.currentTurn !== expected.currentTurn) {
    errors.push(`Current turn mismatch: expected ${expected.currentTurn}, got ${actual.currentTurn}`);
  }

  if (actual.phase !== expected.phase) {
    errors.push(`Game phase mismatch: expected ${expected.phase}, got ${actual.phase}`);
  }

  // Check players
  if (actual.players.length !== expected.players.length) {
    errors.push(
      `Player count mismatch: expected ${expected.players.length}, got ${actual.players.length}`
    );
  }

  // Check move history length
  if (actual.moveHistory.length !== expected.moveHistory.length) {
    errors.push(
      `Move history length mismatch: expected ${expected.moveHistory.length}, got ${actual.moveHistory.length}`
    );
  }

  // Check captured pieces count
  if (actual.capturedPieces.length !== expected.capturedPieces.length) {
    errors.push(
      `Captured pieces count mismatch: expected ${expected.capturedPieces.length}, got ${actual.capturedPieces.length}`
    );
  }

  // Check check state
  if (actual.checkState.isInCheck !== expected.checkState.isInCheck) {
    errors.push(
      `Check state mismatch: expected ${expected.checkState.isInCheck}, got ${actual.checkState.isInCheck}`
    );
  }

  if (actual.checkState.isCheckmate !== expected.checkState.isCheckmate) {
    errors.push(
      `Checkmate state mismatch: expected ${expected.checkState.isCheckmate}, got ${actual.checkState.isCheckmate}`
    );
  }

  if (errors.length > 0) {
    const prefix = message ? `${message}\n` : '';
    throw new Error(`${prefix}Game state assertion failed:\n${errors.join('\n')}`);
  }
}

/**
 * Assert that two rooms have identical game states
 */
export function assertRoomGameStatesMatch(room1: Room, room2: Room, message?: string): void {
  assertGameStatesEqual(room1.gameState, room2.gameState, message);
}

/**
 * Assert room has expected number of players
 */
export function assertPlayerCount(room: Room, expectedCount: number, message?: string): void {
  const actual = room.players.length;
  if (actual !== expectedCount) {
    const prefix = message ? `${message}\n` : '';
    throw new Error(
      `${prefix}Player count mismatch: expected ${expectedCount}, got ${actual}`
    );
  }
}

/**
 * Assert room is in expected status
 */
export function assertRoomStatus(room: Room, expectedStatus: string, message?: string): void {
  if (room.status !== expectedStatus) {
    const prefix = message ? `${message}\n` : '';
    throw new Error(
      `${prefix}Room status mismatch: expected ${expectedStatus}, got ${room.status}`
    );
  }
}

/**
 * Assert player session has expected properties
 */
export function assertPlayerSession(
  player: PlayerSession,
  expected: Partial<PlayerSession>,
  message?: string
): void {
  const errors: string[] = [];

  if (expected.sessionId && player.sessionId !== expected.sessionId) {
    errors.push(`Session ID mismatch: expected ${expected.sessionId}, got ${player.sessionId}`);
  }

  if (expected.color && player.color !== expected.color) {
    errors.push(`Player color mismatch: expected ${expected.color}, got ${player.color}`);
  }

  if (expected.displayName && player.displayName !== expected.displayName) {
    errors.push(
      `Display name mismatch: expected ${expected.displayName}, got ${player.displayName}`
    );
  }

  if (expected.isConnected !== undefined && player.isConnected !== expected.isConnected) {
    errors.push(
      `Connection status mismatch: expected ${expected.isConnected}, got ${player.isConnected}`
    );
  }

  if (errors.length > 0) {
    const prefix = message ? `${message}\n` : '';
    throw new Error(`${prefix}Player session assertion failed:\n${errors.join('\n')}`);
  }
}

/**
 * Assert move is valid and matches expected properties
 */
export function assertMove(move: Move, expected: Partial<Move>, message?: string): void {
  const errors: string[] = [];

  if (expected.from && !positionsEqual(move.from, expected.from)) {
    errors.push(
      `Move origin mismatch: expected (${expected.from.x},${expected.from.y}), got (${move.from.x},${move.from.y})`
    );
  }

  if (expected.to && !positionsEqual(move.to, expected.to)) {
    errors.push(
      `Move destination mismatch: expected (${expected.to.x},${expected.to.y}), got (${move.to.x},${move.to.y})`
    );
  }

  if (expected.piece && move.piece.type !== expected.piece.type) {
    errors.push(`Piece type mismatch: expected ${expected.piece.type}, got ${move.piece.type}`);
  }

  if (expected.isCheck !== undefined && move.isCheck !== expected.isCheck) {
    errors.push(`Check flag mismatch: expected ${expected.isCheck}, got ${move.isCheck}`);
  }

  if (expected.isCheckmate !== undefined && move.isCheckmate !== expected.isCheckmate) {
    errors.push(
      `Checkmate flag mismatch: expected ${expected.isCheckmate}, got ${move.isCheckmate}`
    );
  }

  if (errors.length > 0) {
    const prefix = message ? `${message}\n` : '';
    throw new Error(`${prefix}Move assertion failed:\n${errors.join('\n')}`);
  }
}

/**
 * Helper: Check if two positions are equal
 */
export function positionsEqual(pos1: Position, pos2: Position): boolean {
  return pos1.x === pos2.x && pos1.y === pos2.y;
}

/**
 * Assert that game state has expected turn
 */
export function assertCurrentTurn(
  gameState: GameState,
  expectedColor: PlayerColor,
  message?: string
): void {
  if (gameState.currentTurn !== expectedColor) {
    const prefix = message ? `${message}\n` : '';
    throw new Error(
      `${prefix}Current turn mismatch: expected ${expectedColor}, got ${gameState.currentTurn}`
    );
  }
}

/**
 * Assert that game is in expected phase
 */
export function assertGamePhase(
  gameState: GameState,
  expectedPhase: string,
  message?: string
): void {
  if (gameState.phase !== expectedPhase) {
    const prefix = message ? `${message}\n` : '';
    throw new Error(
      `${prefix}Game phase mismatch: expected ${expectedPhase}, got ${gameState.phase}`
    );
  }
}

/**
 * Assert that move history has expected length
 */
export function assertMoveHistoryLength(
  gameState: GameState,
  expectedLength: number,
  message?: string
): void {
  const actual = gameState.moveHistory.length;
  if (actual !== expectedLength) {
    const prefix = message ? `${message}\n` : '';
    throw new Error(
      `${prefix}Move history length mismatch: expected ${expectedLength}, got ${actual}`
    );
  }
}

/**
 * Assert that room has disconnected players
 */
export function assertDisconnectedPlayers(
  room: Room,
  expectedCount: number,
  message?: string
): void {
  const actual = room.disconnectedPlayers.size;
  if (actual !== expectedCount) {
    const prefix = message ? `${message}\n` : '';
    throw new Error(
      `${prefix}Disconnected player count mismatch: expected ${expectedCount}, got ${actual}`
    );
  }
}

/**
 * Assert that room activity timestamp is recent
 */
export function assertRecentActivity(room: Room, maxAgeMs: number = 5000, message?: string): void {
  const age = Date.now() - room.lastActivityAt;
  if (age > maxAgeMs) {
    const prefix = message ? `${message}\n` : '';
    throw new Error(`${prefix}Room activity too old: ${age}ms ago (max ${maxAgeMs}ms)`);
  }
}

/**
 * Compare two arrays for equality (order-independent)
 */
export function assertArraysEqualUnordered<T>(
  actual: T[],
  expected: T[],
  compareFn: (a: T, b: T) => boolean,
  message?: string
): void {
  if (actual.length !== expected.length) {
    const prefix = message ? `${message}\n` : '';
    throw new Error(
      `${prefix}Array length mismatch: expected ${expected.length}, got ${actual.length}`
    );
  }

  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();

  for (let i = 0; i < actualSorted.length; i++) {
    if (!compareFn(actualSorted[i], expectedSorted[i])) {
      const prefix = message ? `${message}\n` : '';
      throw new Error(`${prefix}Array element mismatch at index ${i}`);
    }
  }
}

/**
 * Pretty-print game state for debugging
 */
export function formatGameState(gameState: GameState): string {
  return JSON.stringify(
    {
      id: gameState.id,
      phase: gameState.phase,
      currentTurn: gameState.currentTurn,
      playerCount: gameState.players.length,
      moveCount: gameState.moveHistory.length,
      capturedCount: gameState.capturedPieces.length,
      isInCheck: gameState.checkState.isInCheck,
      isCheckmate: gameState.checkState.isCheckmate,
    },
    null,
    2
  );
}

/**
 * Pretty-print room for debugging
 */
export function formatRoom(room: Room): string {
  return JSON.stringify(
    {
      id: room.id,
      status: room.status,
      playerCount: room.players.length,
      disconnectedCount: room.disconnectedPlayers.size,
      gamePhase: room.gameState.phase,
      createdAt: new Date(room.createdAt).toISOString(),
      lastActivityAt: new Date(room.lastActivityAt).toISOString(),
    },
    null,
    2
  );
}
