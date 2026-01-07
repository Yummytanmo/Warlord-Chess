import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { useGameStore } from '@/store/gameStore';
import { 
  GameState, 
  Piece, 
  Position, 
  PlayerColor, 
  PieceType,
  GamePhase 
} from '@/types/game';

/**
 * Feature: sanguo-xiangqi, Property 16: UI状态同步
 * 验证: 需求 10.2, 10.3, 10.4, 10.5
 * 
 * 属性 16: UI状态同步
 * 对于任何游戏状态变化，用户界面必须实时反映当前状态
 * （可移动棋子高亮、可用技能显示、棋子位置更新）
 */

// 生成器：创建有效的棋盘位置
const positionGenerator = fc.record({
  x: fc.integer({ min: 0, max: 8 }),
  y: fc.integer({ min: 0, max: 9 })
});

// 生成器：创建棋子
const pieceGenerator = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }),
  type: fc.constantFrom(...Object.values(PieceType)),
  color: fc.constantFrom(...Object.values(PlayerColor)),
  position: positionGenerator,
  isAlive: fc.boolean()
});

// 生成器：创建游戏状态
const gameStateGenerator = fc.record({
  currentPlayer: fc.constantFrom(...Object.values(PlayerColor)),
  gamePhase: fc.constantFrom(...Object.values(GamePhase)),
  moveHistory: fc.array(fc.record({
    from: positionGenerator,
    to: positionGenerator,
    piece: pieceGenerator,
    timestamp: fc.integer({ min: 0 })
  }), { maxLength: 10 })
});

describe('UI State Synchronization Properties', () => {
  beforeEach(() => {
    // 重置store状态
    useGameStore.getState().initializeGame();
  });

  it('Property 16: UI state synchronization - selected piece state consistency', () => {
    fc.assert(fc.property(
      pieceGenerator,
      (piece) => {
        const store = useGameStore.getState();
        
        // 选择棋子
        store.selectPiece(piece);
        
        // 验证UI状态与选择的棋子一致
        const currentState = useGameStore.getState();
        
        if (piece.color === currentState.gameState?.currentPlayer) {
          // 如果是当前玩家的棋子，应该被选中
          expect(currentState.selectedPiece).toEqual(piece);
        } else {
          // 如果不是当前玩家的棋子，不应该被选中
          expect(currentState.selectedPiece).toBeNull();
        }
      }
    ), { numRuns: 100 });
  });

  it('Property 16: UI state synchronization - valid moves calculation', () => {
    fc.assert(fc.property(
      pieceGenerator,
      (piece) => {
        const store = useGameStore.getState();
        
        // 选择棋子
        store.selectPiece(piece);
        
        const currentState = useGameStore.getState();
        
        // 验证有效移动位置的计算
        if (currentState.selectedPiece) {
          // 如果有选中的棋子，应该有对应的有效移动位置数组
          expect(Array.isArray(currentState.validMoves)).toBe(true);
          
          // 所有有效移动位置都应该是有效的棋盘位置
          currentState.validMoves.forEach(move => {
            expect(move.x).toBeGreaterThanOrEqual(0);
            expect(move.x).toBeLessThanOrEqual(8);
            expect(move.y).toBeGreaterThanOrEqual(0);
            expect(move.y).toBeLessThanOrEqual(9);
          });
        } else {
          // 如果没有选中的棋子，有效移动位置应该为空
          expect(currentState.validMoves).toEqual([]);
        }
      }
    ), { numRuns: 100 });
  });

  it('Property 16: UI state synchronization - game state updates', () => {
    fc.assert(fc.property(
      gameStateGenerator,
      (partialGameState) => {
        const store = useGameStore.getState();
        
        // 创建完整的游戏状态
        const fullGameState: GameState = {
          board: {
            grid: Array(10).fill(null).map(() => Array(9).fill(null)),
            BOARD_SIZE: { width: 9, height: 10 },
            getPiece: function(position: Position) {
              if (!this.isValidPosition(position)) return null;
              return this.grid[position.y][position.x];
            },
            setPiece: function(position: Position, piece: Piece | null) {
              if (!this.isValidPosition(position)) return;
              this.grid[position.y][position.x] = piece;
            },
            isValidPosition: function(position: Position) {
              return position.x >= 0 && position.x < 9 && 
                     position.y >= 0 && position.y < 10;
            },
            isInPalace: function(position: Position, color: PlayerColor) {
              const palaceX = position.x >= 3 && position.x <= 5;
              if (color === PlayerColor.RED) {
                return palaceX && position.y >= 7 && position.y <= 9;
              } else {
                return palaceX && position.y >= 0 && position.y <= 2;
              }
            },
            hasRiverCrossed: function(position: Position, color: PlayerColor) {
              if (color === PlayerColor.RED) {
                return position.y < 5;
              } else {
                return position.y > 4;
              }
            }
          },
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
          ...partialGameState
        };
        
        // 更新游戏状态
        store.updateGameState(fullGameState);
        
        // 验证UI状态与游戏状态同步
        const currentState = useGameStore.getState();
        expect(currentState.gameState).toEqual(fullGameState);
        expect(currentState.gameState?.currentPlayer).toBe(partialGameState.currentPlayer);
        expect(currentState.gameState?.gamePhase).toBe(partialGameState.gamePhase);
      }
    ), { numRuns: 100 });
  });

  it('Property 16: UI state synchronization - piece selection clearing', () => {
    fc.assert(fc.property(
      pieceGenerator,
      (piece) => {
        const store = useGameStore.getState();
        
        // 先选择一个棋子
        store.selectPiece(piece);
        
        // 然后清除选择
        store.selectPiece(null);
        
        // 验证UI状态被正确清除
        const currentState = useGameStore.getState();
        expect(currentState.selectedPiece).toBeNull();
        expect(currentState.validMoves).toEqual([]);
      }
    ), { numRuns: 100 });
  });
});