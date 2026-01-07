import { Skill, SkillType, GameContext, SkillResult, PieceType, PlayerColor } from '@/types/game';
import { RuleContext } from '@/types/rules';
import { PieceSetup } from '../pieceSetup';

export const gengYiSkill: Skill = {
  id: 'liubang-gengyi',
  name: '更衣',
  type: SkillType.PASSIVE,
  description: '你的将可以出九宫',
  isUsed: false,
  canUse: () => true,
  execute: () => ({ success: true }),
  applyRules: (context: RuleContext) => {
    context.moveRules.king.canLeavePalace = true;
  }
};

export const hongMenSkill: Skill = {
  id: 'liubang-hongmen',
  name: '鸿门',
  type: SkillType.PASSIVE,
  description: '你的士可以出九宫但不能过河，你的象不受象心的影响',
  isUsed: false,
  canUse: () => true,
  execute: () => ({ success: true }),
  applyRules: (context: RuleContext) => {
    context.moveRules.advisor.canLeavePalace = true;
    context.moveRules.elephant.ignoreHeartBlock = true;
  }
};

export const qinZhengSkill: Skill = {
  id: 'liubang-qinzheng',
  name: '亲征',
  type: SkillType.LIMITED,
  description: '限定技，你可以结束本回合，强迫对方的将和你一条线...',
  isUsed: false,
  canUse: () => true,
  execute: (context: GameContext): SkillResult => {
    const { gameState, player } = context;
    if (!player) return { success: false, message: '玩家未定义' };

    const board = gameState.board.clone(); // Clone for modification
    const myKing = PieceSetup.findKing(player.pieces, player.color);
    const opponentPlayer = gameState.players.find(p => p.color !== player.color);
    
    if (!opponentPlayer) return { success: false, message: '对手未定义' };
    
    const opponentKing = PieceSetup.findKing(opponentPlayer.pieces, opponentPlayer.color);

    if (!myKing || !opponentKing) return { success: false, message: '将不存在' };

    // Check if already on same line and facing (no obstacles)
    if (myKing.position.x === opponentKing.position.x) {
       // Check obstacles
       let hasObstacle = false;
       const minY = Math.min(myKing.position.y, opponentKing.position.y);
       const maxY = Math.max(myKing.position.y, opponentKing.position.y);
       for (let y = minY + 1; y < maxY; y++) {
         if (board.getPiece({ x: myKing.position.x, y })) {
           hasObstacle = true;
           break;
         }
       }
       if (!hasObstacle) {
         return { success: false, message: '双方将已见面，无法发动' };
       }
    }

    // Move opponent King to same file
    const targetPos = { x: myKing.position.x, y: opponentKing.position.y };
    
    // If target position has a piece, remove it?
    // "强迫对方的将和你一条线...若移动路径上有其他子阻挡则移除"
    // Assuming instantaneous teleport, so just overwrite whatever is at targetPos?
    // Or does it imply standard movement rules? Teleport is safer interpretation for "Force".
    
    // Update board: Remove from old pos, set to new pos.
    // Also update opponentKing reference in players array
    
    // Remove obstacles between them AFTER move
    const minY = Math.min(myKing.position.y, targetPos.y);
    const maxY = Math.max(myKing.position.y, targetPos.y);
    
    for (let y = minY + 1; y < maxY; y++) {
      const pos = { x: targetPos.x, y };
      const piece = board.getPiece(pos);
      if (piece) {
        // Remove piece
        board.setPiece(pos, null);
        // Mark as dead in player's list
        const p = gameState.players.find(pl => pl.color === piece.color);
        if (p) {
          const targetP = p.pieces.find(pp => pp.id === piece.id);
          if (targetP) targetP.isAlive = false;
        }
      }
    }

    // Move the king
    board.setPiece(opponentKing.position, null);
    
    // Update opponent king in player list
    const oppKingInList = opponentPlayer.pieces.find(p => p.id === opponentKing.id);
    if (oppKingInList) {
      oppKingInList.position = targetPos;
    }
    
    // If target pos had a piece (that wasn't the king itself), remove it?
    // Implementation: setPiece overwrites.
    // But we need to kill the piece if it was there.
    const pieceAtTarget = board.getPiece(targetPos);
    if (pieceAtTarget && pieceAtTarget.id !== opponentKing.id) {
       const p = gameState.players.find(pl => pl.color === pieceAtTarget.color);
       if (p) {
         const targetP = p.pieces.find(pp => pp.id === pieceAtTarget.id);
         if (targetP) targetP.isAlive = false;
       }
    }
    
    board.setPiece(targetPos, { ...opponentKing, position: targetPos });

    // Note: The skill description says "End current turn". 
    // SkillEngine/GameManager should handle turn switch after skill execution if it consumes turn.
    // Usually Active Skills might consume turn.
    
    return {
      success: true,
      gameStateChanges: {
        board,
        players: gameState.players // Updated with moved/killed pieces
      }
    };
  }
};
