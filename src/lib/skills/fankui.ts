import { Skill, SkillType, GameContext, SkillResult, SkillTrigger, PieceType, Piece } from '@/types/game';
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
      const { gameState, player } = ctx;
      
      const myPiece = player.pieces.find((p: Piece) => p.id === myPieceId);
      if (!myPiece) return { success: false, message: '己方棋子不存在' };
      
      const opponent = gameState.players.find((p: any) => p.color !== player.color);
      const targetPiece = opponent?.pieces.find((p: Piece) => p.id === targetPieceId);
      
      if (!targetPiece) return { success: false, message: '对方棋子不存在' };
      
      if (myPiece.type !== targetPiece.type) return { success: false, message: '棋子类型不同' };
      
      // Remove both
      gameState.board.setPiece(myPiece.position, null);
      gameState.board.setPiece(targetPiece.position, null);
      
      myPiece.isAlive = false;
      targetPiece.isAlive = false;
      
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
       const { gameState, move, capturedPiece } = ctx;
       
       const board = gameState.board;
       const attacker = move.piece;
       
       const initialPos = PieceSetup.getInitialPosition(attacker.id);
       if (initialPos) {
         board.setPiece(move.to, null);
         // Move attacker back
         attacker.position = initialPos;
         board.setPiece(initialPos, attacker);
       }
       
       // Revive King
       capturedPiece.isAlive = true;
       capturedPiece.position = move.to; // Restore to where it was (which is move.to before move? No, capturedPiece was at move.to)
       board.setPiece(move.to, capturedPiece);
       
       return { success: true, gameStateChanges: { board } };
    }
    return { success: true };
  }
};

export const ciJueSkill: Skill = {
  id: 'fankui-cijue',
  name: '赐爵',
  type: SkillType.AWAKENING,
  description: '在两个限定技都使用后，你可以将一个被移除的子添加在棋盘上任何位置',
  isUsed: false,
  canUse: () => true,
  execute: (context: GameContext): SkillResult => {
    const ctx = context as any;
    const { skillEngine, player, gameState, extraParams } = ctx;
    
    // Check awakening condition
    // Triggered usually by MANUAL attempt or ON_TURN_START check?
    // Awakening skills can be passive (auto awaken) or active.
    // Spec: "Awakening skill... you CAN place...". Active.
    // Condition: "After both limited skills used".
    
    // Manual activation
    if (ctx.trigger === SkillTrigger.MANUAL) {
       // Check usage of WuJian and HuZhu
       const s1 = skillEngine.getSkillState(wuJianSkill.id);
       const s2 = skillEngine.getSkillState(huZhuSkill.id);
       
       if (!s1?.isUsed || !s2?.isUsed) {
         return { success: false, message: '限定技未全部使用' };
       }
       
       // Awaken if not already (or just allow use)
       if (!ctx.skillState.isAwakened) {
         ctx.skillEngine.awakenSkill(ciJueSkill.id);
       }
       
       // Place piece
       const { pieceId, position } = extraParams || {};
       if (!position || !gameState.board.isValidPosition(position)) return { success: false, message: '位置无效' };
       if (gameState.board.getPiece(position)) return { success: false, message: '位置已有棋子' };
       
       // Find removed piece
       // Ideally passing ID.
       // For MVP, just assume valid type/id passed or create new?
       // Spec: "Place a removed piece".
       // We should find it in player.pieces where isAlive=false.
       
       const removedPiece = player.pieces.find((p: Piece) => p.id === pieceId && !p.isAlive);
       if (!removedPiece) return { success: false, message: '棋子未找到或存活' };
       
       removedPiece.isAlive = true;
       removedPiece.position = position;
       gameState.board.setPiece(position, removedPiece);
       
       return { success: true };
    }
    
    return { success: true };
  }
};