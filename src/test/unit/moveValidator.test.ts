import { describe, it, expect, beforeEach } from 'vitest';
import { ChessMoveValidator } from '@/lib/moveValidator';
import { ChessBoard } from '@/lib/board';
import { 
  GameState, 
  Move, 
  Piece, 
  PieceType, 
  PlayerColor, 
  GamePhase 
} from '@/types/game';

/**
 * 象棋移动规则单元测试
 * 验证: 需求 1.4
 */

describe('ChessMoveValidator', () => {
  let validator: ChessMoveValidator;
  let board: ChessBoard;
  let gameState: GameState;

  beforeEach(() => {
    validator = new ChessMoveValidator();
    board = new ChessBoard();
    
    // 创建基本游戏状态
    gameState = {
      board,
      players: [
        {
          id: 'player1',
          color: PlayerColor.RED,
          hero: { id: '', name: '', skills: [], awakened: false },
          pieces: []
        },
        {
          id: 'player2',
          color: PlayerColor.BLACK,
          hero: { id: '', name: '', skills: [], awakened: false },
          pieces: []
        }
      ],
      currentPlayer: PlayerColor.RED,
      gamePhase: GamePhase.PLAYING,
      moveHistory: []
    };
  });

  describe('King Movement', () => {
    it('should allow king to move one step horizontally within palace', () => {
      const king: Piece = {
        id: 'red-king',
        type: PieceType.KING,
        color: PlayerColor.RED,
        position: { x: 4, y: 8 },
        isAlive: true
      };
      
      board.setPiece(king.position, king);
      
      const move: Move = {
        from: { x: 4, y: 8 },
        to: { x: 5, y: 8 },
        piece: king,
        timestamp: Date.now()
      };
      
      const result = validator.validateMove(move, gameState);
      expect(result.isValid).toBe(true);
    });

    it('should allow king to move one step vertically within palace', () => {
      const king: Piece = {
        id: 'red-king',
        type: PieceType.KING,
        color: PlayerColor.RED,
        position: { x: 4, y: 8 },
        isAlive: true
      };
      
      board.setPiece(king.position, king);
      
      const move: Move = {
        from: { x: 4, y: 8 },
        to: { x: 4, y: 9 },
        piece: king,
        timestamp: Date.now()
      };
      
      const result = validator.validateMove(move, gameState);
      expect(result.isValid).toBe(true);
    });

    it('should not allow king to move outside palace', () => {
      const king: Piece = {
        id: 'red-king',
        type: PieceType.KING,
        color: PlayerColor.RED,
        position: { x: 3, y: 9 }, // Edge of palace
        isAlive: true
      };
      
      board.setPiece(king.position, king);
      
      const move: Move = {
        from: { x: 3, y: 9 },
        to: { x: 2, y: 9 }, // One step outside palace
        piece: king,
        timestamp: Date.now()
      };
      
      const result = validator.validateMove(move, gameState);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('九宫');
    });

    it('should not allow king to move more than one step', () => {
      const king: Piece = {
        id: 'red-king',
        type: PieceType.KING,
        color: PlayerColor.RED,
        position: { x: 4, y: 8 },
        isAlive: true
      };
      
      board.setPiece(king.position, king);
      
      const move: Move = {
        from: { x: 4, y: 8 },
        to: { x: 4, y: 6 }, // Two steps
        piece: king,
        timestamp: Date.now()
      };
      
      const result = validator.validateMove(move, gameState);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('一格');
    });
  });

  describe('Advisor Movement', () => {
    it('should allow advisor to move diagonally within palace', () => {
      const advisor: Piece = {
        id: 'red-advisor',
        type: PieceType.ADVISOR,
        color: PlayerColor.RED,
        position: { x: 3, y: 9 },
        isAlive: true
      };
      
      board.setPiece(advisor.position, advisor);
      
      const move: Move = {
        from: { x: 3, y: 9 },
        to: { x: 4, y: 8 },
        piece: advisor,
        timestamp: Date.now()
      };
      
      const result = validator.validateMove(move, gameState);
      expect(result.isValid).toBe(true);
    });

    it('should not allow advisor to move outside palace', () => {
      const advisor: Piece = {
        id: 'red-advisor',
        type: PieceType.ADVISOR,
        color: PlayerColor.RED,
        position: { x: 3, y: 9 },
        isAlive: true
      };
      
      board.setPiece(advisor.position, advisor);
      
      const move: Move = {
        from: { x: 3, y: 9 },
        to: { x: 2, y: 8 }, // Outside palace
        piece: advisor,
        timestamp: Date.now()
      };
      
      const result = validator.validateMove(move, gameState);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('九宫');
    });
  });

  describe('Elephant Movement', () => {
    it('should allow elephant to move in field pattern', () => {
      const elephant: Piece = {
        id: 'red-elephant',
        type: PieceType.ELEPHANT,
        color: PlayerColor.RED,
        position: { x: 2, y: 9 },
        isAlive: true
      };
      
      board.setPiece(elephant.position, elephant);
      
      const move: Move = {
        from: { x: 2, y: 9 },
        to: { x: 4, y: 7 },
        piece: elephant,
        timestamp: Date.now()
      };
      
      const result = validator.validateMove(move, gameState);
      expect(result.isValid).toBe(true);
    });

    it('should not allow elephant to cross river', () => {
      const elephant: Piece = {
        id: 'red-elephant',
        type: PieceType.ELEPHANT,
        color: PlayerColor.RED,
        position: { x: 2, y: 5 }, // At river boundary
        isAlive: true
      };
      
      board.setPiece(elephant.position, elephant);
      
      const move: Move = {
        from: { x: 2, y: 5 },
        to: { x: 4, y: 3 }, // Crosses river (y=3 < 5 for red)
        piece: elephant,
        timestamp: Date.now()
      };
      
      const result = validator.validateMove(move, gameState);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('过河');
    });

    it('should not allow elephant to move when blocked at heart', () => {
      const elephant: Piece = {
        id: 'red-elephant',
        type: PieceType.ELEPHANT,
        color: PlayerColor.RED,
        position: { x: 2, y: 9 },
        isAlive: true
      };
      
      const blockingPiece: Piece = {
        id: 'blocking-piece',
        type: PieceType.PAWN,
        color: PlayerColor.BLACK,
        position: { x: 3, y: 8 }, // Elephant heart
        isAlive: true
      };
      
      board.setPiece(elephant.position, elephant);
      board.setPiece(blockingPiece.position, blockingPiece);
      
      const move: Move = {
        from: { x: 2, y: 9 },
        to: { x: 4, y: 7 },
        piece: elephant,
        timestamp: Date.now()
      };
      
      const result = validator.validateMove(move, gameState);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('象心');
    });
  });

  describe('Horse Movement', () => {
    it('should allow horse to move in L-shape', () => {
      const horse: Piece = {
        id: 'red-horse',
        type: PieceType.HORSE,
        color: PlayerColor.RED,
        position: { x: 1, y: 9 },
        isAlive: true
      };
      
      board.setPiece(horse.position, horse);
      
      const move: Move = {
        from: { x: 1, y: 9 },
        to: { x: 3, y: 8 },
        piece: horse,
        timestamp: Date.now()
      };
      
      const result = validator.validateMove(move, gameState);
      expect(result.isValid).toBe(true);
    });

    it('should not allow horse to move when leg is blocked', () => {
      const horse: Piece = {
        id: 'red-horse',
        type: PieceType.HORSE,
        color: PlayerColor.RED,
        position: { x: 1, y: 9 },
        isAlive: true
      };
      
      const blockingPiece: Piece = {
        id: 'blocking-piece',
        type: PieceType.PAWN,
        color: PlayerColor.BLACK,
        position: { x: 2, y: 9 }, // Horse leg
        isAlive: true
      };
      
      board.setPiece(horse.position, horse);
      board.setPiece(blockingPiece.position, blockingPiece);
      
      const move: Move = {
        from: { x: 1, y: 9 },
        to: { x: 3, y: 8 },
        piece: horse,
        timestamp: Date.now()
      };
      
      const result = validator.validateMove(move, gameState);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('拌腿');
    });
  });

  describe('Chariot Movement', () => {
    it('should allow chariot to move horizontally when path is clear', () => {
      const chariot: Piece = {
        id: 'red-chariot',
        type: PieceType.CHARIOT,
        color: PlayerColor.RED,
        position: { x: 0, y: 9 },
        isAlive: true
      };
      
      board.setPiece(chariot.position, chariot);
      
      const move: Move = {
        from: { x: 0, y: 9 },
        to: { x: 5, y: 9 },
        piece: chariot,
        timestamp: Date.now()
      };
      
      const result = validator.validateMove(move, gameState);
      expect(result.isValid).toBe(true);
    });

    it('should not allow chariot to move when path is blocked', () => {
      const chariot: Piece = {
        id: 'red-chariot',
        type: PieceType.CHARIOT,
        color: PlayerColor.RED,
        position: { x: 0, y: 9 },
        isAlive: true
      };
      
      const blockingPiece: Piece = {
        id: 'blocking-piece',
        type: PieceType.PAWN,
        color: PlayerColor.BLACK,
        position: { x: 3, y: 9 },
        isAlive: true
      };
      
      board.setPiece(chariot.position, chariot);
      board.setPiece(blockingPiece.position, blockingPiece);
      
      const move: Move = {
        from: { x: 0, y: 9 },
        to: { x: 5, y: 9 },
        piece: chariot,
        timestamp: Date.now()
      };
      
      const result = validator.validateMove(move, gameState);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('阻挡');
    });
  });

  describe('Cannon Movement', () => {
    it('should allow cannon to move when not capturing and path is clear', () => {
      const cannon: Piece = {
        id: 'red-cannon',
        type: PieceType.CANNON,
        color: PlayerColor.RED,
        position: { x: 1, y: 7 },
        isAlive: true
      };
      
      board.setPiece(cannon.position, cannon);
      
      const move: Move = {
        from: { x: 1, y: 7 },
        to: { x: 1, y: 5 },
        piece: cannon,
        timestamp: Date.now()
      };
      
      const result = validator.validateMove(move, gameState);
      expect(result.isValid).toBe(true);
    });

    it('should allow cannon to capture with exactly one piece in between', () => {
      const cannon: Piece = {
        id: 'red-cannon',
        type: PieceType.CANNON,
        color: PlayerColor.RED,
        position: { x: 1, y: 7 },
        isAlive: true
      };
      
      const jumpingPiece: Piece = {
        id: 'jumping-piece',
        type: PieceType.PAWN,
        color: PlayerColor.RED,
        position: { x: 1, y: 5 },
        isAlive: true
      };
      
      const targetPiece: Piece = {
        id: 'target-piece',
        type: PieceType.PAWN,
        color: PlayerColor.BLACK,
        position: { x: 1, y: 3 },
        isAlive: true
      };
      
      board.setPiece(cannon.position, cannon);
      board.setPiece(jumpingPiece.position, jumpingPiece);
      board.setPiece(targetPiece.position, targetPiece);
      
      const move: Move = {
        from: { x: 1, y: 7 },
        to: { x: 1, y: 3 },
        piece: cannon,
        timestamp: Date.now()
      };
      
      const result = validator.validateMove(move, gameState);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Pawn Movement', () => {
    it('should allow pawn to move forward before crossing river', () => {
      const pawn: Piece = {
        id: 'red-pawn',
        type: PieceType.PAWN,
        color: PlayerColor.RED,
        position: { x: 0, y: 6 },
        isAlive: true
      };
      
      board.setPiece(pawn.position, pawn);
      
      const move: Move = {
        from: { x: 0, y: 6 },
        to: { x: 0, y: 5 },
        piece: pawn,
        timestamp: Date.now()
      };
      
      const result = validator.validateMove(move, gameState);
      expect(result.isValid).toBe(true);
    });

    it('should allow pawn to move sideways after crossing river', () => {
      const pawn: Piece = {
        id: 'red-pawn',
        type: PieceType.PAWN,
        color: PlayerColor.RED,
        position: { x: 0, y: 4 }, // Already crossed river
        isAlive: true
      };
      
      board.setPiece(pawn.position, pawn);
      
      const move: Move = {
        from: { x: 0, y: 4 },
        to: { x: 1, y: 4 },
        piece: pawn,
        timestamp: Date.now()
      };
      
      const result = validator.validateMove(move, gameState);
      expect(result.isValid).toBe(true);
    });

    it('should not allow pawn to move backward', () => {
      const pawn: Piece = {
        id: 'red-pawn',
        type: PieceType.PAWN,
        color: PlayerColor.RED,
        position: { x: 0, y: 4 },
        isAlive: true
      };
      
      board.setPiece(pawn.position, pawn);
      
      const move: Move = {
        from: { x: 0, y: 4 },
        to: { x: 0, y: 5 }, // Backward
        piece: pawn,
        timestamp: Date.now()
      };
      
      const result = validator.validateMove(move, gameState);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('后退');
    });
  });

  describe('Basic Move Validation', () => {
    it('should reject moves to invalid positions', () => {
      const piece: Piece = {
        id: 'test-piece',
        type: PieceType.PAWN,
        color: PlayerColor.RED,
        position: { x: 0, y: 0 },
        isAlive: true
      };
      
      board.setPiece(piece.position, piece);
      
      const move: Move = {
        from: { x: 0, y: 0 },
        to: { x: -1, y: 0 }, // Invalid position
        piece,
        timestamp: Date.now()
      };
      
      const result = validator.validateMove(move, gameState);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('超出棋盘范围');
    });

    it('should reject moves to same position', () => {
      const piece: Piece = {
        id: 'test-piece',
        type: PieceType.PAWN,
        color: PlayerColor.RED,
        position: { x: 0, y: 0 },
        isAlive: true
      };
      
      board.setPiece(piece.position, piece);
      
      const move: Move = {
        from: { x: 0, y: 0 },
        to: { x: 0, y: 0 }, // Same position
        piece,
        timestamp: Date.now()
      };
      
      const result = validator.validateMove(move, gameState);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('相同');
    });

    it('should reject moves to positions occupied by own pieces', () => {
      const piece1: Piece = {
        id: 'piece1',
        type: PieceType.PAWN,
        color: PlayerColor.RED,
        position: { x: 0, y: 0 },
        isAlive: true
      };
      
      const piece2: Piece = {
        id: 'piece2',
        type: PieceType.PAWN,
        color: PlayerColor.RED,
        position: { x: 0, y: 1 },
        isAlive: true
      };
      
      board.setPiece(piece1.position, piece1);
      board.setPiece(piece2.position, piece2);
      
      const move: Move = {
        from: { x: 0, y: 0 },
        to: { x: 0, y: 1 }, // Occupied by own piece
        piece: piece1,
        timestamp: Date.now()
      };
      
      const result = validator.validateMove(move, gameState);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('己方棋子');
    });
  });

  describe('Valid Moves Generation', () => {
    it('should generate correct valid moves for a piece', () => {
      const king: Piece = {
        id: 'red-king',
        type: PieceType.KING,
        color: PlayerColor.RED,
        position: { x: 4, y: 8 },
        isAlive: true
      };
      
      board.setPiece(king.position, king);
      
      const validMoves = validator.getValidMoves(king, gameState);
      
      // King at (4,8) should be able to move to (3,8), (5,8), (4,7), (4,9)
      expect(validMoves.length).toBeGreaterThan(0);
      expect(validMoves.some(move => move.x === 3 && move.y === 8)).toBe(true);
      expect(validMoves.some(move => move.x === 5 && move.y === 8)).toBe(true);
      expect(validMoves.some(move => move.x === 4 && move.y === 7)).toBe(true);
      expect(validMoves.some(move => move.x === 4 && move.y === 9)).toBe(true);
    });

    it('should not include invalid moves in valid moves list', () => {
      const king: Piece = {
        id: 'red-king',
        type: PieceType.KING,
        color: PlayerColor.RED,
        position: { x: 4, y: 8 },
        isAlive: true
      };
      
      board.setPiece(king.position, king);
      
      const validMoves = validator.getValidMoves(king, gameState);
      
      // King should not be able to move outside palace
      expect(validMoves.some(move => move.x === 2 && move.y === 8)).toBe(false);
      expect(validMoves.some(move => move.x === 6 && move.y === 8)).toBe(false);
    });
  });
});