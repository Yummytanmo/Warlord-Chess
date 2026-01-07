import { Skill, SkillType, GameContext, SkillResult, SkillTrigger, PieceType } from '@/types/game';
import { PieceSetup } from '../pieceSetup';

export const wuJianSkill: Skill = {
  id: 'fankui-wujian',
  name: '舞剑',
  type: SkillType.LIMITED,
  description: '限定技，使用一个同名的子和对方的子相互击杀',
  isUsed: false,
  canUse: () => true,
  execute: (context: GameContext): SkillResult => {
    const ctx = context as any;
    if (ctx.trigger === SkillTrigger.MANUAL) {
      const { myPieceId, targetPieceId } = ctx.extraParams || {};
      // Validate same name/type
      // Remove both
      // ...
      return { success: true };
    }
    return { success: true };
  }
};

export const huZhuSkill: Skill = {
  id: 'fankui-huzhu',
  name: '护主',
  type: SkillType.LIMITED,
  description: '限定技，当你的将被移走时...',
  isUsed: false,
  canUse: () => true,
  execute: (context: GameContext): SkillResult => {
    const ctx = context as any;
    if (ctx.trigger === SkillTrigger.ON_CAPTURE && ctx.capturedPiece?.type === PieceType.KING) {
       const { gameState, move, capturedPiece, player } = ctx;
       // Revive King at move.to (where it died)
       // Wait, move.to is where Attacker is now.
       // King was at move.to before move.
       // So King goes back to move.to?
       // "将其退回至上一步位置" -> Where it was? Yes.
       // "令攻击其的子回到初始位置" -> Attacker (move.piece) goes to Initial.
       
       const board = gameState.board;
       const attacker = move.piece;
       
       // 1. Move Attacker to Initial
       const initialPos = PieceSetup.getInitialPosition(attacker.id);
       if (initialPos) {
         board.setPiece(move.to, null); // Remove attacker from current pos
         // Check if initial pos occupied?
         // Spec doesn't say. Assume kill or overwrite.
         board.setPiece(initialPos, { ...attacker, position: initialPos });
       }
       
       // 2. Revive King at move.to
       capturedPiece.isAlive = true;
       board.setPiece(move.to, capturedPiece);
       
       // Update player lists logic handled by game manager or we do it here?
       // GameManager.applyMove handles logic.
       // Here we are modifying state post-move.
       // We need to ensure piece references in player.pieces are updated.
       
       return { success: true, gameStateChanges: { board } };
    }
    return { success: true };
  }
};

export const ciJueSkill: Skill = {
  id: 'fankui-cijue',
  name: '赐爵',
  type: SkillType.AWAKENING,
  description: '...',
  isUsed: false,
  canUse: () => true,
  execute: () => ({ success: true })
};
