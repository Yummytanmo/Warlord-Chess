import { Skill, SkillType, GameContext, SkillResult, PieceType, SkillTrigger } from '@/types/game';

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
  canUse: () => true, // Check logic handled in execute or canUse with state
  execute: (context: GameContext): SkillResult => {
    const ctx = context as any;
    if (ctx.trigger === SkillTrigger.ON_CHECK) {
       // Logic to enable skill availability?
       // Limited skills are usually manual.
       // But "After being checked" implies reaction.
       // Or "On your turn, if you were checked last turn?"
       // Spec: "在你第一次被叫将后".
       // Maybe it sets a state "Can use JueSheng".
       // And then use manual trigger to activate "Double Move King"?
       // Or is it passive? "Can move King twice".
       // It acts like a passive modifier for the next turn.
       
       // Implementation:
       // ON_CHECK -> Update skill state (mark as available/triggered).
       // MANUAL -> Activate to get extra move?
       // Simpler: ON_CHECK -> Set internal flag.
       // When moving King -> Trigger extra move.
       // Since it's Limited, it happens once.
       
       // Let's assume Manual activation for simplicity or Passive trigger on next King move?
       // "Limited" usually implies Manual.
       // User clicks "JueSheng" -> TurnState set to "King must move 2 times"?
       // But user must be in check? Or "After being checked" (history).
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
    // Awakening trigger
    if (ctx.trigger === SkillTrigger.ON_CAPTURE && ctx.piece?.type === PieceType.KING) {
       // Check if already awakened handled by SkillEngine?
       // Yes, canTriggerSkill checks isAwakened.
       // But here we want to BECOME awakened.
       // SkillEngine doesn't auto-awaken. We need to call awakenSkill?
       // Or return gameStateChanges?
       // SkillEngine.awakenSkill(id).
       ctx.skillEngine.awakenSkill(shiLvSkill.id);
       return { success: true };
    }
    
    // Active use
    if (ctx.trigger === SkillTrigger.MANUAL) {
       // Place piece logic
       // ...
    }
    return { success: true };
  }
};
