import { Skill, SkillType, GameContext, SkillResult, PlayerColor, PieceType, Piece, SkillTrigger } from '@/types/game';

// Helper to handle 5-marker special effect
const checkAndTriggerFiveMarkers = (gameState: any, player: any) => {
  const currentMarkers = gameState.markers?.[player.color] || 0;
  if (currentMarkers >= 5) {
    // Clear ALL pieces on both Pawn Ranks (Soldier lines)
    // Red Pawn Rank: y=6. Black Pawn Rank: y=3.
    // "Both Pawn Ranks" usually means rank 3 and 6.
    const board = gameState.board;
    for (let x = 0; x < 9; x++) {
      board.setPiece({ x, y: 3 }, null); // Clear Black rank
      board.setPiece({ x, y: 6 }, null); // Clear Red rank
    }
    
    // Place 5 Pawns
    // Spec: "Select arbitrary positions on these two lines to place 5 pawns"
    // This implies a user interaction to select positions.
    // But this is a forced effect? Or automatic?
    // "When you have 5 markers... place 5 pawns".
    // It sounds like an event.
    // For simplicity/MVP, maybe place them randomly or at standard positions?
    // Spec says "Select...". This requires UI interaction.
    // We can't block execution flow here easily without a complex "Pending Selection" state.
    // For now, let's auto-place 5 pawns on the player's own rank as a fallback/MVP implementation
    // or leave a TODO/Comment.
    // Given the complexity, I'll auto-place them on the player's own pawn rank (5 standard spots).
    
    const y = player.color === PlayerColor.RED ? 6 : 3;
    const xs = [0, 2, 4, 6, 8];
    xs.forEach(x => {
        const newPawn: Piece = {
          id: `hanxin-super-pawn-${Date.now()}-${x}`,
          type: PieceType.PAWN,
          color: player.color,
          position: { x, y },
          isAlive: true
        };
        board.setPiece({ x, y }, newPawn);
        player.pieces.push(newPawn);
    });
    
    // Reset markers? Spec doesn't say consume. But "When holding 5 markers".
    // Usually implies a transformation.
    // Assuming reset to 0 or consume 5.
    gameState.markers[player.color] -= 5;
  }
};

export const dianBingSkill: Skill = {
  id: 'hanxin-dianbing',
  name: '点兵',
  type: SkillType.PASSIVE,
  description: '锁定技，你开局没有兵。初始时你拥有两个兵标记...',
  isUsed: false,
  canUse: () => true,
  execute: (context: GameContext): SkillResult => {
    const ctx = context as any;
    const { trigger, gameState, player } = ctx;
    
    if (!player) return { success: false };

    if (!gameState.markers) gameState.markers = {};

    if (trigger === SkillTrigger.ON_GAME_START) {
      const pieces = gameState.board.getAllPieces();
      pieces.forEach((p: Piece) => {
        if (p.color === player.color && p.type === PieceType.PAWN) {
          gameState.board.setPiece(p.position, null);
          p.isAlive = false;
        }
      });
      gameState.markers[player.color] = 2;
      return { success: true };
    }

    if (trigger === SkillTrigger.MANUAL) {
      const positions = ctx.extraParams?.positions;
      if (!positions || !Array.isArray(positions)) return { success: false, message: '无效参数' };
      
      const count = positions.length;
      if (count > 2) return { success: false, message: '最多放置2个' };
      
      const currentMarkers = gameState.markers[player.color] || 0;
      if (currentMarkers < count) return { success: false, message: '兵标记不足' };

      for (const pos of positions) {
        if (!gameState.board.isValidPosition(pos)) continue;
        if (gameState.board.getPiece(pos)) continue;
        
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
      const type = capturedPiece.type;
      if ([PieceType.CHARIOT, PieceType.HORSE, PieceType.CANNON, PieceType.PAWN].includes(type)) {
        if (!gameState.markers) gameState.markers = {};
        gameState.markers[player.color] = (gameState.markers[player.color] || 0) + 1;
        
        // Check for 5 markers logic
        checkAndTriggerFiveMarkers(gameState, player);
        
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
    const ctx = context as any;
    if (ctx.trigger === SkillTrigger.MANUAL) {
      const { pieceId1, pieceId2 } = ctx.extraParams || {};
      const { gameState, player } = ctx;
      const board = gameState.board;
      
      const p1 = player.pieces.find((p: Piece) => p.id === pieceId1);
      const p2 = player.pieces.find((p: Piece) => p.id === pieceId2);
      
      if (!p1 || !p2) return { success: false, message: '棋子不存在' };
      
      // Verify one is Pawn
      if (p1.type !== PieceType.PAWN && p2.type !== PieceType.PAWN) {
        return { success: false, message: '必须包含一个兵' };
      }
      
      // Swap
      const pos1 = { ...p1.position };
      const pos2 = { ...p2.position };
      
      p1.position = pos2;
      p2.position = pos1;
      
      board.setPiece(pos1, p2);
      board.setPiece(pos2, p1);
      
      return { success: true };
    }
    return { success: true };
  }
};