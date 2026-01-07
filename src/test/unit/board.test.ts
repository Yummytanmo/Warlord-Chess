import { describe, it, expect, beforeEach } from 'vitest';
import { ChessBoard } from '@/lib/board';
import { Piece, PieceType, PlayerColor } from '@/types/game';

/**
 * 棋盘类单元测试
 * 验证: 需求 1.4
 */

describe('ChessBoard', () => {
  let board: ChessBoard;

  beforeEach(() => {
    board = new ChessBoard();
  });

  describe('Board Initialization', () => {
    it('should initialize with correct board size', () => {
      expect(board.BOARD_SIZE.width).toBe(9);
      expect(board.BOARD_SIZE.height).toBe(10);
    });

    it('should initialize with empty grid', () => {
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 9; x++) {
          expect(board.getPiece({ x, y })).toBeNull();
        }
      }
    });
  });

  describe('Position Validation', () => {
    it('should validate correct positions', () => {
      expect(board.isValidPosition({ x: 0, y: 0 })).toBe(true);
      expect(board.isValidPosition({ x: 8, y: 9 })).toBe(true);
      expect(board.isValidPosition({ x: 4, y: 5 })).toBe(true);
    });

    it('should reject invalid positions', () => {
      expect(board.isValidPosition({ x: -1, y: 0 })).toBe(false);
      expect(board.isValidPosition({ x: 9, y: 0 })).toBe(false);
      expect(board.isValidPosition({ x: 0, y: -1 })).toBe(false);
      expect(board.isValidPosition({ x: 0, y: 10 })).toBe(false);
    });
  });

  describe('Piece Placement and Retrieval', () => {
    it('should place and retrieve pieces correctly', () => {
      const piece: Piece = {
        id: 'test-piece',
        type: PieceType.KING,
        color: PlayerColor.RED,
        position: { x: 4, y: 9 },
        isAlive: true
      };

      board.setPiece({ x: 4, y: 9 }, piece);
      const retrievedPiece = board.getPiece({ x: 4, y: 9 });

      expect(retrievedPiece).toEqual(piece);
      expect(retrievedPiece!.position).toEqual({ x: 4, y: 9 });
    });

    it('should update piece position when placing', () => {
      const piece: Piece = {
        id: 'test-piece',
        type: PieceType.KING,
        color: PlayerColor.RED,
        position: { x: 0, y: 0 },
        isAlive: true
      };

      board.setPiece({ x: 4, y: 9 }, piece);

      expect(piece.position).toEqual({ x: 4, y: 9 });
    });

    it('should remove pieces by setting to null', () => {
      const piece: Piece = {
        id: 'test-piece',
        type: PieceType.KING,
        color: PlayerColor.RED,
        position: { x: 4, y: 9 },
        isAlive: true
      };

      board.setPiece({ x: 4, y: 9 }, piece);
      board.setPiece({ x: 4, y: 9 }, null);

      expect(board.getPiece({ x: 4, y: 9 })).toBeNull();
    });

    it('should handle invalid positions gracefully', () => {
      const piece: Piece = {
        id: 'test-piece',
        type: PieceType.KING,
        color: PlayerColor.RED,
        position: { x: 4, y: 9 },
        isAlive: true
      };

      // Should not throw error
      board.setPiece({ x: -1, y: 0 }, piece);
      expect(board.getPiece({ x: -1, y: 0 })).toBeNull();
    });
  });

  describe('Palace Detection', () => {
    it('should correctly identify red palace positions', () => {
      // Red palace: x: 3-5, y: 7-9
      expect(board.isInPalace({ x: 3, y: 7 }, PlayerColor.RED)).toBe(true);
      expect(board.isInPalace({ x: 4, y: 8 }, PlayerColor.RED)).toBe(true);
      expect(board.isInPalace({ x: 5, y: 9 }, PlayerColor.RED)).toBe(true);
      
      // Outside red palace
      expect(board.isInPalace({ x: 2, y: 8 }, PlayerColor.RED)).toBe(false);
      expect(board.isInPalace({ x: 4, y: 6 }, PlayerColor.RED)).toBe(false);
      expect(board.isInPalace({ x: 6, y: 8 }, PlayerColor.RED)).toBe(false);
    });

    it('should correctly identify black palace positions', () => {
      // Black palace: x: 3-5, y: 0-2
      expect(board.isInPalace({ x: 3, y: 0 }, PlayerColor.BLACK)).toBe(true);
      expect(board.isInPalace({ x: 4, y: 1 }, PlayerColor.BLACK)).toBe(true);
      expect(board.isInPalace({ x: 5, y: 2 }, PlayerColor.BLACK)).toBe(true);
      
      // Outside black palace
      expect(board.isInPalace({ x: 2, y: 1 }, PlayerColor.BLACK)).toBe(false);
      expect(board.isInPalace({ x: 4, y: 3 }, PlayerColor.BLACK)).toBe(false);
      expect(board.isInPalace({ x: 6, y: 1 }, PlayerColor.BLACK)).toBe(false);
    });

    it('should handle invalid positions in palace detection', () => {
      expect(board.isInPalace({ x: -1, y: 8 }, PlayerColor.RED)).toBe(false);
      expect(board.isInPalace({ x: 4, y: 10 }, PlayerColor.BLACK)).toBe(false);
    });
  });

  describe('River Crossing Detection', () => {
    it('should correctly detect red pieces crossing river', () => {
      // Red pieces cross river when y < 5
      expect(board.hasRiverCrossed({ x: 4, y: 4 }, PlayerColor.RED)).toBe(true);
      expect(board.hasRiverCrossed({ x: 4, y: 3 }, PlayerColor.RED)).toBe(true);
      expect(board.hasRiverCrossed({ x: 4, y: 0 }, PlayerColor.RED)).toBe(true);
      
      // Red pieces haven't crossed river when y >= 5
      expect(board.hasRiverCrossed({ x: 4, y: 5 }, PlayerColor.RED)).toBe(false);
      expect(board.hasRiverCrossed({ x: 4, y: 6 }, PlayerColor.RED)).toBe(false);
      expect(board.hasRiverCrossed({ x: 4, y: 9 }, PlayerColor.RED)).toBe(false);
    });

    it('should correctly detect black pieces crossing river', () => {
      // Black pieces cross river when y > 4
      expect(board.hasRiverCrossed({ x: 4, y: 5 }, PlayerColor.BLACK)).toBe(true);
      expect(board.hasRiverCrossed({ x: 4, y: 6 }, PlayerColor.BLACK)).toBe(true);
      expect(board.hasRiverCrossed({ x: 4, y: 9 }, PlayerColor.BLACK)).toBe(true);
      
      // Black pieces haven't crossed river when y <= 4
      expect(board.hasRiverCrossed({ x: 4, y: 4 }, PlayerColor.BLACK)).toBe(false);
      expect(board.hasRiverCrossed({ x: 4, y: 3 }, PlayerColor.BLACK)).toBe(false);
      expect(board.hasRiverCrossed({ x: 4, y: 0 }, PlayerColor.BLACK)).toBe(false);
    });

    it('should handle invalid positions in river crossing detection', () => {
      expect(board.hasRiverCrossed({ x: -1, y: 4 }, PlayerColor.RED)).toBe(false);
      expect(board.hasRiverCrossed({ x: 4, y: 10 }, PlayerColor.BLACK)).toBe(false);
    });
  });

  describe('Piece Collection', () => {
    it('should get all pieces on board', () => {
      const piece1: Piece = {
        id: 'piece1',
        type: PieceType.KING,
        color: PlayerColor.RED,
        position: { x: 4, y: 9 },
        isAlive: true
      };

      const piece2: Piece = {
        id: 'piece2',
        type: PieceType.KING,
        color: PlayerColor.BLACK,
        position: { x: 4, y: 0 },
        isAlive: true
      };

      board.setPiece(piece1.position, piece1);
      board.setPiece(piece2.position, piece2);

      const allPieces = board.getAllPieces();
      expect(allPieces.length).toBe(2);
      expect(allPieces).toContain(piece1);
      expect(allPieces).toContain(piece2);
    });

    it('should only return alive pieces', () => {
      const alivePiece: Piece = {
        id: 'alive',
        type: PieceType.KING,
        color: PlayerColor.RED,
        position: { x: 4, y: 9 },
        isAlive: true
      };

      const deadPiece: Piece = {
        id: 'dead',
        type: PieceType.KING,
        color: PlayerColor.BLACK,
        position: { x: 4, y: 0 },
        isAlive: false
      };

      board.setPiece(alivePiece.position, alivePiece);
      board.setPiece(deadPiece.position, deadPiece);

      const allPieces = board.getAllPieces();
      expect(allPieces.length).toBe(1);
      expect(allPieces).toContain(alivePiece);
      expect(allPieces).not.toContain(deadPiece);
    });

    it('should get pieces by color', () => {
      const redPiece: Piece = {
        id: 'red',
        type: PieceType.KING,
        color: PlayerColor.RED,
        position: { x: 4, y: 9 },
        isAlive: true
      };

      const blackPiece: Piece = {
        id: 'black',
        type: PieceType.KING,
        color: PlayerColor.BLACK,
        position: { x: 4, y: 0 },
        isAlive: true
      };

      board.setPiece(redPiece.position, redPiece);
      board.setPiece(blackPiece.position, blackPiece);

      const redPieces = board.getPiecesByColor(PlayerColor.RED);
      const blackPieces = board.getPiecesByColor(PlayerColor.BLACK);

      expect(redPieces.length).toBe(1);
      expect(blackPieces.length).toBe(1);
      expect(redPieces).toContain(redPiece);
      expect(blackPieces).toContain(blackPiece);
    });
  });

  describe('Board Operations', () => {
    it('should clear all pieces from board', () => {
      const piece: Piece = {
        id: 'test',
        type: PieceType.KING,
        color: PlayerColor.RED,
        position: { x: 4, y: 9 },
        isAlive: true
      };

      board.setPiece(piece.position, piece);
      expect(board.getAllPieces().length).toBe(1);

      board.clear();
      expect(board.getAllPieces().length).toBe(0);
      expect(board.getPiece({ x: 4, y: 9 })).toBeNull();
    });

    it('should clone board with all pieces', () => {
      const piece1: Piece = {
        id: 'piece1',
        type: PieceType.KING,
        color: PlayerColor.RED,
        position: { x: 4, y: 9 },
        isAlive: true
      };

      const piece2: Piece = {
        id: 'piece2',
        type: PieceType.KING,
        color: PlayerColor.BLACK,
        position: { x: 4, y: 0 },
        isAlive: true
      };

      board.setPiece(piece1.position, piece1);
      board.setPiece(piece2.position, piece2);

      const clonedBoard = board.clone();

      // Cloned board should have same pieces
      expect(clonedBoard.getAllPieces().length).toBe(2);
      expect(clonedBoard.getPiece({ x: 4, y: 9 })).toEqual(piece1);
      expect(clonedBoard.getPiece({ x: 4, y: 0 })).toEqual(piece2);

      // Modifying original should not affect clone
      board.setPiece({ x: 4, y: 9 }, null);
      expect(board.getPiece({ x: 4, y: 9 })).toBeNull();
      expect(clonedBoard.getPiece({ x: 4, y: 9 })).toEqual(piece1);
    });
  });

  describe('Path Analysis', () => {
    it('should detect blocked paths', () => {
      const blockingPiece: Piece = {
        id: 'blocking',
        type: PieceType.PAWN,
        color: PlayerColor.RED,
        position: { x: 2, y: 5 },
        isAlive: true
      };

      board.setPiece(blockingPiece.position, blockingPiece);

      // Horizontal path blocked
      expect(board.isPathBlocked({ x: 0, y: 5 }, { x: 4, y: 5 })).toBe(true);
      
      // Vertical path blocked
      expect(board.isPathBlocked({ x: 2, y: 3 }, { x: 2, y: 7 })).toBe(true);
      
      // Clear path
      expect(board.isPathBlocked({ x: 0, y: 0 }, { x: 4, y: 0 })).toBe(false);
    });

    it('should reject diagonal paths', () => {
      expect(board.isPathBlocked({ x: 0, y: 0 }, { x: 2, y: 2 })).toBe(true);
    });

    it('should handle same position', () => {
      expect(board.isPathBlocked({ x: 4, y: 4 }, { x: 4, y: 4 })).toBe(false);
    });

    it('should calculate distance correctly', () => {
      expect(board.getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
      expect(board.getDistance({ x: 2, y: 2 }, { x: 2, y: 2 })).toBe(0);
      expect(board.getDistance({ x: 1, y: 1 }, { x: 4, y: 5 })).toBe(7);
    });

    it('should detect same line correctly', () => {
      // Same horizontal line
      expect(board.isOnSameLine({ x: 0, y: 5 }, { x: 8, y: 5 })).toBe(true);
      
      // Same vertical line
      expect(board.isOnSameLine({ x: 4, y: 0 }, { x: 4, y: 9 })).toBe(true);
      
      // Different lines
      expect(board.isOnSameLine({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe(false);
      
      // Same position
      expect(board.isOnSameLine({ x: 4, y: 4 }, { x: 4, y: 4 })).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple pieces at different positions', () => {
      const pieces: Piece[] = [];
      
      // Place pieces at various positions
      for (let i = 0; i < 5; i++) {
        const piece: Piece = {
          id: `piece-${i}`,
          type: PieceType.PAWN,
          color: i % 2 === 0 ? PlayerColor.RED : PlayerColor.BLACK,
          position: { x: i, y: i },
          isAlive: true
        };
        pieces.push(piece);
        board.setPiece(piece.position, piece);
      }

      expect(board.getAllPieces().length).toBe(5);
      
      pieces.forEach(piece => {
        expect(board.getPiece(piece.position)).toEqual(piece);
      });
    });

    it('should handle piece replacement', () => {
      const piece1: Piece = {
        id: 'piece1',
        type: PieceType.KING,
        color: PlayerColor.RED,
        position: { x: 4, y: 9 },
        isAlive: true
      };

      const piece2: Piece = {
        id: 'piece2',
        type: PieceType.KING,
        color: PlayerColor.BLACK,
        position: { x: 4, y: 0 },
        isAlive: true
      };

      board.setPiece({ x: 4, y: 4 }, piece1);
      board.setPiece({ x: 4, y: 4 }, piece2); // Replace piece1 with piece2

      expect(board.getPiece({ x: 4, y: 4 })).toEqual(piece2);
      expect(board.getAllPieces().length).toBe(1);
    });
  });
});