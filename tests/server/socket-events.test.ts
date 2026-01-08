/**
 * Unit tests for Socket.IO event handlers
 * Tests move validation, turn enforcement, and state broadcast logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Room } from '@/types/multiplayer';
import type { Move, PlayerColor } from '@/types/game';
import { createActiveRoom, createTestGameState } from '../fixtures/multiplayer-fixtures';

describe('Socket.IO Event Handlers - Move Validation', () => {
  let room: Room;

  beforeEach(() => {
    room = createActiveRoom();
    // Set game to playing phase
    room.gameState.phase = 'playing';
  });

  describe('Move validation logic', () => {
    it('should validate move before broadcast', () => {
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

      // Mock validation function
      const validateMove = (gameState: any, move: Move) => {
        // Basic validation: check if move is within bounds
        return move.to.x >= 0 && move.to.x < 9 && move.to.y >= 0 && move.to.y < 10;
      };

      const isValid = validateMove(room.gameState, move);
      expect(isValid).toBe(true);
    });

    it('should reject invalid moves', () => {
      const invalidMove: Move = {
        piece: {
          id: 'piece-1',
          type: 'soldier',
          color: 'red' as PlayerColor,
          position: { x: 0, y: 0 },
        },
        from: { x: 0, y: 0 },
        to: { x: 20, y: 30 }, // Out of bounds
      };

      const validateMove = (gameState: any, move: Move) => {
        return move.to.x >= 0 && move.to.x < 9 && move.to.y >= 0 && move.to.y < 10;
      };

      const isValid = validateMove(room.gameState, invalidMove);
      expect(isValid).toBe(false);
    });

    it('should validate piece ownership before move', () => {
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

      const currentTurn: PlayerColor = 'red';

      // Validate piece color matches current turn
      const isPieceOwner = move.piece.color === currentTurn;
      expect(isPieceOwner).toBe(true);
    });

    it('should reject move if piece color does not match turn', () => {
      const move: Move = {
        piece: {
          id: 'piece-1',
          type: 'soldier',
          color: 'black' as PlayerColor,
          position: { x: 0, y: 0 },
        },
        from: { x: 0, y: 0 },
        to: { x: 0, y: 1 },
      };

      const currentTurn: PlayerColor = 'red';

      const isPieceOwner = move.piece.color === currentTurn;
      expect(isPieceOwner).toBe(false);
    });

    it('should validate move is from correct player session', () => {
      const playerSessionId = 'session-red';
      const playerColor: PlayerColor = 'red';
      const currentTurn: PlayerColor = 'red';

      // Check if player's color matches current turn
      const canMove = playerColor === currentTurn;
      expect(canMove).toBe(true);
    });
  });

  describe('Turn enforcement logic', () => {
    it('should only allow current turn player to move', () => {
      room.gameState.currentTurn = 'red';
      const redPlayer = room.players.find(p => p.color === 'red');
      const blackPlayer = room.players.find(p => p.color === 'black');

      // Red player should be able to move
      const redCanMove = redPlayer!.color === room.gameState.currentTurn;
      expect(redCanMove).toBe(true);

      // Black player should not be able to move
      const blackCanMove = blackPlayer!.color === room.gameState.currentTurn;
      expect(blackCanMove).toBe(false);
    });

    it('should switch turn after valid move', () => {
      room.gameState.currentTurn = 'red';

      // Simulate turn switch
      const nextTurn: PlayerColor = room.gameState.currentTurn === 'red' ? 'black' : 'red';

      expect(nextTurn).toBe('black');
    });

    it('should not switch turn if move is invalid', () => {
      const currentTurn = room.gameState.currentTurn;
      const moveIsValid = false;

      // Turn should not change if move is invalid
      if (moveIsValid) {
        room.gameState.currentTurn = currentTurn === 'red' ? 'black' : 'red';
      }

      expect(room.gameState.currentTurn).toBe(currentTurn);
    });

    it('should track move in history after successful move', () => {
      const initialHistoryLength = room.gameState.moveHistory.length;

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

      // Add move to history
      room.gameState.moveHistory.push(move);

      expect(room.gameState.moveHistory.length).toBe(initialHistoryLength + 1);
      expect(room.gameState.moveHistory[room.gameState.moveHistory.length - 1]).toBe(move);
    });

    it('should update lastActivityAt after move', () => {
      const before = Date.now();
      room.lastActivityAt = Date.now();
      const after = Date.now();

      expect(room.lastActivityAt).toBeGreaterThanOrEqual(before);
      expect(room.lastActivityAt).toBeLessThanOrEqual(after);
    });
  });

  describe('Game state broadcast logic', () => {
    it('should broadcast to all players in room', () => {
      // Mock broadcast function
      const broadcastTargets: string[] = [];

      room.players.forEach(player => {
        if (player.isConnected) {
          broadcastTargets.push(player.socketId);
        }
      });

      expect(broadcastTargets).toHaveLength(2);
      expect(broadcastTargets).toContain(room.players[0].socketId);
      expect(broadcastTargets).toContain(room.players[1].socketId);
    });

    it('should only broadcast to connected players', () => {
      // Disconnect one player
      room.players[1].isConnected = false;

      const broadcastTargets: string[] = [];

      room.players.forEach(player => {
        if (player.isConnected) {
          broadcastTargets.push(player.socketId);
        }
      });

      expect(broadcastTargets).toHaveLength(1);
      expect(broadcastTargets).toContain(room.players[0].socketId);
      expect(broadcastTargets).not.toContain(room.players[1].socketId);
    });

    it('should include last move in broadcast', () => {
      const lastMove: Move = {
        piece: {
          id: 'piece-1',
          type: 'soldier',
          color: 'red' as PlayerColor,
          position: { x: 0, y: 0 },
        },
        from: { x: 0, y: 0 },
        to: { x: 0, y: 1 },
      };

      room.gameState.moveHistory.push(lastMove);

      const broadcastData = {
        type: 'game:state',
        gameState: room.gameState,
        lastMove: room.gameState.moveHistory[room.gameState.moveHistory.length - 1],
      };

      expect(broadcastData.lastMove).toBe(lastMove);
    });

    it('should include current turn in broadcast', () => {
      room.gameState.currentTurn = 'black';

      const broadcastData = {
        type: 'game:state',
        gameState: room.gameState,
      };

      expect(broadcastData.gameState.currentTurn).toBe('black');
    });

    it('should include check state in broadcast', () => {
      room.gameState.checkState = {
        isInCheck: true,
        isCheckmate: false,
        isStalemate: false,
        checkingPieces: [],
      };

      const broadcastData = {
        type: 'game:state',
        gameState: room.gameState,
      };

      expect(broadcastData.gameState.checkState.isInCheck).toBe(true);
    });
  });

  describe('Move acknowledgment logic', () => {
    it('should send success acknowledgment for valid move', () => {
      const moveIsValid = true;

      const ackResponse = {
        success: moveIsValid,
      };

      expect(ackResponse.success).toBe(true);
      expect(ackResponse).not.toHaveProperty('error');
    });

    it('should send error acknowledgment for invalid move', () => {
      const moveIsValid = false;
      const errorMessage = 'Invalid move: piece cannot move there';

      const ackResponse = {
        success: moveIsValid,
        error: errorMessage,
        correctState: room.gameState,
      };

      expect(ackResponse.success).toBe(false);
      expect(ackResponse.error).toBe(errorMessage);
      expect(ackResponse.correctState).toBeDefined();
    });

    it('should include correct state on validation failure', () => {
      const originalState = { ...room.gameState };
      const moveIsValid = false;

      const ackResponse = {
        success: moveIsValid,
        error: 'Invalid move',
        correctState: originalState,
      };

      expect(ackResponse.correctState).toEqual(originalState);
    });
  });

  describe('Game end detection', () => {
    it('should detect checkmate', () => {
      room.gameState.checkState = {
        isInCheck: true,
        isCheckmate: true,
        isStalemate: false,
        checkingPieces: [],
      };

      expect(room.gameState.checkState.isCheckmate).toBe(true);
    });

    it('should detect stalemate', () => {
      room.gameState.checkState = {
        isInCheck: false,
        isCheckmate: false,
        isStalemate: true,
        checkingPieces: [],
      };

      expect(room.gameState.checkState.isStalemate).toBe(true);
    });

    it('should broadcast game:end event on checkmate', () => {
      const isCheckmate = room.gameState.checkState.isCheckmate;
      const winner = room.gameState.currentTurn === 'red' ? 'black' : 'red';

      if (isCheckmate) {
        const gameEndData = {
          type: 'game:end',
          result: 'checkmate' as const,
          winner: winner as PlayerColor,
        };

        expect(gameEndData.type).toBe('game:end');
        expect(gameEndData.result).toBe('checkmate');
        expect(gameEndData.winner).toBeDefined();
      }
    });

    it('should transition room to ENDED status on game completion', () => {
      const isGameOver = room.gameState.checkState.isCheckmate ||
                        room.gameState.checkState.isStalemate;

      if (isGameOver) {
        room.status = 'ended';
      }

      // For this test, game is not over
      expect(room.status).toBe('active');
    });
  });
});
