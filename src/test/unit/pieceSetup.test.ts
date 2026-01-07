import { describe, it, expect, beforeEach } from 'vitest';
import { PieceSetup } from '@/lib/pieceSetup';
import { ChessBoard } from '@/lib/board';
import { PieceType, PlayerColor } from '@/types/game';

/**
 * 棋子摆放工具单元测试
 * 验证: 需求 1.4
 */

describe('PieceSetup', () => {
  let board: ChessBoard;

  beforeEach(() => {
    board = new ChessBoard();
  });

  describe('Standard Setup', () => {
    it('should create correct number of pieces for standard setup', () => {
      const pieces = PieceSetup.createStandardSetup();
      
      // 每方16个棋子，总共32个
      expect(pieces.length).toBe(32);
      
      const redPieces = pieces.filter(p => p.color === PlayerColor.RED);
      const blackPieces = pieces.filter(p => p.color === PlayerColor.BLACK);
      
      expect(redPieces.length).toBe(16);
      expect(blackPieces.length).toBe(16);
    });

    it('should place pieces in correct initial positions', () => {
      const pieces = PieceSetup.createStandardSetup();
      
      // 检查红方帅的位置
      const redKing = pieces.find(p => p.type === PieceType.KING && p.color === PlayerColor.RED);
      expect(redKing).toBeDefined();
      expect(redKing!.position).toEqual({ x: 4, y: 9 });
      
      // 检查黑方将的位置
      const blackKing = pieces.find(p => p.type === PieceType.KING && p.color === PlayerColor.BLACK);
      expect(blackKing).toBeDefined();
      expect(blackKing!.position).toEqual({ x: 4, y: 0 });
      
      // 检查红方兵的位置
      const redPawns = pieces.filter(p => p.type === PieceType.PAWN && p.color === PlayerColor.RED);
      expect(redPawns.length).toBe(5);
      expect(redPawns.every(p => p.position.y === 6)).toBe(true);
      
      // 检查黑方卒的位置
      const blackPawns = pieces.filter(p => p.type === PieceType.PAWN && p.color === PlayerColor.BLACK);
      expect(blackPawns.length).toBe(5);
      expect(blackPawns.every(p => p.position.y === 3)).toBe(true);
    });

    it('should create pieces with correct types and counts', () => {
      const pieces = PieceSetup.createStandardSetup();
      
      // 每方的棋子数量检查
      const redPieces = pieces.filter(p => p.color === PlayerColor.RED);
      const blackPieces = pieces.filter(p => p.color === PlayerColor.BLACK);
      
      // 检查每种棋子的数量
      const pieceTypeCounts = {
        [PieceType.KING]: 1,
        [PieceType.ADVISOR]: 2,
        [PieceType.ELEPHANT]: 2,
        [PieceType.HORSE]: 2,
        [PieceType.CHARIOT]: 2,
        [PieceType.CANNON]: 2,
        [PieceType.PAWN]: 5
      };
      
      Object.entries(pieceTypeCounts).forEach(([type, count]) => {
        const redCount = redPieces.filter(p => p.type === type).length;
        const blackCount = blackPieces.filter(p => p.type === type).length;
        
        expect(redCount).toBe(count);
        expect(blackCount).toBe(count);
      });
    });

    it('should create pieces with unique IDs', () => {
      const pieces = PieceSetup.createStandardSetup();
      const ids = pieces.map(p => p.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(pieces.length);
    });

    it('should create all pieces as alive', () => {
      const pieces = PieceSetup.createStandardSetup();
      
      expect(pieces.every(p => p.isAlive)).toBe(true);
    });
  });

  describe('Board Setup', () => {
    it('should place all pieces on the board correctly', () => {
      const pieces = PieceSetup.createStandardSetup();
      PieceSetup.setupBoard(board, pieces);
      
      // 检查所有棋子都被正确放置
      pieces.forEach(piece => {
        const boardPiece = board.getPiece(piece.position);
        expect(boardPiece).toEqual(piece);
      });
    });

    it('should clear board before setting up pieces', () => {
      // 先在棋盘上放置一个测试棋子
      const testPiece = {
        id: 'test',
        type: PieceType.PAWN,
        color: PlayerColor.RED,
        position: { x: 4, y: 4 },
        isAlive: true
      };
      board.setPiece(testPiece.position, testPiece);
      
      // 设置标准开局
      const pieces = PieceSetup.createStandardSetup();
      PieceSetup.setupBoard(board, pieces);
      
      // 测试棋子应该被清除
      expect(board.getPiece({ x: 4, y: 4 })).toBeNull();
    });

    it('should not place dead pieces on board', () => {
      const pieces = PieceSetup.createStandardSetup();
      
      // 将一个棋子标记为死亡
      pieces[0].isAlive = false;
      const deadPiece = pieces[0];
      
      PieceSetup.setupBoard(board, pieces);
      
      // 死亡的棋子不应该在棋盘上
      expect(board.getPiece(deadPiece.position)).toBeNull();
    });
  });

  describe('Piece Filtering', () => {
    it('should filter pieces by color correctly', () => {
      const pieces = PieceSetup.createStandardSetup();
      
      const redPieces = PieceSetup.getPiecesByColor(pieces, PlayerColor.RED);
      const blackPieces = PieceSetup.getPiecesByColor(pieces, PlayerColor.BLACK);
      
      expect(redPieces.length).toBe(16);
      expect(blackPieces.length).toBe(16);
      expect(redPieces.every(p => p.color === PlayerColor.RED)).toBe(true);
      expect(blackPieces.every(p => p.color === PlayerColor.BLACK)).toBe(true);
    });

    it('should only return alive pieces', () => {
      const pieces = PieceSetup.createStandardSetup();
      
      // 将一些棋子标记为死亡
      pieces[0].isAlive = false;
      pieces[1].isAlive = false;
      
      const redPieces = PieceSetup.getPiecesByColor(pieces, PlayerColor.RED);
      
      expect(redPieces.every(p => p.isAlive)).toBe(true);
      expect(redPieces.length).toBeLessThan(16);
    });
  });

  describe('Piece Finding', () => {
    it('should find specific piece by type and color', () => {
      const pieces = PieceSetup.createStandardSetup();
      
      const redKing = PieceSetup.findPiece(pieces, PieceType.KING, PlayerColor.RED);
      const blackKing = PieceSetup.findPiece(pieces, PieceType.KING, PlayerColor.BLACK);
      
      expect(redKing).toBeDefined();
      expect(blackKing).toBeDefined();
      expect(redKing!.type).toBe(PieceType.KING);
      expect(redKing!.color).toBe(PlayerColor.RED);
      expect(blackKing!.type).toBe(PieceType.KING);
      expect(blackKing!.color).toBe(PlayerColor.BLACK);
    });

    it('should return null when piece not found', () => {
      const pieces = PieceSetup.createTestSetup(); // Only has 4 pieces
      
      const advisor = PieceSetup.findPiece(pieces, PieceType.ADVISOR, PlayerColor.RED);
      
      expect(advisor).toBeNull();
    });

    it('should find king using findKing helper', () => {
      const pieces = PieceSetup.createStandardSetup();
      
      const redKing = PieceSetup.findKing(pieces, PlayerColor.RED);
      const blackKing = PieceSetup.findKing(pieces, PlayerColor.BLACK);
      
      expect(redKing).toBeDefined();
      expect(blackKing).toBeDefined();
      expect(redKing!.type).toBe(PieceType.KING);
      expect(blackKing!.type).toBe(PieceType.KING);
    });

    it('should not find dead pieces', () => {
      const pieces = PieceSetup.createStandardSetup();
      
      // 将红方帅标记为死亡
      const redKing = pieces.find(p => p.type === PieceType.KING && p.color === PlayerColor.RED);
      redKing!.isAlive = false;
      
      const foundKing = PieceSetup.findKing(pieces, PlayerColor.RED);
      
      expect(foundKing).toBeNull();
    });
  });

  describe('Test Setup', () => {
    it('should create minimal test setup', () => {
      const pieces = PieceSetup.createTestSetup();
      
      expect(pieces.length).toBe(4);
      
      // 应该有两个王和两个车
      const kings = pieces.filter(p => p.type === PieceType.KING);
      const chariots = pieces.filter(p => p.type === PieceType.CHARIOT);
      
      expect(kings.length).toBe(2);
      expect(chariots.length).toBe(2);
      
      // 每方一个王一个车
      const redPieces = pieces.filter(p => p.color === PlayerColor.RED);
      const blackPieces = pieces.filter(p => p.color === PlayerColor.BLACK);
      
      expect(redPieces.length).toBe(2);
      expect(blackPieces.length).toBe(2);
    });

    it('should place test pieces in correct positions', () => {
      const pieces = PieceSetup.createTestSetup();
      
      const redKing = pieces.find(p => p.type === PieceType.KING && p.color === PlayerColor.RED);
      const blackKing = pieces.find(p => p.type === PieceType.KING && p.color === PlayerColor.BLACK);
      
      expect(redKing!.position).toEqual({ x: 4, y: 9 });
      expect(blackKing!.position).toEqual({ x: 4, y: 0 });
    });
  });

  describe('Check Detection', () => {
    it('should return false for simplified check detection', () => {
      const pieces = PieceSetup.createStandardSetup();
      
      // 当前实现总是返回false（简化版本）
      const isRedInCheck = PieceSetup.isInCheck(pieces, PlayerColor.RED, board);
      const isBlackInCheck = PieceSetup.isInCheck(pieces, PlayerColor.BLACK, board);
      
      expect(isRedInCheck).toBe(false);
      expect(isBlackInCheck).toBe(false);
    });

    it('should return false when king is not found', () => {
      const pieces = PieceSetup.createTestSetup();
      
      // 移除红方王
      const redKingIndex = pieces.findIndex(p => p.type === PieceType.KING && p.color === PlayerColor.RED);
      pieces[redKingIndex].isAlive = false;
      
      const isRedInCheck = PieceSetup.isInCheck(pieces, PlayerColor.RED, board);
      
      expect(isRedInCheck).toBe(false);
    });
  });
});