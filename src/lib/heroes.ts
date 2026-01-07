import {
  Hero,
  Skill,
  SkillType,
  GameContext,
  SkillResult,
  PieceType,
  PlayerColor,
  Position,
  GameState
} from '@/types/game';
import { RuleContext } from '@/types/rules';
import { SkillExecutionContext } from './skillEngine';

// 基础技能实现类
export abstract class BaseSkill implements Skill {
  abstract id: string;
  abstract name: string;
  abstract type: SkillType;
  abstract description: string;
  isUsed: boolean = false;

  abstract canUse(): boolean;
  abstract execute(context: GameContext): SkillResult;


  /**
   * 检查技能是否可以在当前上下文中使用
   */
  protected canUseInContext(context: GameContext): boolean {
    // 基础检查：游戏必须在进行中
    if (!context.gameState || context.gameState.gamePhase !== 'playing') {
      return false;
    }

    // 限定技检查
    if (this.type === SkillType.LIMITED && this.isUsed) {
      return false;
    }

    return true;
  }

  /**
   * 获取当前玩家
   */
  protected getCurrentPlayer(context: GameContext): any {
    if (!context.gameState || !context.player) return null;
    return context.gameState.players.find(p => p.id === context.player!.id);
  }

  /**
   * 获取对手玩家
   */
  protected getOpponentPlayer(context: GameContext): any {
    if (!context.gameState || !context.player) return null;
    return context.gameState.players.find(p => p.id !== context.player!.id);
  }

  /**
   * 检查棋子是否属于当前玩家
   */
  protected isOwnPiece(piece: any, context: GameContext): boolean {
    return !!(context.player && piece.color === context.player.color);
  }

  /**
   * 检查位置是否在九宫内
   */
  protected isInPalace(position: any, color: PlayerColor): boolean {
    if (color === PlayerColor.RED) {
      return position.x >= 3 && position.x <= 5 && position.y >= 7 && position.y <= 9;
    } else {
      return position.x >= 3 && position.x <= 5 && position.y >= 0 && position.y <= 2;
    }
  }

  /**
   * 检查棋子是否过河
   */
  protected hasCrossedRiver(piece: any): boolean {
    if (piece.color === PlayerColor.RED) {
      return piece.position.y < 5;
    } else {
      return piece.position.y > 4;
    }
  }

  // 默认不修改规则
  applyRules(_context: RuleContext): void { }
}

/**
 * 被动技能基类
 * 特点：不可点击，自动应用规则
 */
export abstract class PassiveSkill extends BaseSkill {
  type = SkillType.PASSIVE;

  // 被动技能通常不需要手动执行，如果被调用则返回不适用
  execute(_context: GameContext): SkillResult {
    return { success: true, message: '技能不适用' };
  }

  // 被动技能必须实现规则应用逻辑
  abstract applyRules(context: RuleContext): void;
}

/**
 * 主动技能基类
 * 特点：需要手动触发
 */
export abstract class ActiveSkill extends BaseSkill {
  type = SkillType.ACTIVE;

  // 主动技能默认不修改规则，除非是状态类技能
  applyRules(_context: RuleContext): void { }
}

/**
 * 限定技基类
 * 特点：每局只能使用一次
 */
export abstract class LimitedSkill extends ActiveSkill {
  type = SkillType.LIMITED;
  isUsed = false;

  canUse(): boolean {
    return !this.isUsed;
  }
}

// 项羽技能实现
class BeishuiSkill extends PassiveSkill {
  id = 'xiangyu_beishui';
  name = '背水';
  type = SkillType.PASSIVE;
  description = '你的兵未过河时，可以一步直接过河；过河后，每次移动可以连走两步，但最多前进一步。';

  applyRules(context: RuleContext): void {
    context.moveRules.pawn.canCrossRiverDirectly = true;
    context.moveRules.pawn.canMoveTwoStepsAfterRiver = true;
  }

  canUse(): boolean {
    return true; // 被动技能始终可用
  }


}

class BawangSkill extends PassiveSkill {
  id = 'xiangyu_bawang';
  name = '霸王';
  type = SkillType.PASSIVE;
  description = '你的马移动时，不受拌马腿影响（除非马受攻击）；你不能连续两步都选择跳马。';

  applyRules(context: RuleContext): void {
    context.moveRules.horse.ignoreLegBlock = true;
    context.moveRules.horse.limitConsecutiveJumps = true;
  }

  canUse(): boolean {
    return true;
  }


}

// 刘邦技能实现
class GenyiSkill extends PassiveSkill {
  id = 'liubang_genyi';
  name = '更衣';
  type = SkillType.PASSIVE;
  description = '你的将可以出九宫。';

  applyRules(context: RuleContext): void {
    context.moveRules.king.canLeavePalace = true;
  }

  canUse(): boolean {
    return true; // 被动技能始终可用
  }


}

class QinzhengSkill extends BaseSkill {
  id = 'liubang_qinzheng';
  name = '亲征';
  type = SkillType.LIMITED;
  description = '限定技，出牌阶段，你可以强制对方将与你的将在同一条线上，移除移动路径上的阻挡。';

  canUse(): boolean {
    return !this.isUsed; // 限定技只能使用一次
  }

  execute(context: GameContext): SkillResult {
    // 优先检查限定技是否已使用，使用更明确的错误消息
    if (this.isUsed) {
      return { success: false, message: '亲征技能已使用' };
    }

    if (!this.canUseInContext(context)) {
      return { success: false, message: '技能不可用' };
    }

    const gameState = context.gameState!;
    const currentPlayer = this.getCurrentPlayer(context);
    const opponentPlayer = this.getOpponentPlayer(context);

    if (!currentPlayer || !opponentPlayer) {
      return { success: false, message: '无法获取玩家信息' };
    }

    // 找到双方的将
    const myKing = currentPlayer.pieces.find((p: any) => p.type === PieceType.KING && p.isAlive);
    const opponentKing = opponentPlayer.pieces.find((p: any) => p.type === PieceType.KING && p.isAlive);

    if (!myKing || !opponentKing) {
      return { success: false, message: '无法找到将' };
    }

    // 检查是否已经在同一条线上
    if (this.isOnSameLine(myKing.position, opponentKing.position)) {
      return { success: false, message: '双方将已在同一条线上' };
    }

    // 标记技能已使用
    this.isUsed = true;

    // 需求 4.2: 刘邦使用亲征技能时，游戏系统应当强制对方将与己方将在同一条线上
    // 需求 4.3: 亲征技能触发时，游戏系统应当移除移动路径上的阻挡棋子
    const alignmentResult = this.forceKingAlignment(myKing, opponentKing, gameState);

    if (!alignmentResult.success) {
      // 如果对齐失败，恢复技能使用状态
      this.isUsed = false;
      return alignmentResult;
    }

    return {
      success: true,
      message: '亲征技能使用：强制对方将与己方将对齐并清除路径',
      gameStateChanges: alignmentResult.gameStateChanges
    };
  }

  /**
   * 强制对方将与己方将在同一条线上
   * 需求 4.2, 4.3: 强制对齐和路径清理逻辑
   */
  private forceKingAlignment(myKing: any, opponentKing: any, gameState: GameState): SkillResult {
    const myKingPos = myKing.position;
    const opponentKingPos = opponentKing.position;

    // 确定对齐方向：优先选择距离最短的对齐方式
    const horizontalDistance = Math.abs(opponentKingPos.x - myKingPos.x);
    const verticalDistance = Math.abs(opponentKingPos.y - myKingPos.y);

    let targetPosition: Position;
    let pathPositions: Position[] = [];

    if (horizontalDistance <= verticalDistance) {
      // 水平对齐：将对方将移动到与己方将同一行
      targetPosition = { x: myKingPos.x, y: opponentKingPos.y };

      // 计算水平路径上的位置
      const startX = Math.min(myKingPos.x, targetPosition.x);
      const endX = Math.max(myKingPos.x, targetPosition.x);

      for (let x = startX + 1; x < endX; x++) {
        pathPositions.push({ x, y: myKingPos.y });
      }
    } else {
      // 垂直对齐：将对方将移动到与己方将同一列
      targetPosition = { x: opponentKingPos.x, y: myKingPos.y };

      // 计算垂直路径上的位置
      const startY = Math.min(myKingPos.y, targetPosition.y);
      const endY = Math.max(myKingPos.y, targetPosition.y);

      for (let y = startY + 1; y < endY; y++) {
        pathPositions.push({ x: myKingPos.x, y });
      }
    }

    // 检查目标位置是否有效
    if (!gameState.board.isValidPosition(targetPosition)) {
      return { success: false, message: '亲征技能：无法找到有效的对齐位置' };
    }

    // 检查目标位置是否在对方九宫内
    if (!gameState.board.isInPalace(targetPosition, opponentKing.color)) {
      return { success: false, message: '亲征技能：对方将必须留在九宫内' };
    }

    // 检查目标位置是否被己方棋子占据
    const pieceAtTarget = gameState.board.getPiece(targetPosition);
    if (pieceAtTarget && pieceAtTarget.color === myKing.color) {
      return { success: false, message: '亲征技能：目标位置被己方棋子占据' };
    }

    // 收集路径上需要移除的棋子
    const piecesToRemove: any[] = [];
    for (const pathPos of pathPositions) {
      const pieceAtPath = gameState.board.getPiece(pathPos);
      if (pieceAtPath) {
        piecesToRemove.push(pieceAtPath);
      }
    }

    // 如果目标位置有对方棋子，也需要移除
    if (pieceAtTarget && pieceAtTarget.color !== myKing.color) {
      piecesToRemove.push(pieceAtTarget);
    }

    // 创建游戏状态变化
    const gameStateChanges = {
      // 移动对方将到目标位置
      opponentKingPosition: targetPosition,
      // 移除路径上的阻挡棋子
      removedPieces: piecesToRemove.map(piece => ({
        id: piece.id,
        position: piece.position,
        type: piece.type,
        color: piece.color
      })),
      // 清除路径位置
      clearedPositions: [...pathPositions, ...(pieceAtTarget ? [targetPosition] : [])]
    };

    return {
      success: true,
      message: `亲征技能：对方将移动到(${targetPosition.x},${targetPosition.y})，移除${piecesToRemove.length}个阻挡棋子`,
      gameStateChanges
    };
  }

  /**
   * 检查两个位置是否在同一条线上
   */
  private isOnSameLine(pos1: Position, pos2: Position): boolean {
    return pos1.x === pos2.x || pos1.y === pos2.y;
  }

  /**
   * 计算两个位置之间的曼哈顿距离
   */
  // private getManhattanDistance(pos1: Position, pos2: Position): number {
  //   return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  // }

  /**
   * 获取对齐后的最佳位置
   */
  private getBestAlignmentPosition(myKingPos: Position, opponentKingPos: Position, gameState: GameState): Position | null {
    // 尝试水平对齐
    const horizontalTarget = { x: myKingPos.x, y: opponentKingPos.y };
    if (gameState.board.isValidPosition(horizontalTarget) &&
      gameState.board.isInPalace(horizontalTarget, opponentKingPos.x > 4 ? PlayerColor.BLACK : PlayerColor.RED)) {
      return horizontalTarget;
    }

    // 尝试垂直对齐
    const verticalTarget = { x: opponentKingPos.x, y: myKingPos.y };
    if (gameState.board.isValidPosition(verticalTarget) &&
      gameState.board.isInPalace(verticalTarget, opponentKingPos.x > 4 ? PlayerColor.BLACK : PlayerColor.RED)) {
      return verticalTarget;
    }

    return null;
  }

  /**
   * 检查亲征技能是否可以使用
   */
  canUseQinzheng(gameState: GameState, player: any): boolean {
    if (this.isUsed) {
      return false;
    }

    // 检查是否有双方的将
    const currentPlayerPieces = player.pieces;
    const opponentPlayer = gameState.players.find((p: any) => p.id !== player.id);

    if (!opponentPlayer) {
      return false;
    }

    const myKing = currentPlayerPieces.find((p: any) => p.type === PieceType.KING && p.isAlive);
    const opponentKing = opponentPlayer.pieces.find((p: any) => p.type === PieceType.KING && p.isAlive);

    if (!myKing || !opponentKing) {
      return false;
    }

    // 检查是否已经在同一条线上
    if (this.isOnSameLine(myKing.position, opponentKing.position)) {
      return false; // 已经对齐，无需使用技能
    }

    // 检查是否有有效的对齐位置
    return this.getBestAlignmentPosition(myKing.position, opponentKing.position, gameState) !== null;
  }
}

class HongmenSkill extends PassiveSkill {
  id = 'liubang_hongmen';
  name = '鸿门';
  type = SkillType.PASSIVE;
  description = '你的士可以出九宫，但不能过河；你的象不受象心限制。';

  applyRules(context: RuleContext): void {
    context.moveRules.advisor.canLeavePalace = true;
    context.moveRules.elephant.ignoreHeartBlock = true;
  }

  canUse(): boolean {
    return true; // 被动技能始终可用
  }


}

// 韩信技能实现
class DianbingSkill extends BaseSkill {
  id = 'hanxin_dianbing';
  name = '点兵';
  type = SkillType.PASSIVE;
  description = '游戏开始时，移除你的所有兵，你获得两个"兵"标记。回合开始时，你可以消耗一个"兵"标记，在你的河内放置一个兵。';

  canUse(): boolean {
    return true;
  }

  execute(context: GameContext): SkillResult {
    console.log('点兵技能触发', context);
    return { success: true, message: '点兵技能触发' };
  }
}

class YongbingSkill extends BaseSkill {
  id = 'hanxin_yongbing';
  name = '用兵';
  type = SkillType.ACTIVE;
  description = '出牌阶段，你可以令你的任意一个棋子与一个兵交换位置。';

  canUse(): boolean {
    return true;
  }

  execute(context: GameContext): SkillResult {
    console.log('用兵技能使用', context);
    return { success: true, message: '用兵技能使用' };
  }
}

class YishanSkill extends BaseSkill {
  id = 'hanxin_yishan';
  name = '益善';
  type = SkillType.PASSIVE;
  description = '当场上有能过河的棋子被移除时，你获得一个"兵"标记。当你拥有五个"兵"标记时，清除卒林线上所有棋子，放置五个兵。';

  canUse(): boolean {
    return true;
  }

  execute(context: GameContext): SkillResult {
    console.log('益善技能触发', context);
    return { success: true, message: '益善技能触发' };
  }
}

// 萧何技能实现
class YuexiaSkill extends BaseSkill {
  id = 'xiaohe_yuexia';
  name = '月下';
  type = SkillType.ACTIVE;
  description = '出牌阶段，你可以指定一个在场棋子与一个已离场棋子，令其在下回合回到开局位置。';

  canUse(): boolean {
    return true;
  }

  execute(context: GameContext): SkillResult {
    console.log('月下技能使用', context);
    return { success: true, message: '月下技能使用' };
  }
}

class ChengyeSkill extends BaseSkill {
  id = 'xiaohe_chengye';
  name = '成也';
  type = SkillType.AWAKENING;
  description = '觉醒技，当你使用【月下】后，你的月下棋子吃子后可以继续走一步。';

  canUse(): boolean {
    // 觉醒技需要特定条件才能使用
    return true;
  }

  execute(context: GameContext): SkillResult {
    if (!this.canUseInContext(context)) {
      return { success: false, message: '技能不可用' };
    }

    // 检查是否满足觉醒条件（使用过月下技能）
    const skillContext = context as SkillExecutionContext;
    const yuexiaState = skillContext.skillEngine?.getSkillState('xiaohe_yuexia');

    if (!yuexiaState || yuexiaState.usageCount === 0) {
      return { success: false, message: '需要先使用月下技能才能觉醒' };
    }

    // 觉醒技能
    if (skillContext.skillEngine) {
      skillContext.skillEngine.awakenSkill(this.id);
    }

    return {
      success: true,
      message: '成也技能觉醒：月下棋子吃子后可继续移动',
      gameStateChanges: {
        // 标记玩家已觉醒
      }
    };
  }
}

class BaiyeSkill extends BaseSkill {
  id = 'xiaohe_baiye';
  name = '败也';
  type = SkillType.PASSIVE;
  description = '你移动将后，须再移动一步将。';

  canUse(): boolean {
    return true;
  }

  execute(context: GameContext): SkillResult {
    console.log('败也技能触发', context);
    return { success: true, message: '败也技能触发' };
  }
}

// 张良技能实现
class YunchouSkill extends BaseSkill {
  id = 'zhangliang_yunchou';
  name = '运筹';
  type = SkillType.PASSIVE;
  description = '你移动将后，可以再移动除车以外的一个己方棋子。';

  canUse(): boolean {
    return true;
  }

  execute(context: GameContext): SkillResult {
    console.log('运筹技能触发', context);
    return { success: true, message: '运筹技能触发' };
  }
}

class JueshengSkill extends BaseSkill {
  id = 'zhangliang_juesheng';
  name = '决胜';
  type = SkillType.LIMITED;
  description = '限定技，当你第一次被叫将后，你可以连续移动两次将。';

  canUse(): boolean {
    return !this.isUsed;
  }

  execute(context: GameContext): SkillResult {
    this.isUsed = true;
    console.log('决胜技能使用', context);
    return { success: true, message: '决胜技能使用' };
  }
}

class ShilvSkill extends BaseSkill {
  id = 'zhangliang_shilv';
  name = '拾履';
  type = SkillType.AWAKENING;
  description = '觉醒技，当你的将第一次吃子后，你可以选择同名棋子增加在九宫内任意位置。';

  canUse(): boolean {
    return true;
  }

  execute(context: GameContext): SkillResult {
    console.log('拾履技能觉醒', context);
    return { success: true, message: '拾履技能觉醒' };
  }
}

// 樊哙技能实现
class WujianSkill extends BaseSkill {
  id = 'fankuai_wujian';
  name = '舞剑';
  type = SkillType.LIMITED;
  description = '限定技，出牌阶段，你可以令你的一个同名棋子与对方一个棋子相互击杀。';

  canUse(): boolean {
    return !this.isUsed;
  }

  execute(context: GameContext): SkillResult {
    this.isUsed = true;
    console.log('舞剑技能使用', context);
    return { success: true, message: '舞剑技能使用' };
  }
}

class HuzhuSkill extends BaseSkill {
  id = 'fankuai_huzhu';
  name = '护主';
  type = SkillType.LIMITED;
  description = '限定技，当你的将被移走时，将其退回上一步位置，将攻击将的棋子回到初始位置。';

  canUse(): boolean {
    return !this.isUsed;
  }

  execute(context: GameContext): SkillResult {
    this.isUsed = true;
    console.log('护主技能使用', context);
    return { success: true, message: '护主技能使用' };
  }
}

class CijueSkill extends BaseSkill {
  id = 'fankuai_cijue';
  name = '赐爵';
  type = SkillType.AWAKENING;
  description = '觉醒技，当你的两个限定技都使用后，你可以将被移除的棋子添加在棋盘任何位置。';

  canUse(): boolean {
    return true;
  }

  execute(context: GameContext): SkillResult {
    console.log('赐爵技能觉醒', context);
    return { success: true, message: '赐爵技能觉醒' };
  }
}

// Hero类实现
export class HeroClass implements Hero {
  id: string;
  name: string;
  skills: Skill[];
  awakened: boolean = false;
  avatar?: string;
  description?: string;

  constructor(id: string, name: string, skills: Skill[], avatar?: string, description?: string) {
    this.id = id;
    this.name = name;
    this.skills = skills;
    this.avatar = avatar;
    this.description = description;
  }

  // 获取可用技能
  getAvailableSkills(): Skill[] {
    return this.skills.filter(skill => skill.canUse());
  }

  // 使用技能
  useSkill(skillId: string, context: GameContext): SkillResult {
    const skill = this.skills.find(s => s.id === skillId);
    if (!skill) {
      return { success: false, message: '技能不存在' };
    }

    if (!skill.canUse()) {
      return { success: false, message: '技能不可用' };
    }

    return skill.execute(context);
  }

  // 觉醒武将
  awaken(): void {
    this.awakened = true;
  }

  // 重置技能状态（新游戏时使用）
  resetSkills(): void {
    this.skills.forEach(skill => {
      if (skill instanceof BaseSkill) {
        skill.isUsed = false;
      }
    });
    this.awakened = false;
  }
}

// 预定义的武将数据
export const AVAILABLE_HEROES: HeroClass[] = [
  new HeroClass(
    'xiangyu',
    '项羽',
    [new BeishuiSkill(), new BawangSkill()],
    '/heroes/xiangyu.jpg',
    '西楚霸王，力拔山兮气盖世。拥有强大的兵种和马匹优势。'
  ),
  new HeroClass(
    'liubang',
    '刘邦',
    [new GenyiSkill(), new QinzhengSkill(), new HongmenSkill()],
    '/heroes/liubang.jpg',
    '汉高祖，善于运用计谋和灵活战术。将、士、象具有特殊能力。'
  ),
  new HeroClass(
    'hanxin',
    '韩信',
    [new DianbingSkill(), new YongbingSkill(), new YishanSkill()],
    '/heroes/hanxin.jpg',
    '兵仙，多多益善。通过兵标记系统获得战略优势。'
  ),
  new HeroClass(
    'xiaohe',
    '萧何',
    [new YuexiaSkill(), new ChengyeSkill(), new BaiyeSkill()],
    '/heroes/xiaohe.jpg',
    '汉初三杰之一，擅长复活和重置战术。'
  ),
  new HeroClass(
    'zhangliang',
    '张良',
    [new YunchouSkill(), new JueshengSkill(), new ShilvSkill()],
    '/heroes/zhangliang.jpg',
    '谋圣，运筹帷幄之中，决胜千里之外。拥有灵活的棋子控制能力。'
  ),
  new HeroClass(
    'fankuai',
    '樊哙',
    [new WujianSkill(), new HuzhuSkill(), new CijueSkill()],
    '/heroes/fankuai.jpg',
    '忠勇之将，善于保护主公和获得额外棋子。'
  )
];

// 根据ID获取武将
export function getHeroById(id: string): HeroClass | undefined {
  return AVAILABLE_HEROES.find(hero => hero.id === id);
}

// 获取所有可用武将
export function getAllHeroes(): HeroClass[] {
  return [...AVAILABLE_HEROES];
}

// 创建武将的深拷贝（用于游戏中）
export function createHeroCopy(hero: HeroClass): HeroClass {
  const newSkills = hero.skills.map(skill => {
    // 使用 Object.create 保留原型链，避免构造函数副作用
    const newSkill = Object.create(Object.getPrototypeOf(skill));
    // 复制实例属性
    Object.assign(newSkill, skill);
    return newSkill;
  });

  return new HeroClass(hero.id, hero.name, newSkills, hero.avatar, hero.description);
}