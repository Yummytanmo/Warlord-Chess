import { describe, it, expect, beforeEach } from 'vitest';
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

describe('Liubang Skills Properties', () => {
  let moveValidator: ChessMoveValidator;
  let board: ChessBoard;
  let ruleContext: ReturnType<typeof createDefaultRuleContext>;
  let gameState: GameState;

  beforeEach(() => {
    moveValidator = new ChessMoveValidator();
    board = new ChessBoard();
    ruleContext = createDefaultRuleContext();
    gameState = {
      board,
      players: [] as any,
      currentPlayer: PlayerColor.RED,
      gamePhase: GamePhase.PLAYING,
      moveHistory: []
    };
  });

  it('Property: King can move outside Palace (Geng Yi)', () => {
    ruleContext.moveRules.king.canLeavePalace = true;

    const king: Piece = {
      id: 'king',
      type: PieceType.KING,
      color: PlayerColor.RED,
      position: { x: 3, y: 7 }, // Edge of palace
      isAlive: true
    };
    board.setPiece(king.position, king);

    // Move out to (2,7)
    const move: Move = {
      from: king.position,
      to: { x: 2, y: 7 },
      piece: king,
      timestamp: Date.now()
    };

    const result = moveValidator.validateMove(move, gameState, ruleContext);
    expect(result.isValid).toBe(true);
  });

  it('Property: Advisor can move outside Palace but not cross river (Hong Men)', () => {
    ruleContext.moveRules.advisor.canLeavePalace = true;

    const advisor: Piece = {
      id: 'advisor',
      type: PieceType.ADVISOR,
      color: PlayerColor.RED,
      position: { x: 3, y: 7 }, // Edge
      isAlive: true
    };
    board.setPiece(advisor.position, advisor);

    // Move out to (2,6) - Valid diagonal
    const moveOut: Move = {
      from: advisor.position,
      to: { x: 2, y: 6 },
      piece: advisor,
      timestamp: Date.now()
    };

    const resultOut = moveValidator.validateMove(moveOut, gameState, ruleContext);
    expect(resultOut.isValid).toBe(true);

    // Move to cross river (y=4 is across for Red)
    // Advisor at (4,5) trying to go to (3,4)
    advisor.position = { x: 4, y: 5 };
    board.setPiece(advisor.position, advisor);
    const moveCross: Move = {
      from: advisor.position,
      to: { x: 3, y: 4 },
      piece: advisor,
      timestamp: Date.now()
    };

    const resultCross = moveValidator.validateMove(moveCross, gameState, ruleContext);
    expect(resultCross.isValid).toBe(false);
    expect(resultCross.reason).toContain('不能过河');
  });

  it('Property: Elephant ignores heart block (Hong Men)', () => {
    ruleContext.moveRules.elephant.ignoreHeartBlock = true;

    const elephant: Piece = {
      id: 'elephant',
      type: PieceType.ELEPHANT,
      color: PlayerColor.RED,
      position: { x: 2, y: 9 },
      isAlive: true
    };
    board.setPiece(elephant.position, elephant);

    // Block heart at (3,8)
    const blocker: Piece = {
      id: 'blocker',
      type: PieceType.PAWN,
      color: PlayerColor.RED,
      position: { x: 3, y: 8 },
      isAlive: true
    };
    board.setPiece(blocker.position, blocker);

    // Try to move to (4,7)
    const move: Move = {
      from: elephant.position,
      to: { x: 4, y: 7 },
      piece: elephant,
      timestamp: Date.now()
    };

    const result = moveValidator.validateMove(move, gameState, ruleContext);
    expect(result.isValid).toBe(true);
  });
});
