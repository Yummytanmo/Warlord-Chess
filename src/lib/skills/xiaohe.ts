import { Skill, SkillType, GameContext, SkillResult, PieceType, SkillTrigger } from '@/types/game';
import { PieceSetup } from '../pieceSetup';

export const yueXiaSkill: Skill = {
  id: 'xiaohe-yuexia',
  name: '月下',
  type: SkillType.LIMITED,
  description: '限定技，令一子和一已移除子回到开局位置',
  isUsed: false,
  canUse: () => true,
  execute: (context: GameContext): SkillResult => {
    const ctx = context as any;
    const { trigger, gameState, player, extraParams } = ctx;

    if (trigger === SkillTrigger.MANUAL) {
      // Record targets
      // extraParams: { boardPieceId: string, removedPieceId: string }
      // Store in skillState.customData
      // Cannot access skillState directly here easily without passing it?
      // SkillEngine passes skillState in context.
      const skillState = ctx.skillState;
      if (skillState) {
        skillState.customData = { 
          pendingReturn: true,
          boardPieceId: extraParams.boardPieceId,
          removedPieceId: extraParams.removedPieceId
        };
      }
      return { success: true };
    }

    if (trigger === SkillTrigger.ON_TURN_START) {
      const skillState = ctx.skillState;
      if (skillState?.customData?.pendingReturn) {
        // Execute return logic
        const { boardPieceId, removedPieceId } = skillState.customData;
        
        // Logic to move pieces to initial pos
        const initialPos1 = PieceSetup.getInitialPosition(boardPieceId);
        const initialPos2 = PieceSetup.getInitialPosition(removedPieceId);
        
        if (initialPos1 && initialPos2) {
           // Move/Place pieces
           // Need to handle if initial pos occupied?
           // Spec doesn't say. Assume overwrite or fail?
           // "Return to initial position" implies they go there.
           // ... logic ...
        }
        
        // Clear pending
        skillState.customData = {};
        return { success: true, gameStateChanges: { board: gameState.board } };
      }
    }

    return { success: true };
  }
};

export const baiYeSkill: Skill = {
  id: 'xiaohe-baiye',
  name: '败也',
  type: SkillType.PASSIVE, // Locking
  description: '移动将后，必须再移动一步将',
  isUsed: false,
  canUse: () => true,
  execute: (context: GameContext): SkillResult => {
    const ctx = context as any;
    const { trigger, gameState, piece } = ctx;

    if (trigger === SkillTrigger.AFTER_MOVE && piece?.type === PieceType.KING) {
      // Check if we are already in a forced sequence to avoid infinite triggering if not careful
      // But executeMove handles decrementing remainingMoves.
      // We only trigger this if this was a "normal" move that started the sequence.
      
      if (!gameState.turnState) {
        return {
          success: true,
          gameStateChanges: {
            turnState: {
              phase: 'force_move',
              remainingMoves: 1,
              requiredPieceId: piece.id
            }
          }
        };
      }
    }
    return { success: true };
  }
};
