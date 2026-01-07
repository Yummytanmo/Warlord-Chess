import { Skill, SkillType, GameContext, SkillResult, PieceType, SkillTrigger, Piece, PlayerColor } from '@/types/game';
import { PieceSetup } from '../pieceSetup';

export const yunChouSkill: Skill = {
  id: 'zhangliang-yunchou',
  name: '运筹',
  type: SkillType.PASSIVE,
  description: '你移动将后，可以再移动己方除车以外的一个子',
  isUsed: false,
  canUse: () => true,
  execute: (context: GameContext): SkillResult => {
    const ctx = context as any;
    const { trigger, gameState, piece } = ctx;

    if (trigger === SkillTrigger.AFTER_MOVE && piece?.type === PieceType.KING) {
      if (!gameState.turnState) {
        return {
          success: true,
          gameStateChanges: {
            turnState: {
              phase: 'extra_move',
              remainingMoves: 1,
              bannedPieceTypes: [PieceType.CHARIOT]
            }
          }
        };
      }
    }
    return { success: true };
  }
};

export const jueShengSkill: Skill = {
  id: 'zhangliang-juesheng',
  name: '决胜',
  type: SkillType.LIMITED,
  description: '限定技，在你第一次被叫将后可以连续移动两次将',
  isUsed: false,
  canUse: () => true, // canUse should ideally check customData
  execute: (context: GameContext): SkillResult => {
    const ctx = context as any;
    const { skillState, player, gameState } = ctx;

    // Track checks
    if (ctx.trigger === SkillTrigger.ON_CHECK) {
       if (skillState) {
         if (!skillState.customData) skillState.customData = { checkCount: 0 };
         skillState.customData.checkCount = (skillState.customData.checkCount || 0) + 1;
       }
       return { success: true };
    }

    // Manual Activation
    if (ctx.trigger === SkillTrigger.MANUAL) {
       if (!skillState?.customData?.checkCount || skillState.customData.checkCount === 0) {
         return { success: false, message: '尚未被叫将' };
       }
       
       // Enable double king move
       const king = PieceSetup.findKing(player.pieces, player.color);
       if (!king) return { success: false, message: '将不存在' };

       return {
         success: true,
         gameStateChanges: {
           turnState: {
             phase: 'force_move',
             remainingMoves: 2,
             requiredPieceId: king.id
           }
         }
       };
    }
    return { success: true };
  }
};

export const shiLvSkill: Skill = {
  id: 'zhangliang-shilv',
  name: '拾履',
  type: SkillType.AWAKENING,
  description: '你的将第一次吃子后，可选择同名的一个子增加在九宫之内任意位置',
  isUsed: false,
  canUse: () => true,
  execute: (context: GameContext): SkillResult => {
    const ctx = context as any;
    const { skillState, gameState, player, extraParams } = ctx;

    // Awakening trigger
    if (ctx.trigger === SkillTrigger.ON_CAPTURE && ctx.piece?.type === PieceType.KING) {
       if (ctx.skillEngine.awakenSkill(shiLvSkill.id)) {
         // Store captured type
         if (skillState) {
           skillState.customData = { capturedType: ctx.capturedPiece?.type };
         }
       }
       return { success: true };
    }
    
    // Active use
    if (ctx.trigger === SkillTrigger.MANUAL) {
       const capturedType = skillState?.customData?.capturedType;
       if (!capturedType) return { success: false, message: '未记录吃子类型' };
       
       const pos = extraParams?.position;
       if (!pos || !gameState.board.isValidPosition(pos)) return { success: false, message: '位置无效' };
       if (!gameState.board.isInPalace(pos, player.color)) return { success: false, message: '必须在九宫内' };
       if (gameState.board.getPiece(pos)) return { success: false, message: '位置已有棋子' };
       
       // Add piece
        const newPiece: Piece = {
          id: `zhangliang-shilv-${Date.now()}`,
          type: capturedType,
          color: player.color,
          position: pos,
          isAlive: true
        };
        gameState.board.setPiece(pos, newPiece);
        player.pieces.push(newPiece);
        
        return { success: true };
    }
    return { success: true };
  }
};