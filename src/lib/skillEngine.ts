import { 
  Skill, 
  SkillType, 
  GameContext, 
  SkillResult, 
  GameState, 
  Player,
  SkillTrigger,
  SkillState
} from '@/types/game';

/**
 * 技能注册信息
 */
export interface SkillRegistration {
  skill: Skill;
  triggers: SkillTrigger[];
  priority: number; // 优先级，数字越大优先级越高
}

/**
 * 技能执行上下文
 */
export interface SkillExecutionContext extends GameContext {
  trigger: SkillTrigger;
  skillEngine: SkillEngine;
  skillState: SkillState;
}

/**
 * 技能引擎类
 * 负责技能的注册、状态管理、触发和执行
 */
export class SkillEngine {
  private skillRegistry: Map<string, SkillRegistration> = new Map();
  private skillStates: Map<string, SkillState> = new Map();
  private currentTurn: number = 0;

  /**
   * 注册技能
   */
  registerSkill(skill: Skill, triggers: SkillTrigger[], priority: number = 0): void {
    const registration: SkillRegistration = {
      skill,
      triggers,
      priority
    };

    this.skillRegistry.set(skill.id, registration);
    
    // 初始化技能状态
    this.initializeSkillState(skill);
  }

  /**
   * 初始化技能状态
   */
  private initializeSkillState(skill: Skill): void {
    const state: SkillState = {
      skillId: skill.id,
      isUsed: false,
      isAwakened: skill.type === SkillType.AWAKENING ? false : true,
      usageCount: 0,
      maxUsages: skill.type === SkillType.LIMITED ? 1 : undefined,
      cooldownTurns: 0,
      lastUsedTurn: -1,
      customData: {}
    };

    this.skillStates.set(skill.id, state);
  }

  /**
   * 获取技能状态
   */
  getSkillState(skillId: string): SkillState | undefined {
    return this.skillStates.get(skillId);
  }

  /**
   * 更新技能状态
   */
  updateSkillState(skillId: string, updates: Partial<SkillState>): void {
    const currentState = this.skillStates.get(skillId);
    if (currentState) {
      this.skillStates.set(skillId, { ...currentState, ...updates });
    }
  }

  /**
   * 检查技能是否可用
   */
  canUseSkill(skillId: string, _gameState: GameState): boolean {
    const registration = this.skillRegistry.get(skillId);
    const state = this.skillStates.get(skillId);
    
    if (!registration || !state) {
      return false;
    }

    const skill = registration.skill;

    // 检查觉醒技是否已觉醒
    if (skill.type === SkillType.AWAKENING && !state.isAwakened) {
      return false;
    }

    // 检查限定技是否已使用
    if (skill.type === SkillType.LIMITED && state.isUsed) {
      return false;
    }

    // 检查使用次数限制
    if (state.maxUsages !== undefined && state.usageCount >= state.maxUsages) {
      return false;
    }

    // 检查冷却时间
    if (state.cooldownTurns > 0 && (this.currentTurn - state.lastUsedTurn) < state.cooldownTurns) {
      return false;
    }

    // 调用技能自身的canUse方法
    return skill.canUse();
  }

  /**
   * 手动使用技能
   */
  useSkill(skillId: string, gameState: GameState, player: Player): SkillResult {
    if (!this.canUseSkill(skillId, gameState)) {
      return {
        success: false,
        message: '技能不可用'
      };
    }

    const registration = this.skillRegistry.get(skillId);
    const state = this.skillStates.get(skillId);
    
    if (!registration || !state) {
      return {
        success: false,
        message: '技能不存在'
      };
    }

    // 创建执行上下文
    const context: SkillExecutionContext = {
      gameState,
      player,
      trigger: SkillTrigger.MANUAL,
      skillEngine: this,
      skillState: state
    };

    // 执行技能
    const result = this.executeSkill(registration.skill, context);

    // 更新技能状态
    if (result.success) {
      this.updateSkillUsage(skillId);
    }

    return result;
  }

  /**
   * 触发技能（被动触发）
   */
  triggerSkills(trigger: SkillTrigger, gameState: GameState, context?: Partial<GameContext>): SkillResult[] {
    const results: SkillResult[] = [];
    const triggeredSkills: SkillRegistration[] = [];

    // 收集所有可触发的技能
    for (const [skillId, registration] of this.skillRegistry) {
      if (registration.triggers.includes(trigger)) {
        const state = this.skillStates.get(skillId);
        if (state && this.canTriggerSkill(registration.skill, state, gameState)) {
          triggeredSkills.push(registration);
        }
      }
    }

    // 按优先级排序
    triggeredSkills.sort((a, b) => b.priority - a.priority);

    // 执行技能
    for (const registration of triggeredSkills) {
      const state = this.skillStates.get(registration.skill.id)!;
      const executionContext: SkillExecutionContext = {
        gameState,
        trigger,
        skillEngine: this,
        skillState: state,
        ...context
      };

      const result = this.executeSkill(registration.skill, executionContext);
      results.push(result);

      // 如果技能执行成功，更新状态
      if (result.success) {
        this.updateSkillUsage(registration.skill.id);
      }

      // 如果技能修改了游戏状态，更新上下文中的游戏状态
      if (result.gameStateChanges) {
        Object.assign(gameState, result.gameStateChanges);
      }
    }

    return results;
  }

  /**
   * 检查技能是否可以被触发（被动技能）
   */
  private canTriggerSkill(skill: Skill, state: SkillState, gameState: GameState): boolean {
    // 被动技能和锁定技可以自动触发
    if (skill.type === SkillType.PASSIVE) {
      return true;
    }

    // 觉醒技需要已觉醒
    if (skill.type === SkillType.AWAKENING && !state.isAwakened) {
      return false;
    }

    // 其他检查与canUseSkill相同
    return this.canUseSkill(skill.id, gameState);
  }

  /**
   * 执行技能
   */
  private executeSkill(skill: Skill, context: SkillExecutionContext): SkillResult {
    try {
      return skill.execute(context);
    } catch (error) {
      console.error(`技能执行错误: ${skill.id}`, error);
      return {
        success: false,
        message: `技能执行失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 更新技能使用状态
   */
  private updateSkillUsage(skillId: string): void {
    const state = this.skillStates.get(skillId);
    if (!state) return;

    const registration = this.skillRegistry.get(skillId);
    if (!registration) return;

    const skill = registration.skill;

    // 更新使用状态
    const updates: Partial<SkillState> = {
      usageCount: state.usageCount + 1,
      lastUsedTurn: this.currentTurn
    };

    // 限定技标记为已使用
    if (skill.type === SkillType.LIMITED) {
      updates.isUsed = true;
    }

    this.updateSkillState(skillId, updates);
  }

  /**
   * 觉醒技能
   */
  awakenSkill(skillId: string): boolean {
    const state = this.skillStates.get(skillId);
    const registration = this.skillRegistry.get(skillId);
    
    if (!state || !registration) {
      return false;
    }

    if (registration.skill.type !== SkillType.AWAKENING) {
      return false;
    }

    if (state.isAwakened) {
      return false; // 已经觉醒
    }

    this.updateSkillState(skillId, { isAwakened: true });
    return true;
  }

  /**
   * 重置技能状态（新游戏时使用）
   */
  resetSkillStates(): void {
    for (const [_skillId, registration] of this.skillRegistry) {
      this.initializeSkillState(registration.skill);
    }
    this.currentTurn = 0;
  }

  /**
   * 重置特定玩家的技能状态
   */
  resetPlayerSkillStates(player: Player): void {
    for (const skill of player.hero.skills) {
      this.initializeSkillState(skill);
    }
  }

  /**
   * 更新回合数
   */
  updateTurn(turn: number): void {
    this.currentTurn = turn;
  }

  /**
   * 获取玩家的可用技能
   */
  getAvailableSkills(player: Player, gameState: GameState): Skill[] {
    return player.hero.skills.filter(skill => this.canUseSkill(skill.id, gameState));
  }

  /**
   * 获取玩家的所有技能状态
   */
  getPlayerSkillStates(player: Player): SkillState[] {
    return player.hero.skills
      .map(skill => this.getSkillState(skill.id))
      .filter((state): state is SkillState => state !== undefined);
  }

  /**
   * 注册玩家的所有技能
   */
  registerPlayerSkills(player: Player): void {
    for (const skill of player.hero.skills) {
      // 根据技能类型确定触发时机
      const triggers = this.getSkillTriggers(skill);
      this.registerSkill(skill, triggers);
    }
  }

  /**
   * 根据技能类型获取默认触发时机
   */
  private getSkillTriggers(skill: Skill): SkillTrigger[] {
    switch (skill.type) {
      case SkillType.PASSIVE:
        // 被动技能可能在多个时机触发，具体由技能实现决定
        return [SkillTrigger.BEFORE_MOVE, SkillTrigger.AFTER_MOVE];
      
      case SkillType.ACTIVE:
        // 主动技能只能手动触发
        return [SkillTrigger.MANUAL];
      
      case SkillType.LIMITED:
        // 限定技通常是主动技能
        return [SkillTrigger.MANUAL];
      
      case SkillType.AWAKENING:
        // 觉醒技可能是主动或被动
        return [SkillTrigger.MANUAL];
      
      default:
        return [SkillTrigger.MANUAL];
    }
  }

  /**
   * 检查技能冲突
   */
  checkSkillConflicts(skillIds: string[]): string[] {
    const conflicts: string[] = [];
    
    // 简单的冲突检查逻辑
    // 实际实现中可能需要更复杂的冲突检测
    for (let i = 0; i < skillIds.length; i++) {
      for (let j = i + 1; j < skillIds.length; j++) {
        const skill1 = this.skillRegistry.get(skillIds[i]);
        const skill2 = this.skillRegistry.get(skillIds[j]);
        
        if (skill1 && skill2) {
          // 检查是否有相同的触发时机和高优先级
          const commonTriggers = skill1.triggers.filter(t => skill2.triggers.includes(t));
          if (commonTriggers.length > 0 && Math.abs(skill1.priority - skill2.priority) < 1) {
            conflicts.push(`技能 ${skill1.skill.name} 和 ${skill2.skill.name} 可能存在冲突`);
          }
        }
      }
    }
    
    return conflicts;
  }

  /**
   * 获取技能统计信息
   */
  getSkillStatistics(): Record<string, any> {
    const stats = {
      totalSkills: this.skillRegistry.size,
      usedSkills: 0,
      awakenedSkills: 0,
      availableSkills: 0
    };

    for (const state of this.skillStates.values()) {
      if (state.usageCount > 0) {
        stats.usedSkills++;
      }
      if (state.isAwakened) {
        stats.awakenedSkills++;
      }
    }

    return stats;
  }
}

/**
 * 全局技能引擎实例
 */
export const globalSkillEngine = new SkillEngine();