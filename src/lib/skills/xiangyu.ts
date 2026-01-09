import { Skill, SkillType } from '@/types/game';
import { RuleContext } from '@/types/rules';

export const beiShuiSkill: Skill = {
  id: 'xiangyu-beishui',
  name: '背水',
  type: SkillType.PASSIVE,
  description: '兵未过河前可以一步直接过河，兵过河之后每次走棋可以连走两步，但是最多只能前进一步',
  isUsed: false,
  canUse: () => true,
  execute: () => ({ success: true }),
  applyRules: (context: RuleContext) => {
    context.moveRules.pawn.canCrossRiverDirectly = true;
    context.moveRules.pawn.canMoveTwoStepsAfterRiver = true;
  }
};

export const baWangSkill: Skill = {
  id: 'xiangyu-bawang',
  name: '霸王',
  type: SkillType.PASSIVE, // Locking skill is essentially passive here
  description: '锁定技，你的马不受拌马腿的影响，除非你马受攻，你不能在连续的两步都选择跳马',
  isUsed: false,
  canUse: () => true,
  execute: () => ({ success: true }),
  applyRules: (context: RuleContext) => {
    context.moveRules.horse.ignoreLegBlock = true;
    context.moveRules.horse.limitConsecutiveJumps = true;
  }
};
