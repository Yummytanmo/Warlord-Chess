/**
 * 移动规则定义
 * 包含所有可被技能修改的规则开关
 */
export interface MoveRules {
    // 马的规则
    horse: {
        ignoreLegBlock: boolean;       // 是否忽略拌马腿 (霸王)
        limitConsecutiveJumps: boolean; // 是否限制连续跳马 (霸王)
    };
    // 将的规则
    king: {
        canLeavePalace: boolean;       // 是否可以出九宫 (更衣)
    };
    // 士的规则
    advisor: {
        canLeavePalace: boolean;       // 是否可以出九宫 (鸿门)
        canCrossRiver: boolean;        // 是否可以过河 (鸿门限制)
    };
    // 象的规则
    elephant: {
        ignoreHeartBlock: boolean;     // 是否忽略象心 (鸿门)
        canCrossRiver: boolean;        // 是否可以过河
    };
    // 兵的规则
    pawn: {
        canCrossRiverDirectly: boolean; // 是否可以一步过河 (背水)
        canMoveTwoStepsAfterRiver: boolean; // 过河后是否可以走两步 (背水)
    };
}

/**
 * 规则上下文
 * 每个玩家拥有独立的规则上下文
 */
export interface RuleContext {
    moveRules: MoveRules;
}

/**
 * 默认规则配置
 */
export const DEFAULT_RULES: RuleContext = {
    moveRules: {
        horse: { ignoreLegBlock: false, limitConsecutiveJumps: false },
        king: { canLeavePalace: false },
        advisor: { canLeavePalace: false, canCrossRiver: false },
        elephant: { ignoreHeartBlock: false, canCrossRiver: false },
        pawn: { canCrossRiverDirectly: false, canMoveTwoStepsAfterRiver: false }
    }
};

/**
 * 创建默认规则上下文的深拷贝
 */
export const createDefaultRuleContext = (): RuleContext => {
    return JSON.parse(JSON.stringify(DEFAULT_RULES));
};
