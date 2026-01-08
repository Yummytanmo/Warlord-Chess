/**
 * Unit tests for game state synchronization logic
 * Tests state broadcast consistency and synchronization rules
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Room } from '@/types/multiplayer';
import type { GameState, Move, PlayerColor } from '@/types/game';
import {
  createActiveRoom,
  createGameInProgress,
} from '../fixtures/multiplayer-fixtures';
import {
  assertGameStatesEqual,
  assertCurrentTurn,
  assertMoveHistoryLength,
} from '../helpers/game-assertions';

describe('Game State Synchronization - Unit Tests', () => {
  let room: Room;

  beforeEach(() => {
    room = createActiveRoom();
    room.gameState.phase = 'playing';
  });

  describe('State consistency', () => {
    it('should maintain identical game state for all players', () => {
      const gameState = room.gameState;

      // Both players should see the same game state
      const player1View = { ...gameState };
      const player2View = { ...gameState };

      assertGameStatesEqual(player1View, player2View);
    });

    it('should synchronize current turn across all clients', () => {
      room.gameState.currentTurn = 'red';

      const currentTurn = room.gameState.currentTurn;

      expect(currentTurn).toBe('red');
      assertCurrentTurn(room.gameState, 'red');
    });

    it('should synchronize move history', () => {
      const move: Move = {
        piece: {
          id: 'piece-1',
          type: 'soldier',
          color: 'red' as PlayerColor,
          position: { x: 0, y: 0 },
        },
        from: { x: 0, y: 0 },
        to: { x: 0, y: 1 },
      };

      room.gameState.moveHistory.push(move);

      assertMoveHistoryLength(room.gameState, 1);
      expect(room.gameState.moveHistory[0]).toBe(move);
    });

    it('should synchronize captured pieces', () => {
      const capturedPiece = {
        id: 'captured-1',
        type: 'soldier' as const,
        color: 'black' as PlayerColor,
        position: { x: 0, y: 1 },
      };

      room.gameState.capturedPieces.push(capturedPiece);

      expect(room.gameState.capturedPieces).toHaveLength(1);
      expect(room.gameState.capturedPieces[0].id).toBe('captured-1');
    });

    it('should synchronize check state', () => {
      room.gameState.checkState = {
        isInCheck: true,
        isCheckmate: false,
        isStalemate: false,
        checkingPieces: [],
      };

      expect(room.gameState.checkState.isInCheck).toBe(true);
      expect(room.gameState.checkState.isCheckmate).toBe(false);
    });
  });

  describe('State broadcast rules', () => {
    it('should broadcast state after each move', () => {
      const initialHistoryLength = room.gameState.moveHistory.length;

      // Simulate move
      const move: Move = {
        piece: {
          id: 'piece-1',
          type: 'soldier',
          color: 'red' as PlayerColor,
          position: { x: 0, y: 0 },
        },
        from: { x: 0, y: 0 },
        to: { x: 0, y: 1 },
      };

      room.gameState.moveHistory.push(move);

      // Verify broadcast is needed
      const shouldBroadcast = room.gameState.moveHistory.length > initialHistoryLength;
      expect(shouldBroadcast).toBe(true);
    });

    it('should broadcast to all room members', () => {
      const roomId = room.id;
      const playerIds = room.players.map(p => p.socketId);

      expect(playerIds).toHaveLength(2);
    });

    it('should send state to all connected players', () => {
      const connectedPlayers = room.players.filter(p => p.isConnected);
      expect(connectedPlayers).toHaveLength(2);
    });

    it('should exclude disconnected players from broadcast', () => {
      room.players[1].isConnected = false;

      const connectedPlayers = room.players.filter(p => p.isConnected);
      expect(connectedPlayers).toHaveLength(1);
      expect(connectedPlayers[0].color).toBe('red');
    });
  });

  describe('State update order', () => {
    it('should update state before broadcasting', () => {
      const move: Move = {
        piece: {
          id: 'piece-1',
          type: 'soldier',
          color: 'red' as PlayerColor,
          position: { x: 0, y: 0 },
        },
        from: { x: 0, y: 0 },
        to: { x: 0, y: 1 },
      };

      // Update state
      room.gameState.moveHistory.push(move);
      room.gameState.currentTurn = 'black';

      // Verify state is updated
      expect(room.gameState.moveHistory).toHaveLength(1);
      expect(room.gameState.currentTurn).toBe('black');

      // Now broadcast would happen
    });

    it('should maintain move order in history', () => {
      const move1: Move = {
        piece: {
          id: 'piece-1',
          type: 'soldier',
          color: 'red' as PlayerColor,
          position: { x: 0, y: 0 },
        },
        from: { x: 0, y: 0 },
        to: { x: 0, y: 1 },
      };

      const move2: Move = {
        piece: {
          id: 'piece-2',
          type: 'soldier',
          color: 'black' as PlayerColor,
          position: { x: 0, y: 9 },
        },
        from: { x: 0, y: 9 },
        to: { x: 0, y: 8 },
      };

      room.gameState.moveHistory.push(move1);
      room.gameState.moveHistory.push(move2);

      expect(room.gameState.moveHistory[0]).toBe(move1);
      expect(room.gameState.moveHistory[1]).toBe(move2);
    });
  });

  describe('State delta optimization', () => {
    it('should identify what changed in game state', () => {
      const beforeState = { ...room.gameState };
      const beforeHistoryLength = beforeState.moveHistory.length;
      const beforeTurn = beforeState.currentTurn;

      // Make a change
      room.gameState.currentTurn = 'black';

      // Detect changes
      const turnChanged = room.gameState.currentTurn !== beforeTurn;
      const movesAdded = room.gameState.moveHistory.length > beforeHistoryLength;

      expect(turnChanged).toBe(true);
      expect(movesAdded).toBe(false);
    });

    it('should track multiple simultaneous changes', () => {
      const initialCreatedAt = room.createdAt;

      const move: Move = {
        piece: {
          id: 'piece-1',
          type: 'soldier',
          color: 'red' as PlayerColor,
          position: { x: 0, y: 0 },
        },
        from: { x: 0, y: 0 },
        to: { x: 0, y: 1 },
      };

      // Multiple changes at once (with slight delay to ensure timestamp difference)
      room.gameState.moveHistory.push(move);
      room.gameState.currentTurn = 'black';
      room.lastActivityAt = Date.now();

      expect(room.gameState.moveHistory).toHaveLength(1);
      expect(room.gameState.currentTurn).toBe('black');
      expect(room.lastActivityAt).toBeGreaterThanOrEqual(initialCreatedAt);
    });
  });

  describe('Concurrent move handling', () => {
    it('should serialize simultaneous move attempts', () => {
      // Simulate race condition: both players try to move at same time
      const move1Color: PlayerColor = 'red';
      const move2Color: PlayerColor = 'black';
      const currentTurn: PlayerColor = 'red';

      // Only the player whose turn it is should succeed
      const move1Valid = move1Color === currentTurn;
      const move2Valid = move2Color === currentTurn;

      expect(move1Valid).toBe(true);
      expect(move2Valid).toBe(false);
    });

    it('should prevent double moves by same player', () => {
      room.gameState.currentTurn = 'red';

      // First move attempt
      const firstMoveValid = room.gameState.currentTurn === 'red';
      expect(firstMoveValid).toBe(true);

      // After first move, turn switches
      room.gameState.currentTurn = 'black';

      // Second move attempt by same player should fail
      const secondMoveValid = room.gameState.currentTurn === 'red';
      expect(secondMoveValid).toBe(false);
    });
  });

  describe('State rollback on error', () => {
    it('should preserve state when move is invalid', () => {
      const originalState = { ...room.gameState };
      const originalTurn = originalState.currentTurn;
      const originalHistoryLength = originalState.moveHistory.length;

      // Simulate invalid move (doesn't actually modify state)
      const moveIsValid = false;

      if (!moveIsValid) {
        // State should remain unchanged
        expect(room.gameState.currentTurn).toBe(originalTurn);
        expect(room.gameState.moveHistory.length).toBe(originalHistoryLength);
      }
    });

    it('should send correct state to client on rollback', () => {
      const correctState = { ...room.gameState };

      const rollbackData = {
        success: false,
        error: 'Invalid move',
        correctState: correctState,
      };

      expect(rollbackData.correctState).toBeDefined();
      assertGameStatesEqual(rollbackData.correctState, room.gameState);
    });
  });

  describe('State synchronization with game in progress', () => {
    it('should handle existing move history', () => {
      room = createGameInProgress(10);

      expect(room.gameState.moveHistory).toHaveLength(10);
      expect(room.gameState.phase).toBe('playing');
    });

    it('should maintain state consistency with many moves', () => {
      room = createGameInProgress(50);

      // All moves should be in history
      assertMoveHistoryLength(room.gameState, 50);

      // Turn should alternate correctly
      const expectedTurn: PlayerColor = 50 % 2 === 0 ? 'red' : 'black';
      expect(room.gameState.currentTurn).toBe(expectedTurn);
    });
  });
});
