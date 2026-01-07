import { describe, it, expect, beforeEach } from 'vitest';
import { ChessMoveValidator } from '@/lib/moveValidator';
import { ChessBoard } from '@/lib/board';
import { GameManager } from '@/lib/gameManager';
import { 
  Move, 
  Piece, 
  PieceType, 
  PlayerColor, 
  GameState, 
  GamePhase 
} from '@/types/game';
import { createDefaultRuleContext } from '@/types/rules';

describe('Xiaohe Skills Properties', () => {
  let gameManager: GameManager;
  let gameState: GameState;

  beforeEach(() => {
    gameManager = new GameManager();
    gameState = gameManager.createNewGame();
    gameState.gamePhase = GamePhase.PLAYING;
  });

  it('Property: Bai Ye - King must move twice', () => {
    // Setup: Xiaohe's turnState logic needs to be active.
    // Since we don't have the skill implementation injected yet, we simulate the state.
    // Assuming BaiYe sets turnState on King move.
    
    // For property test, we can verify that IF turnState is set, executeMove behaves correctly.
    
    const king = gameState.players[0].pieces.find(p => p.type === PieceType.KING);
    if (!king) return;
    
    // 1. Set turnState to force_move (Bai Ye)
    gameState.turnState = {
      phase: 'force_move',
      requiredPieceId: king.id, // Use actual ID
      remainingMoves: 1
    };
    
    // Valid move for King (Forward to (4,8) as (3,9) is blocked by Advisor)
    const move: Move = {
      from: king.position, // (4,9)
      to: { x: 4, y: 8 },
      piece: king,
      timestamp: Date.now()
    };
    
    // Execute move
    const result = gameManager.executeMove(gameState, move);
    
    expect(result.success).toBe(true);
    // Turn SHOULD switch because remainingMoves was 1, now 0
    expect(result.newGameState?.currentPlayer).toBe(PlayerColor.BLACK);
    // TurnState should be updated/cleared (since remaining was 1, now 0 -> cleared)
    expect(result.newGameState?.turnState).toBeUndefined();
    // NOW turn switches? No, logic says:
    // if remaining > 0 -> keep turn.
    // else -> turnState undefined.
    // But currentPlayer was switched by applyMove.
    // Wait, my implementation of T005:
    /*
      } else {
        // Turn sequence complete, clear state
        newGameState.turnState = undefined;
        // currentPlayer is already switched by applyMove, which is correct
      }
    */
    // So if remaining was 1, it becomes 0, turn ends.
    // If BaiYe requires 2 moves total:
    // Move 1 (Normal) -> Triggers Skill -> Sets TurnState (remaining=1).
    // Move 2 (Extra) -> Decrements to 0 -> Turn Ends.
    
    // So here we tested the "Extra Move" part.
    // If we set remaining=2, it should stay.
    
    gameState.turnState.remainingMoves = 2;
    const result2 = gameManager.executeMove(gameState, move);
    expect(result2.newGameState?.currentPlayer).toBe(PlayerColor.RED);
    expect(result2.newGameState?.turnState?.remainingMoves).toBe(1);
  });
});
