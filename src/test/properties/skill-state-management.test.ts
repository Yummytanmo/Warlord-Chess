import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { SkillEngine, SkillTrigger, SkillState } from '@/lib/skillEngine';
import { BaseSkill } from '@/lib/heroes';
import { 
  SkillType, 
  GameContext, 
  SkillResult, 
  GameState,
  Player,
  PlayerColor,
  GamePhase,
  Hero
} from '@/types/game';
import { ChessBoard } from '@/lib/board';

/**
 * Feature: sanguo-xiangqi, Property 3: 武将技能状态管理
 * 验证: 需求 9.1, 9.2, 9.3
 * 
 * 属性 3: 武将技能状态管理
 * 对于任何武将技能，系统必须正确管理其状态
 * （限定技只能使用一次，觉醒技满足条件后激活，锁定技自动触发）
 */

// 测试技能实现
class TestPassiveSkill extends BaseSkill {
  id = 'test_passive';
  name = '测试被动技能';
  type = SkillType.PASSIVE;
  description = '测试用被动技能';

  canUse(): boolean {
    return true;
  }

  execute(context: GameContext): SkillResult {
    return { success: true, message: '被动技能触发' };
  }
}

class TestLimitedSkill extends BaseSkill {
  id = 'test_limited';
  name = '测试限定技能';
  type = SkillType.LIMITED;
  description = '测试用限定技能';

  canUse(): boolean {
    return !this.isUsed;
  }

  execute(context: GameContext): SkillResult {
    this.isUsed = true;
    return { success: true, message: '限定技能使用' };
  }
}

class TestAwakeningSkill extends BaseSkill {
  id = 'test_awakening';
  name = '测试觉醒技能';
  type = SkillType.AWAKENING;
  description = '测试用觉醒技能';

  canUse(): boolean {
    return true;
  }

  execute(context: GameContext): SkillResult {
    return { success: true, message: '觉醒技能触发' };
  }
}

class TestActiveSkill extends BaseSkill {
  id = 'test_active';
  name = '测试主动技能';
  type = SkillType.ACTIVE;
  description = '测试用主动技能';

  canUse(): boolean {
    return true;
  }

  execute(context: GameContext): SkillResult {
    return { success: true, message: '主动技能使用' };
  }
}

// 生成器：创建测试技能
const skillGenerator = fc.oneof(
  fc.constant(new TestPassiveSkill()),
  fc.constant(new TestLimitedSkill()),
  fc.constant(new TestAwakeningSkill()),
  fc.constant(new TestActiveSkill())
);

// 生成器：创建技能触发器列表
const triggersGenerator = fc.array(
  fc.constantFrom(...Object.values(SkillTrigger)),
  { minLength: 1, maxLength: 3 }
);

// 生成器：创建优先级
const priorityGenerator = fc.integer({ min: 0, max: 10 });

// 生成器：创建游戏状态
const gameStateGenerator = fc.record({
  board: fc.constant(new ChessBoard()),
  players: fc.constant([
    {
      id: 'player1',
      color: PlayerColor.RED,
      hero: { id: 'test_hero', name: '测试武将', skills: [], awakened: false } as Hero,
      pieces: []
    },
    {
      id: 'player2',
      color: PlayerColor.BLACK,
      hero: { id: 'test_hero2', name: '测试武将2', skills: [], awakened: false } as Hero,
      pieces: []
    }
  ] as [Player, Player]),
  currentPlayer: fc.constantFrom(...Object.values(PlayerColor)),
  gamePhase: fc.constant(GamePhase.PLAYING),
  moveHistory: fc.constant([])
});

describe('Skill State Management Properties', () => {
  let skillEngine: SkillEngine;

  beforeEach(() => {
    skillEngine = new SkillEngine();
  });

  it('Property 3: Skill registration and state initialization', () => {
    fc.assert(fc.property(
      skillGenerator,
      triggersGenerator,
      priorityGenerator,
      (skill, triggers, priority) => {
        // 注册技能
        skillEngine.registerSkill(skill, triggers, priority);
        
        // 验证技能状态被正确初始化
        const skillState = skillEngine.getSkillState(skill.id);
        expect(skillState).toBeDefined();
        expect(skillState!.skillId).toBe(skill.id);
        expect(skillState!.isUsed).toBe(false);
        expect(skillState!.usageCount).toBe(0);
        expect(skillState!.lastUsedTurn).toBe(-1);
        
        // 验证觉醒技的初始状态
        if (skill.type === SkillType.AWAKENING) {
          expect(skillState!.isAwakened).toBe(false);
        } else {
          expect(skillState!.isAwakened).toBe(true);
        }
        
        // 验证限定技的最大使用次数
        if (skill.type === SkillType.LIMITED) {
          expect(skillState!.maxUsages).toBe(1);
        }
      }
    ), { numRuns: 100 });
  });

  it('Property 3: Limited skills can only be used once', () => {
    fc.assert(fc.property(
      gameStateGenerator,
      (gameState) => {
        const limitedSkill = new TestLimitedSkill();
        skillEngine.registerSkill(limitedSkill, [SkillTrigger.MANUAL]);
        
        const player = gameState.players[0];
        
        // 第一次使用应该成功
        const firstResult = skillEngine.useSkill(limitedSkill.id, gameState, player);
        expect(firstResult.success).toBe(true);
        
        // 验证技能状态已更新
        const skillState = skillEngine.getSkillState(limitedSkill.id);
        expect(skillState!.isUsed).toBe(true);
        expect(skillState!.usageCount).toBe(1);
        
        // 第二次使用应该失败
        const secondResult = skillEngine.useSkill(limitedSkill.id, gameState, player);
        expect(secondResult.success).toBe(false);
        expect(secondResult.message).toContain('不可用');
        
        // 验证使用次数没有增加
        const finalState = skillEngine.getSkillState(limitedSkill.id);
        expect(finalState!.usageCount).toBe(1);
      }
    ), { numRuns: 100 });
  });

  it('Property 3: Awakening skills require awakening before use', () => {
    fc.assert(fc.property(
      gameStateGenerator,
      (gameState) => {
        const awakeningSkill = new TestAwakeningSkill();
        skillEngine.registerSkill(awakeningSkill, [SkillTrigger.MANUAL]);
        
        const player = gameState.players[0];
        
        // 未觉醒时不能使用
        const beforeAwakeningResult = skillEngine.canUseSkill(awakeningSkill.id, gameState);
        expect(beforeAwakeningResult).toBe(false);
        
        // 觉醒技能
        const awakenResult = skillEngine.awakenSkill(awakeningSkill.id);
        expect(awakenResult).toBe(true);
        
        // 觉醒后应该可以使用
        const afterAwakeningResult = skillEngine.canUseSkill(awakeningSkill.id, gameState);
        expect(afterAwakeningResult).toBe(true);
        
        // 验证技能状态
        const skillState = skillEngine.getSkillState(awakeningSkill.id);
        expect(skillState!.isAwakened).toBe(true);
        
        // 重复觉醒应该失败
        const duplicateAwakenResult = skillEngine.awakenSkill(awakeningSkill.id);
        expect(duplicateAwakenResult).toBe(false);
      }
    ), { numRuns: 100 });
  });

  it('Property 3: Passive skills are always available', () => {
    fc.assert(fc.property(
      gameStateGenerator,
      fc.integer({ min: 0, max: 10 }),
      (gameState, usageCount) => {
        const passiveSkill = new TestPassiveSkill();
        skillEngine.registerSkill(passiveSkill, [SkillTrigger.BEFORE_MOVE]);
        
        // 被动技能应该始终可用
        expect(skillEngine.canUseSkill(passiveSkill.id, gameState)).toBe(true);
        
        // 多次触发后仍然可用
        for (let i = 0; i < usageCount; i++) {
          skillEngine.triggerSkills(SkillTrigger.BEFORE_MOVE, gameState, {
            player: gameState.players[0]
          });
        }
        
        expect(skillEngine.canUseSkill(passiveSkill.id, gameState)).toBe(true);
        
        // 验证使用次数被正确记录
        const skillState = skillEngine.getSkillState(passiveSkill.id);
        expect(skillState!.usageCount).toBe(usageCount);
      }
    ), { numRuns: 100 });
  });

  it('Property 3: Skill state updates are consistent', () => {
    fc.assert(fc.property(
      skillGenerator,
      gameStateGenerator,
      fc.integer({ min: 1, max: 5 }),
      (skill, gameState, turnNumber) => {
        skillEngine.registerSkill(skill, [SkillTrigger.MANUAL]);
        skillEngine.updateTurn(turnNumber);
        
        const player = gameState.players[0];
        const initialState = skillEngine.getSkillState(skill.id)!;
        
        // 如果技能可以使用，使用它
        if (skillEngine.canUseSkill(skill.id, gameState)) {
          const result = skillEngine.useSkill(skill.id, gameState, player);
          
          if (result.success) {
            const updatedState = skillEngine.getSkillState(skill.id)!;
            
            // 验证使用次数增加
            expect(updatedState.usageCount).toBe(initialState.usageCount + 1);
            
            // 验证最后使用回合更新
            expect(updatedState.lastUsedTurn).toBe(turnNumber);
            
            // 验证限定技被标记为已使用
            if (skill.type === SkillType.LIMITED) {
              expect(updatedState.isUsed).toBe(true);
            }
          }
        }
      }
    ), { numRuns: 100 });
  });

  it('Property 3: Skill state reset works correctly', () => {
    fc.assert(fc.property(
      fc.array(skillGenerator, { minLength: 1, maxLength: 5 }),
      gameStateGenerator,
      (skills, gameState) => {
        // 注册多个技能
        for (const skill of skills) {
          skillEngine.registerSkill(skill, [SkillTrigger.MANUAL]);
        }
        
        const player = gameState.players[0];
        
        // 使用一些技能
        for (const skill of skills) {
          if (skillEngine.canUseSkill(skill.id, gameState)) {
            skillEngine.useSkill(skill.id, gameState, player);
          }
        }
        
        // 重置技能状态
        skillEngine.resetSkillStates();
        
        // 验证所有技能状态都被重置
        for (const skill of skills) {
          const skillState = skillEngine.getSkillState(skill.id);
          expect(skillState!.isUsed).toBe(false);
          expect(skillState!.usageCount).toBe(0);
          expect(skillState!.lastUsedTurn).toBe(-1);
          
          if (skill.type === SkillType.AWAKENING) {
            expect(skillState!.isAwakened).toBe(false);
          } else {
            expect(skillState!.isAwakened).toBe(true);
          }
        }
      }
    ), { numRuns: 100 });
  });

  it('Property 3: Skill priority affects execution order', () => {
    fc.assert(fc.property(
      fc.array(
        fc.record({
          skill: skillGenerator,
          priority: fc.integer({ min: 0, max: 5 }) // Ensure different priorities
        }),
        { minLength: 2, maxLength: 3 }
      ).filter(skills => {
        // Ensure we have at least two skills with different priorities
        const priorities = skills.map(s => s.priority);
        return new Set(priorities).size >= 2;
      }),
      gameStateGenerator,
      (skillsWithPriority, gameState) => {
        const executionOrder: string[] = [];
        
        // 创建记录执行顺序的技能
        const trackingSkills = skillsWithPriority.map(({ skill, priority }) => {
          const trackingSkill = new (class extends BaseSkill {
            id = skill.id + '_tracking_' + priority;
            name = skill.name + '_tracking';
            type = skill.type;
            description = skill.description;
            
            canUse() { return true; }
            
            execute(context: GameContext): SkillResult {
              executionOrder.push(this.id);
              return { success: true, message: 'executed' };
            }
          })();
          
          return { skill: trackingSkill, priority };
        });
        
        // 注册技能并觉醒觉醒技能
        for (const { skill, priority } of trackingSkills) {
          skillEngine.registerSkill(skill, [SkillTrigger.BEFORE_MOVE], priority);
          
          // 如果是觉醒技能，先觉醒它
          if (skill.type === SkillType.AWAKENING) {
            skillEngine.awakenSkill(skill.id);
          }
        }
        
        // 触发技能
        skillEngine.triggerSkills(SkillTrigger.BEFORE_MOVE, gameState, {
          player: gameState.players[0]
        });
        
        // 验证执行顺序符合优先级（高优先级先执行）
        const sortedByPriority = trackingSkills
          .sort((a, b) => b.priority - a.priority)
          .map(({ skill }) => skill.id);
        
        // 验证高优先级的技能在低优先级技能之前执行
        for (let i = 0; i < executionOrder.length - 1; i++) {
          const currentSkillId = executionOrder[i];
          const nextSkillId = executionOrder[i + 1];
          
          const currentPriority = trackingSkills.find(s => s.skill.id === currentSkillId)?.priority ?? 0;
          const nextPriority = trackingSkills.find(s => s.skill.id === nextSkillId)?.priority ?? 0;
          
          // 当前技能的优先级应该大于等于下一个技能的优先级
          expect(currentPriority).toBeGreaterThanOrEqual(nextPriority);
        }
      }
    ), { numRuns: 100 });
  });

  it('Property 3: Skill state persistence across turns', () => {
    fc.assert(fc.property(
      skillGenerator,
      gameStateGenerator,
      fc.array(fc.integer({ min: 1, max: 20 }), { minLength: 1, maxLength: 10 }),
      (skill, gameState, turns) => {
        skillEngine.registerSkill(skill, [SkillTrigger.MANUAL]);
        
        const player = gameState.players[0];
        let totalUsages = 0;
        
        // 在多个回合中使用技能
        for (const turn of turns) {
          skillEngine.updateTurn(turn);
          
          if (skillEngine.canUseSkill(skill.id, gameState)) {
            const result = skillEngine.useSkill(skill.id, gameState, player);
            if (result.success) {
              totalUsages++;
            }
          }
        }
        
        // 验证技能状态正确记录了所有使用
        const finalState = skillEngine.getSkillState(skill.id)!;
        
        if (skill.type === SkillType.LIMITED) {
          // 限定技最多使用一次
          expect(finalState.usageCount).toBeLessThanOrEqual(1);
          if (totalUsages > 0) {
            expect(finalState.isUsed).toBe(true);
          }
        } else {
          // 其他技能可以多次使用
          expect(finalState.usageCount).toBe(totalUsages);
        }
        
        // 最后使用回合应该是最后一个成功使用的回合
        if (totalUsages > 0) {
          expect(finalState.lastUsedTurn).toBeGreaterThan(-1);
        }
      }
    ), { numRuns: 100 });
  });

  it('Property 3: Skill availability checks are consistent', () => {
    fc.assert(fc.property(
      skillGenerator,
      gameStateGenerator,
      (skill, gameState) => {
        skillEngine.registerSkill(skill, [SkillTrigger.MANUAL]);
        
        const player = gameState.players[0];
        
        // canUseSkill和useSkill的结果应该一致
        const canUse = skillEngine.canUseSkill(skill.id, gameState);
        const useResult = skillEngine.useSkill(skill.id, gameState, player);
        
        if (canUse) {
          // 如果canUse返回true，useSkill应该成功
          expect(useResult.success).toBe(true);
        } else {
          // 如果canUse返回false，useSkill应该失败
          expect(useResult.success).toBe(false);
        }
        
        // 对于觉醒技，未觉醒时不能使用
        if (skill.type === SkillType.AWAKENING) {
          const skillState = skillEngine.getSkillState(skill.id)!;
          if (!skillState.isAwakened) {
            expect(canUse).toBe(false);
          }
        }
        
        // 对于限定技，使用后不能再使用
        if (skill.type === SkillType.LIMITED && useResult.success) {
          const secondCanUse = skillEngine.canUseSkill(skill.id, gameState);
          expect(secondCanUse).toBe(false);
        }
      }
    ), { numRuns: 100 });
  });
});