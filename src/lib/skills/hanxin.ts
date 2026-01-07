import { Skill, SkillType, GameContext, SkillResult, PlayerColor, PieceType, Piece } from '@/types/game';
import { SkillTrigger } from '@/types/game';

export const dianBingSkill: Skill = {
  id: 'hanxin-dianbing',
  name: '点兵',
  type: SkillType.PASSIVE, // Locking but has active component
  description: '锁定技，你开局没有兵。初始时你拥有两个兵标记...',
  isUsed: false,
  canUse: () => true,
  execute: (context: GameContext): SkillResult => {
    // Cast to access trigger and extraParams
    const ctx = context as any;
    const { trigger, gameState, player } = ctx;
    
    if (!player) return { success: false };

    // Initialize markers map if needed
    if (!gameState.markers) gameState.markers = {};

    if (trigger === SkillTrigger.ON_GAME_START) {
      // Clear pawns
      const pieces = gameState.board.getAllPieces();
      pieces.forEach(p => {
        if (p.color === player.color && p.type === PieceType.PAWN) {
          gameState.board.setPiece(p.position, null);
          p.isAlive = false;
        }
      });
      // Initial markers
      gameState.markers[player.color] = 2;
      return { success: true };
    }

    if (trigger === SkillTrigger.MANUAL) {
      // Active placement
      // Payload: { positions: Position[] }
      const positions = ctx.extraParams?.positions;
      if (!positions || !Array.isArray(positions)) return { success: false, message: '无效参数' };
      
      const count = positions.length;
      if (count > 2) return { success: false, message: '最多放置2个' };
      
      const currentMarkers = gameState.markers[player.color] || 0;
      if (currentMarkers < count) return { success: false, message: '兵标记不足' };

      // Place pawns
      for (const pos of positions) {
        if (!gameState.board.isValidPosition(pos)) continue; // Or return error
        if (gameState.board.getPiece(pos)) continue; // Occupied
        
        // Create new pawn
        const newPawn: Piece = {
          id: `hanxin-pawn-${Date.now()}-${Math.random()}`,
          type: PieceType.PAWN,
          color: player.color,
          position: pos,
          isAlive: true
        };
        gameState.board.setPiece(pos, newPawn);
        player.pieces.push(newPawn);
      }

      gameState.markers[player.color] -= count;
      return { success: true };
    }

    return { success: false };
  }
};

export const yiShanSkill: Skill = {
  id: 'hanxin-yishan',
  name: '益善',
  type: SkillType.PASSIVE,
  description: '当场上有任意一个能过河的子被移除时，你获得一个兵标记',
  isUsed: false,
  canUse: () => true,
  execute: (context: GameContext): SkillResult => {
    const ctx = context as any;
    const { gameState, player, capturedPiece } = ctx;
    
    if (ctx.trigger === SkillTrigger.ON_CAPTURE && capturedPiece) {
      // Check if piece can cross river (All except Advisors/Elephants? Wait, Advisors/Elephants can't cross normally)
      // "能过河的子": King (GengYi?), Chariot, Horse, Cannon, Pawn.
      const type = capturedPiece.type;
      if ([PieceType.CHARIOT, PieceType.HORSE, PieceType.CANNON, PieceType.PAWN].includes(type)) {
        if (!gameState.markers) gameState.markers = {};
        gameState.markers[player.color] = (gameState.markers[player.color] || 0) + 1;
        return { success: true };
      }
    }
    return { success: true };
  }
};

export const yongBingSkill: Skill = {
  id: 'hanxin-yongbing',
  name: '用兵',
  type: SkillType.LIMITED,
  description: '回合结束时，你可让你的任意一子和你的兵交换位置',
  isUsed: false,
  canUse: () => true,
  execute: (context: GameContext): SkillResult => {
    // Swap logic
    // extraParams: { pieceId1: string, pieceId2: string }
    return { success: true };
  }
};
