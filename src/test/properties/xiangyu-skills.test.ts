import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ChessMoveValidator } from '@/lib/moveValidator';
import { ChessBoard } from '@/lib/board';
import { 
  Move, 
  Piece, 
  PieceType, 
  PlayerColor, 
  GameState, 
  GamePhase 
} from '@/types/game';
import { createDefaultRuleContext } from '@/types/rules';
import { GameManager } from '@/lib/gameManager';

describe('Xiangyu Skills Properties', () => {
  let moveValidator: ChessMoveValidator;
  let board: ChessBoard;
  let ruleContext: ReturnType<typeof createDefaultRuleContext>;
  let gameState: GameState;

  beforeEach(() => {
    moveValidator = new ChessMoveValidator();
    board = new ChessBoard();
    ruleContext = createDefaultRuleContext();
    // Setup dummy game state
    gameState = {
      board,
      players: [] as any,
      currentPlayer: PlayerColor.RED,
      gamePhase: GamePhase.PLAYING,
      moveHistory: []
    };
  });

  it('Property: Pawn can cross river directly (Bei Shui)', () => {
    // Red Pawn at y=6 (standard) should be able to move to y=4 (cross river line y=5)
    // if canCrossRiverDirectly is true.
    ruleContext.moveRules.pawn.canCrossRiverDirectly = true;

    const pawn: Piece = {
      id: 'pawn',
      type: PieceType.PAWN,
      color: PlayerColor.RED,
      position: { x: 4, y: 6 },
      isAlive: true
    };
    board.setPiece(pawn.position, pawn);

    const move: Move = {
      from: pawn.position,
      to: { x: 4, y: 4 }, // Cross 2 steps
      piece: pawn,
      timestamp: Date.now()
    };

    const result = moveValidator.validateMove(move, gameState, ruleContext);
    expect(result.isValid).toBe(true);
  });

  it('Property: Pawn after river can move 2 steps horizontally (Bei Shui)', () => {
    ruleContext.moveRules.pawn.canMoveTwoStepsAfterRiver = true;

    const pawn: Piece = {
      id: 'pawn',
      type: PieceType.PAWN,
      color: PlayerColor.RED,
      position: { x: 4, y: 0 }, // Deep in enemy territory
      isAlive: true
    };
    board.setPiece(pawn.position, pawn);

    // Move 2 steps horizontally
    const move: Move = {
      from: pawn.position,
      to: { x: 6, y: 0 },
      piece: pawn,
      timestamp: Date.now()
    };

    const result = moveValidator.validateMove(move, gameState, ruleContext);
    expect(result.isValid).toBe(true);
  });

  it('Property: Horse ignores leg block (Ba Wang)', () => {
    ruleContext.moveRules.horse.ignoreLegBlock = true;

    const horse: Piece = {
      id: 'horse',
      type: PieceType.HORSE,
      color: PlayerColor.RED,
      position: { x: 4, y: 4 },
      isAlive: true
    };
    board.setPiece(horse.position, horse);

    // Block leg at (4,3) for move to (5,2)
    const blocker: Piece = {
      id: 'blocker',
      type: PieceType.PAWN,
      color: PlayerColor.RED,
      position: { x: 4, y: 3 },
      isAlive: true
    };
    board.setPiece(blocker.position, blocker);

    const move: Move = {
      from: horse.position,
      to: { x: 5, y: 2 },
      piece: horse,
      timestamp: Date.now()
    };

    const result = moveValidator.validateMove(move, gameState, ruleContext);
    expect(result.isValid).toBe(true);
  });

  it('Property: Horse cannot jump consecutively (Ba Wang)', () => {
    ruleContext.moveRules.horse.limitConsecutiveJumps = true;
    
    // Simulate history where last move was this horse jumping
    const horse: Piece = {
      id: 'horse',
      type: PieceType.HORSE,
      color: PlayerColor.RED,
      position: { x: 4, y: 4 },
      isAlive: true
    };
    board.setPiece(horse.position, horse);

    const lastMove: Move = {
      from: { x: 2, y: 3 },
      to: { x: 4, y: 4 },
      piece: horse,
      timestamp: Date.now()
    };
    gameState.moveHistory.push(lastMove);

    const move: Move = {
      from: horse.position,
      to: { x: 5, y: 2 },
      piece: horse,
      timestamp: Date.now()
    };

    const result = moveValidator.validateMove(move, gameState, ruleContext);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('不能连续两步都跳马');
  });
});
