import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ChessBoard } from '@/lib/board';
import { 
  Piece, 
  PlayerColor, 
  PieceType 
} from '@/types/game';

/**
 * Feature: sanguo-xiangqi, Property 2: 移动合法性验证
 * 验证: 需求 1.4
 * 
 * 属性 2: 移动合法性验证
 * 对于任何棋子移动请求，系统必须验证移动的合法性
 * （包括基础象棋规则和武将技能修改），只有合法移动才能被执行
 */

// 生成器：创建有效的棋盘位置
const validPositionGenerator = fc.record({
  x: fc.integer({ min: 0, max: 8 }),
  y: fc.integer({ min: 0, max: 9 })
});

// 生成器：创建无效的棋盘位置
const invalidPositionGenerator = fc.oneof(
  fc.record({
    x: fc.integer({ min: -10, max: -1 }),
    y: fc.integer({ min: 0, max: 9 })
  }),
  fc.record({
    x: fc.integer({ min: 9, max: 20 }),
    y: fc.integer({ min: 0, max: 9 })
  }),
  fc.record({
    x: fc.integer({ min: 0, max: 8 }),
    y: fc.integer({ min: -10, max: -1 })
  }),
  fc.record({
    x: fc.integer({ min: 0, max: 8 }),
    y: fc.integer({ min: 10, max: 20 })
  })
);

// 生成器：创建棋子
const pieceGenerator = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }),
  type: fc.constantFrom(...Object.values(PieceType)),
  color: fc.constantFrom(...Object.values(PlayerColor)),
  position: validPositionGenerator,
  isAlive: fc.constant(true)
});

describe('Move Validation Properties', () => {
  it('Property 2: Move validation - valid positions only', () => {
    fc.assert(fc.property(
      validPositionGenerator,
      (position) => {
        const board = new ChessBoard();
        
        // 验证有效位置应该被接受
        expect(board.isValidPosition(position)).toBe(true);
        
        // 验证可以在有效位置放置和获取棋子
        const testPiece: Piece = {
          id: 'test-piece',
          type: PieceType.PAWN,
          color: PlayerColor.RED,
          position: position,
          isAlive: true
        };
        
        board.setPiece(position, testPiece);
        const retrievedPiece = board.getPiece(position);
        
        expect(retrievedPiece).toEqual(testPiece);
        expect(retrievedPiece?.position).toEqual(position);
      }
    ), { numRuns: 100 });
  });

  it('Property 2: Move validation - invalid positions rejected', () => {
    fc.assert(fc.property(
      invalidPositionGenerator,
      (position) => {
        const board = new ChessBoard();
        
        // 验证无效位置应该被拒绝
        expect(board.isValidPosition(position)).toBe(false);
        
        // 验证无法在无效位置放置棋子
        const testPiece: Piece = {
          id: 'test-piece',
          type: PieceType.PAWN,
          color: PlayerColor.RED,
          position: position,
          isAlive: true
        };
        
        board.setPiece(position, testPiece);
        const retrievedPiece = board.getPiece(position);
        
        // 在无效位置放置棋子应该失败，返回null
        expect(retrievedPiece).toBeNull();
      }
    ), { numRuns: 100 });
  });

  it('Property 2: Move validation - palace boundaries', () => {
    fc.assert(fc.property(
      validPositionGenerator,
      fc.constantFrom(...Object.values(PlayerColor)),
      (position, color) => {
        const board = new ChessBoard();
        
        const isInPalace = board.isInPalace(position, color);
        
        if (color === PlayerColor.RED) {
          // 红方九宫：x: 3-5, y: 7-9
          const expectedInPalace = 
            position.x >= 3 && position.x <= 5 && 
            position.y >= 7 && position.y <= 9;
          expect(isInPalace).toBe(expectedInPalace);
        } else {
          // 黑方九宫：x: 3-5, y: 0-2
          const expectedInPalace = 
            position.x >= 3 && position.x <= 5 && 
            position.y >= 0 && position.y <= 2;
          expect(isInPalace).toBe(expectedInPalace);
        }
      }
    ), { numRuns: 100 });
  });

  it('Property 2: Move validation - river crossing detection', () => {
    fc.assert(fc.property(
      validPositionGenerator,
      fc.constantFrom(...Object.values(PlayerColor)),
      (position, color) => {
        const board = new ChessBoard();
        
        const hasCrossedRiver = board.hasRiverCrossed(position, color);
        
        if (color === PlayerColor.RED) {
          // 红方过河：y < 5
          const expectedCrossed = position.y < 5;
          expect(hasCrossedRiver).toBe(expectedCrossed);
        } else {
          // 黑方过河：y > 4
          const expectedCrossed = position.y > 4;
          expect(hasCrossedRiver).toBe(expectedCrossed);
        }
      }
    ), { numRuns: 100 });
  });

  it('Property 2: Move validation - piece placement and retrieval consistency', () => {
    fc.assert(fc.property(
      fc.array(pieceGenerator, { minLength: 1, maxLength: 10 }),
      (pieces) => {
        const board = new ChessBoard();
        
        // 在不同位置放置棋子
        const placedPieces: Piece[] = [];
        for (const piece of pieces) {
          // 确保位置不重复
          if (!board.getPiece(piece.position)) {
            board.setPiece(piece.position, piece);
            placedPieces.push(piece);
          }
        }
        
        // 验证所有放置的棋子都能正确获取
        for (const piece of placedPieces) {
          const retrievedPiece = board.getPiece(piece.position);
          expect(retrievedPiece).toEqual(piece);
        }
        
        // 验证getAllPieces返回所有活着的棋子
        const allPieces = board.getAllPieces();
        expect(allPieces.length).toBe(placedPieces.length);
        
        // 验证每个返回的棋子都在放置的棋子列表中
        for (const retrievedPiece of allPieces) {
          expect(placedPieces.some(p => p.id === retrievedPiece.id)).toBe(true);
        }
      }
    ), { numRuns: 100 });
  });

  it('Property 2: Move validation - path blocking detection', () => {
    fc.assert(fc.property(
      validPositionGenerator,
      validPositionGenerator,
      (from, to) => {
        const board = new ChessBoard();
        
        // 只测试直线移动
        if (from.x !== to.x && from.y !== to.y) {
          // 不是直线移动，应该被认为是阻挡的
          expect(board.isPathBlocked(from, to)).toBe(true);
          return;
        }
        
        // 如果是同一个位置，不应该被阻挡
        if (from.x === to.x && from.y === to.y) {
          expect(board.isPathBlocked(from, to)).toBe(false);
          return;
        }
        
        // 测试空路径（没有阻挡）
        expect(board.isPathBlocked(from, to)).toBe(false);
        
        // 在路径中间放置一个棋子
        const midX = Math.floor((from.x + to.x) / 2);
        const midY = Math.floor((from.y + to.y) / 2);
        
        // 只有当中间位置不是起点或终点时才放置棋子
        if ((midX !== from.x || midY !== from.y) && (midX !== to.x || midY !== to.y)) {
          const blockingPiece: Piece = {
            id: 'blocking-piece',
            type: PieceType.PAWN,
            color: PlayerColor.RED,
            position: { x: midX, y: midY },
            isAlive: true
          };
          
          board.setPiece({ x: midX, y: midY }, blockingPiece);
          
          // 现在路径应该被阻挡
          expect(board.isPathBlocked(from, to)).toBe(true);
        }
      }
    ), { numRuns: 100 });
  });

  it('Property 2: Move validation - distance calculation', () => {
    fc.assert(fc.property(
      validPositionGenerator,
      validPositionGenerator,
      (pos1, pos2) => {
        const board = new ChessBoard();
        
        const distance = board.getDistance(pos1, pos2);
        const expectedDistance = Math.abs(pos2.x - pos1.x) + Math.abs(pos2.y - pos1.y);
        
        expect(distance).toBe(expectedDistance);
        expect(distance).toBeGreaterThanOrEqual(0);
        
        // 距离应该是对称的
        expect(board.getDistance(pos2, pos1)).toBe(distance);
      }
    ), { numRuns: 100 });
  });

  it('Property 2: Move validation - same line detection', () => {
    fc.assert(fc.property(
      validPositionGenerator,
      validPositionGenerator,
      (pos1, pos2) => {
        const board = new ChessBoard();
        
        const isOnSameLine = board.isOnSameLine(pos1, pos2);
        const expectedOnSameLine = pos1.x === pos2.x || pos1.y === pos2.y;
        
        expect(isOnSameLine).toBe(expectedOnSameLine);
        
        // 同线检测应该是对称的
        expect(board.isOnSameLine(pos2, pos1)).toBe(isOnSameLine);
      }
    ), { numRuns: 100 });
  });

  it('Property 2: Move validation - board cloning preserves state', () => {
    fc.assert(fc.property(
      fc.array(pieceGenerator, { minLength: 0, maxLength: 5 }),
      (pieces) => {
        const originalBoard = new ChessBoard();
        
        // 在原始棋盘上放置棋子
        for (const piece of pieces) {
          if (!originalBoard.getPiece(piece.position)) {
            originalBoard.setPiece(piece.position, piece);
          }
        }
        
        // 克隆棋盘
        const clonedBoard = originalBoard.clone();
        
        // 验证克隆的棋盘与原始棋盘状态相同
        for (let y = 0; y < 10; y++) {
          for (let x = 0; x < 9; x++) {
            const pos = { x, y };
            const originalPiece = originalBoard.getPiece(pos);
            const clonedPiece = clonedBoard.getPiece(pos);
            
            if (originalPiece) {
              expect(clonedPiece).toEqual(originalPiece);
            } else {
              expect(clonedPiece).toBeNull();
            }
          }
        }
        
        // 验证修改克隆的棋盘不会影响原始棋盘
        const testPiece: Piece = {
          id: 'test-modification',
          type: PieceType.KING,
          color: PlayerColor.BLACK,
          position: { x: 0, y: 0 },
          isAlive: true
        };
        
        clonedBoard.setPiece({ x: 0, y: 0 }, testPiece);
        
        // 原始棋盘不应该受到影响
        const originalPieceAtPos = originalBoard.getPiece({ x: 0, y: 0 });
        if (pieces.some(p => p.position.x === 0 && p.position.y === 0)) {
          // 如果原来就有棋子，应该保持不变
          expect(originalPieceAtPos).not.toEqual(testPiece);
        } else {
          // 如果原来没有棋子，应该仍然为null
          expect(originalPieceAtPos).toBeNull();
        }
      }
    ), { numRuns: 100 });
  });
});