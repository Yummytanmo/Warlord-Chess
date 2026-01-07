import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { GameManager } from '@/lib/gameManager';
import { 
  GameState, 
  PlayerColor, 
  PieceType,
  GamePhase,
  Move,
  Position,
  Piece
} from '@/types/game';

/**
 * Feature: sanguo-xiangqi, Property 1: 回合制移动规则
 * 验证: 需求 1.3
 * 
 * 属性 1: 回合制移动规则
 * 对于任何游戏状态，只有当前回合的玩家才能移动己方棋子，移动后回合应该切换到对方玩家
 */

// 生成器：创建有效的棋盘位置
const positionGenerator = fc.record({
  x: fc.integer({ min: 0, max: 8 }),
  y: fc.integer({ min: 0, max: 9 })
});

// 辅助函数：创建基础游戏状态
const createTestGameState = (currentPlayer: PlayerColor): GameState => {
  const gameManager = new GameManager();
  const gameState = gameManager.createNewGame();
  gameState.currentPlayer = currentPlayer;
  gameState.gamePhase = GamePhase.PLAYING;
  return gameState;
};

describe('Turn-Based Movement Rules Properties', () => {
  let gameManager: GameManager;

  beforeEach(() => {
    gameManager = new GameManager();
  });

  it('Property 1: Turn-based rules - only current player can move their pieces', () => {
    fc.assert(fc.property(
      fc.constantFrom(...Object.values(PlayerColor)),
      fc.constantFrom(...Object.values(PlayerColor)),
      positionGenerator,
      positionGenerator,
      (currentPlayer, pieceColor, from, to) => {
        // 创建游戏状态
        const gameState = createTestGameState(currentPlayer);
        
        // 创建测试棋子
        const testPiece: Piece = {
          id: 'test-piece',
          type: PieceType.PAWN,
          color: pieceColor,
          position: from,
          isAlive: true
        };

        // 将棋子放置到棋盘上
        gameState.board.setPiece(from, testPiece);

        // 创建移动
        const move: Move = {
          from,
          to,
          piece: testPiece,
          timestamp: Date.now()
        };

        // 尝试执行移动
        const result = gameManager.executeMove(gameState, move);

        if (pieceColor === currentPlayer) {
          // 如果是当前玩家的棋子，移动可能成功（取决于移动是否合法）
          // 但不应该因为回合问题而失败
          if (!result.success && result.error) {
            expect(result.error.message).not.toContain('不是当前玩家的回合');
          }
        } else {
          // 如果不是当前玩家的棋子，移动应该失败
          expect(result.success).toBe(false);
          expect(result.error?.message).toContain('不是当前玩家的回合');
        }
      }
    ), { numRuns: 100 });
  });

  it('Property 1: Turn-based rules - turn switches after successful move', () => {
    fc.assert(fc.property(
      fc.constantFrom(...Object.values(PlayerColor)),
      (initialPlayer) => {
        // 创建游戏状态
        const gameState = createTestGameState(initialPlayer);
        
        // 获取当前玩家的一个棋子（兵，因为移动规则相对简单）
        const currentPlayerPieces = gameState.players.find(p => p.color === initialPlayer)?.pieces || [];
        const pawn = currentPlayerPieces.find(p => p.type === PieceType.PAWN);
        
        if (!pawn) return; // 如果没有兵，跳过这个测试
        
        // 计算一个简单的合法移动（向前一步）
        const direction = initialPlayer === PlayerColor.RED ? -1 : 1;
        const newPosition: Position = {
          x: pawn.position.x,
          y: pawn.position.y + direction
        };
        
        // 确保目标位置在棋盘范围内
        if (!gameState.board.isValidPosition(newPosition)) return;
        
        // 确保目标位置没有棋子
        if (gameState.board.getPiece(newPosition)) return;

        // 创建移动
        const move: Move = {
          from: pawn.position,
          to: newPosition,
          piece: pawn,
          timestamp: Date.now()
        };

        // 执行移动
        const result = gameManager.executeMove(gameState, move);

        if (result.success && result.newGameState) {
          // 验证回合已切换
          const expectedNextPlayer = initialPlayer === PlayerColor.RED ? PlayerColor.BLACK : PlayerColor.RED;
          expect(result.newGameState.currentPlayer).toBe(expectedNextPlayer);
          
          // 验证移动历史已更新
          expect(result.newGameState.moveHistory.length).toBe(gameState.moveHistory.length + 1);
          expect(result.newGameState.moveHistory[result.newGameState.moveHistory.length - 1]).toEqual(move);
        }
      }
    ), { numRuns: 50 }); // 减少运行次数，因为这个测试更复杂
  });

  it('Property 1: Turn-based rules - game phase validation', () => {
    fc.assert(fc.property(
      fc.constantFrom(...Object.values(GamePhase)),
      fc.constantFrom(...Object.values(PlayerColor)),
      (gamePhase, playerColor) => {
        // 创建游戏状态
        const gameState = createTestGameState(playerColor);
        gameState.gamePhase = gamePhase;
        
        // 创建一个简单的移动
        const testPiece: Piece = {
          id: 'test-piece',
          type: PieceType.PAWN,
          color: playerColor,
          position: { x: 4, y: 6 },
          isAlive: true
        };

        const move: Move = {
          from: { x: 4, y: 6 },
          to: { x: 4, y: 5 },
          piece: testPiece,
          timestamp: Date.now()
        };

        // 尝试执行移动
        const result = gameManager.executeMove(gameState, move);

        if (gamePhase === GamePhase.PLAYING) {
          // 在游戏进行阶段，移动可能成功（取决于其他因素）
          if (!result.success && result.error) {
            expect(result.error.message).not.toContain('游戏未在进行中');
          }
        } else {
          // 在非游戏进行阶段，移动应该失败
          expect(result.success).toBe(false);
          if (result.error) {
            expect(result.error.message).toContain('游戏未在进行中');
          }
        }
      }
    ), { numRuns: 100 });
  });

  it('Property 1: Turn-based rules - move history consistency', () => {
    fc.assert(fc.property(
      fc.constantFrom(...Object.values(PlayerColor)),
      fc.array(fc.record({
        from: positionGenerator,
        to: positionGenerator,
        timestamp: fc.integer({ min: 0 })
      }), { minLength: 0, maxLength: 5 }),
      (initialPlayer, moveData) => {
        // 创建游戏状态
        const gameState = createTestGameState(initialPlayer);
        const initialHistoryLength = gameState.moveHistory.length;
        
        let currentPlayer = initialPlayer;
        let successfulMoves = 0;
        
        // 尝试执行一系列移动
        for (const data of moveData) {
          // 创建当前玩家的棋子
          const testPiece: Piece = {
            id: `piece-${successfulMoves}`,
            type: PieceType.PAWN,
            color: currentPlayer,
            position: data.from,
            isAlive: true
          };

          // 确保起始位置有效且没有其他棋子
          if (!gameState.board.isValidPosition(data.from) || 
              !gameState.board.isValidPosition(data.to) ||
              gameState.board.getPiece(data.from)) {
            continue;
          }

          // 将棋子放置到棋盘上
          gameState.board.setPiece(data.from, testPiece);

          const move: Move = {
            from: data.from,
            to: data.to,
            piece: testPiece,
            timestamp: data.timestamp
          };

          const result = gameManager.executeMove(gameState, move);
          
          if (result.success && result.newGameState) {
            // 更新游戏状态
            Object.assign(gameState, result.newGameState);
            successfulMoves++;
            
            // 切换玩家
            currentPlayer = currentPlayer === PlayerColor.RED ? PlayerColor.BLACK : PlayerColor.RED;
            
            // 验证移动历史长度正确
            expect(gameState.moveHistory.length).toBe(initialHistoryLength + successfulMoves);
            
            // 验证最后一个移动记录正确
            const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
            expect(lastMove.from).toEqual(data.from);
            expect(lastMove.to).toEqual(data.to);
            expect(lastMove.piece.color).toBe(move.piece.color);
          }
        }
        
        // 验证最终的移动历史长度
        expect(gameState.moveHistory.length).toBe(initialHistoryLength + successfulMoves);
      }
    ), { numRuns: 50 });
  });

  it('Property 1: Turn-based rules - player alternation consistency', () => {
    fc.assert(fc.property(
      fc.constantFrom(...Object.values(PlayerColor)),
      fc.integer({ min: 1, max: 10 }),
      (startingPlayer, moveCount) => {
        // 创建游戏状态
        const gameState = createTestGameState(startingPlayer);
        
        let currentPlayer = startingPlayer;
        let actualMoves = 0;
        
        // 模拟一系列成功的移动
        for (let i = 0; i < moveCount; i++) {
          // 创建一个简单的合法移动
          const fromPos: Position = { x: 4, y: currentPlayer === PlayerColor.RED ? 6 : 3 };
          const toPos: Position = { x: 4, y: currentPlayer === PlayerColor.RED ? 5 : 4 };
          
          // 跳过如果位置无效
          if (!gameState.board.isValidPosition(fromPos) || !gameState.board.isValidPosition(toPos)) {
            continue;
          }
          
          // 创建测试棋子
          const testPiece: Piece = {
            id: `piece-${i}`,
            type: PieceType.PAWN,
            color: currentPlayer,
            position: fromPos,
            isAlive: true
          };

          // 清理目标位置并放置棋子
          gameState.board.setPiece(toPos, null);
          gameState.board.setPiece(fromPos, testPiece);

          const move: Move = {
            from: fromPos,
            to: toPos,
            piece: testPiece,
            timestamp: Date.now() + i
          };

          const result = gameManager.executeMove(gameState, move);
          
          if (result.success && result.newGameState) {
            // 更新游戏状态
            Object.assign(gameState, result.newGameState);
            actualMoves++;
            
            // 验证回合已切换
            const expectedNextPlayer = currentPlayer === PlayerColor.RED ? PlayerColor.BLACK : PlayerColor.RED;
            expect(gameState.currentPlayer).toBe(expectedNextPlayer);
            
            // 更新当前玩家
            currentPlayer = expectedNextPlayer;
          }
        }
        
        // 验证最终状态
        if (actualMoves > 0) {
          // 如果有成功的移动，验证最终玩家是正确的
          const expectedFinalPlayer = actualMoves % 2 === 0 ? startingPlayer : 
            (startingPlayer === PlayerColor.RED ? PlayerColor.BLACK : PlayerColor.RED);
          expect(gameState.currentPlayer).toBe(expectedFinalPlayer);
        }
      }
    ), { numRuns: 50 });
  });
});