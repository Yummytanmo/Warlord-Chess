import { Hero, Skill, SkillType, GameContext, SkillResult, PieceType, PlayerColor } from '@/types/game';
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
    return context.player && piece.color === context.player.color;
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
}

// 项羽技能实现
class BeishuiSkill extends BaseSkill {
  id = 'xiangyu_beishui';
  name = '背水';
  type = SkillType.PASSIVE;
  description = '你的兵未过河时，可以一步直接过河；过河后，每次移动可以连走两步，但最多前进一步。';

  canUse(): boolean {
    return true; // 被动技能始终可用
  }

  execute(context: GameContext): SkillResult {
    if (!this.canUseInContext(context)) {
      return { success: false, message: '技能不可用' };
    }

    const { piece, move } = context;
    if (!piece || !move || piece.type !== PieceType.PAWN) {
      return { success: false, message: '只能对兵使用背水技能' };
    }

    if (!this.isOwnPiece(piece, context)) {
      return { success: false, message: '只能对己方兵使用' };
    }

    // 检查是否未过河
    if (!this.hasCrossedRiver(piece)) {
      // 允许一步过河
      const riverY = piece.color === PlayerColor.RED ? 4 : 5;
      if (move.to.y === riverY && move.to.x === piece.position.x) {
        return { 
          success: true, 
          message: '背水技能：兵一步过河',
          modifiedMove: move
        };
      }
    } else {
      // 过河后的特殊移动规则
      return { 
        success: true, 
        message: '背水技能：过河兵可连走两步',
        modifiedMove: move
      };
    }

    return { success: false, message: '背水技能条件不满足' };
  }
}

class BawangSkill extends BaseSkill {
  id = 'xiangyu_bawang';
  name = '霸王';
  type = SkillType.PASSIVE;
  description = '你的马移动时，不受拌马腿影响（除非马受攻击）；你不能连续两步都选择跳马。';

  canUse(): boolean {
    return true;
  }

  execute(context: GameContext): SkillResult {
    if (!this.canUseInContext(context)) {
      return { success: false, message: '技能不可用' };
    }

    const { piece, move } = context;
    if (!piece || !move || piece.type !== PieceType.HORSE) {
      return { success: false, message: '只能对马使用霸王技能' };
    }

    if (!this.isOwnPiece(piece, context)) {
      return { success: false, message: '只能对己方马使用' };
    }

    // 检查是否连续跳马
    const gameState = context.gameState!;
    const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
    if (lastMove && lastMove.piece.type === PieceType.HORSE && 
        lastMove.piece.color === piece.color) {
      return { success: false, message: '不能连续两步都跳马' };
    }

    return { 
      success: true, 
      message: '霸王技能：马不受拌马腿影响',
      modifiedMove: move
    };
  }
}

// 刘邦技能实现
class GenyiSkill extends BaseSkill {
  id = 'liubang_genyi';
  name = '更衣';
  type = SkillType.PASSIVE;
  description = '你的将可以出九宫。';

  canUse(): boolean {
    return true;
  }

  execute(context: GameContext): SkillResult {
    console.log('更衣技能触发', context);
    return { success: true, message: '更衣技能触发' };
  }
}

class QinzhengSkill extends BaseSkill {
  id = 'liubang_qinzheng';
  name = '亲征';
  type = SkillType.LIMITED;
  description = '限定技，出牌阶段，你可以强制对方将与你的将在同一条线上，移除移动路径上的阻挡。';

  canUse(): boolean {
    return !this.isUsed;
  }

  execute(context: GameContext): SkillResult {
    if (!this.canUseInContext(context)) {
      return { success: false, message: '技能不可用' };
    }

    if (this.isUsed) {
      return { success: false, message: '限定技已使用' };
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

    // 标记技能已使用
    this.isUsed = true;

    // 强制对方将与己方将在同一条线上的逻辑
    // 这里返回游戏状态变化，实际的移动逻辑由游戏引擎处理
    const gameStateChanges = {
      // 这里应该包含强制对齐和清除路径的逻辑
      // 实际实现需要更复杂的棋盘操作
    };

    return { 
      success: true, 
      message: '亲征技能使用：强制对方将与己方将对齐',
      gameStateChanges
    };
  }
}

class HongmenSkill extends BaseSkill {
  id = 'liubang_hongmen';
  name = '鸿门';
  type = SkillType.PASSIVE;
  description = '你的士可以出九宫，但不能过河；你的象不受象心限制。';

  canUse(): boolean {
    return true;
  }

  execute(context: GameContext): SkillResult {
    console.log('鸿门技能触发', context);
    return { success: true, message: '鸿门技能触发' };
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
    // 创建技能的新实例
    const SkillConstructor = skill.constructor as new () => BaseSkill;
    return new SkillConstructor();
  });
  
  return new HeroClass(hero.id, hero.name, newSkills, hero.avatar, hero.description);
}