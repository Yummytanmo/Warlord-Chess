import { Skill, SkillType, GameContext, SkillResult, PieceType, SkillTrigger, Piece } from '@/types/game';
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
    const { trigger, gameState, extraParams } = ctx;

    if (trigger === SkillTrigger.MANUAL) {
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
        const { boardPieceId, removedPieceId } = skillState.customData;
        
        const initialPos1 = PieceSetup.getInitialPosition(boardPieceId);
        const initialPos2 = PieceSetup.getInitialPosition(removedPieceId);
        
        if (initialPos1 && initialPos2) {
           const place = (id: string, pos: {x: number, y: number}) => {
             let targetPiece: any = null;
             
             for (const p of gameState.players) {
               const found = p.pieces.find((pp: Piece) => pp.id === id);
               if (found) {
                 targetPiece = found;
                 break;
               }
             }
             
             if (targetPiece) {
               const occupant = gameState.board.getPiece(pos);
               if (occupant) {
                 const occOwner = gameState.players.find((p: any) => p.color === occupant.color);
                 if (occOwner) {
                   const occP = occOwner.pieces.find((p: Piece) => p.id === occupant.id);
                   if (occP) occP.isAlive = false;
                 }
                 gameState.board.setPiece(pos, null);
               }
               
               targetPiece.position = pos;
               targetPiece.isAlive = true;
               gameState.board.setPiece(pos, targetPiece);
             }
           };
           
           place(boardPieceId, initialPos1);
           place(removedPieceId, initialPos2);
           
           // Store targets for Cheng Ye
           skillState.customData.yueXiaTargets = [boardPieceId, removedPieceId];
        }
        
        skillState.customData.pendingReturn = false;
        return { success: true, gameStateChanges: { board: gameState.board } };
      }
    }

    return { success: true };
  }
};

export const baiYeSkill: Skill = {
  id: 'xiaohe-baiye',
  name: '败也',
  type: SkillType.PASSIVE,
  description: '移动将后，必须再移动一步将',
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

export const chengYeSkill: Skill = {
  id: 'xiaohe-chengye',
  name: '成也',
  type: SkillType.AWAKENING,
  description: '若你已发动“月下”，则你可以令月下的其中一个对象在吃了一个子后继续走一步，这一步不能造成吃子。',
  isUsed: false,
  canUse: () => true, // Condition checked in execute/engine
  execute: (context: GameContext): SkillResult => {
    const ctx = context as any;
    const { trigger, piece, move, skillEngine } = ctx;

    if (trigger === SkillTrigger.AFTER_MOVE && move?.capturedPiece) {
      // Check if YueXia used
      const yueXiaState = skillEngine.getSkillState(yueXiaSkill.id);
      if (yueXiaState?.isUsed && yueXiaState.customData?.yueXiaTargets) {
        // Check if piece is target
        if (yueXiaState.customData.yueXiaTargets.includes(piece.id)) {
           // Awake logic (auto awake?)
           // Trigger extra move
           return {
             success: true,
             gameStateChanges: {
               turnState: {
                 phase: 'extra_move',
                 remainingMoves: 1,
                 requiredPieceId: piece.id,
                 // TODO: Enforce "Cannot capture" in validation
               }
             }
           };
        }
      }
    }
    return { success: true };
  }
};