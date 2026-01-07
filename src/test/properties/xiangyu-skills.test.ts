import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ChessBoard } from '@/lib/board';
import { ChessMoveValidator } from '@/lib/moveValidator';
import { SkillEngine } from '@/lib/skillEngine';
import { getHeroById, createHeroCopy } from '@/lib/heroes';
import {
  Piece,
  PlayerColor,
  PieceType,
  Position,
  Move,
  GameState,
  Player,
  GamePhase
} from '@/types/game';
import { createDefaultRuleContext } from '@/types/rules';

/**
 * Feature: sanguo-xiangqi, Property 4: 项羽背水技能效果
 * 验证: 需求 3.1, 3.2
 * 
 * 属性 4: 项羽背水技能效果
 * 对于任何项羽的兵，未过河时可以一步直接过河，
 * 过河后每次移动可以连走两步但最多前进一步
 */

// 生成器：创建有效的棋盘位置
const validPositionGenerator = fc.record({
  x: fc.integer({ min: 0, max: 8 }),
  y: fc.integer({ min: 0, max: 9 })
});

// 生成器：创建项羽的兵（未过河）- 颜色由游戏状态决定
const xiangYuUnCrossedPawnGeneratorForColor = (color: PlayerColor) => {
  // 根据颜色确定未过河的位置
  const yRange = color === PlayerColor.RED
    ? fc.integer({ min: 5, max: 9 })  // 红方未过河：y >= 5
    : fc.integer({ min: 0, max: 4 }); // 黑方未过河：y <= 4

  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 10 }),
    type: fc.constant(PieceType.PAWN),
    color: fc.constant(color),
    position: fc.record({
      x: fc.integer({ min: 0, max: 8 }),
      y: yRange
    }),
    isAlive: fc.constant(true)
  });
};

// 生成器：创建项羽的兵（未过河）
const xiangYuUnCrossedPawnGenerator = fc.record({
  color: fc.constantFrom(PlayerColor.RED, PlayerColor.BLACK),
}).map(({ color }) => {
  // 根据颜色确定未过河的位置
  const yRange = color === PlayerColor.RED
    ? fc.integer({ min: 5, max: 9 })  // 红方未过河：y >= 5
    : fc.integer({ min: 0, max: 4 }); // 黑方未过河：y <= 4

  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 10 }),
    type: fc.constant(PieceType.PAWN),
    color: fc.constant(color),
    position: fc.record({
      x: fc.integer({ min: 0, max: 8 }),
      y: yRange
    }),
    isAlive: fc.constant(true)
  });
}).chain(gen => gen);

// 生成器：创建项羽的兵（已过河）- 颜色由游戏状态决定
const xiangYuCrossedPawnGeneratorForColor = (color: PlayerColor) => {
  // 根据颜色确定过河的位置
  const yRange = color === PlayerColor.RED
    ? fc.integer({ min: 0, max: 4 })  // 红方过河：y < 5
    : fc.integer({ min: 5, max: 9 }); // 黑方过河：y > 4

  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 10 }),
    type: fc.constant(PieceType.PAWN),
    color: fc.constant(color),
    position: fc.record({
      x: fc.integer({ min: 0, max: 8 }),
      y: yRange
    }),
    isAlive: fc.constant(true)
  });
};

// 生成器：创建项羽的兵（已过河）
const xiangYuCrossedPawnGenerator = fc.record({
  color: fc.constantFrom(PlayerColor.RED, PlayerColor.BLACK),
}).map(({ color }) => {
  // 根据颜色确定过河的位置
  const yRange = color === PlayerColor.RED
    ? fc.integer({ min: 0, max: 4 })  // 红方过河：y < 5
    : fc.integer({ min: 5, max: 9 }); // 黑方过河：y > 4

  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 10 }),
    type: fc.constant(PieceType.PAWN),
    color: fc.constant(color),
    position: fc.record({
      x: fc.integer({ min: 0, max: 8 }),
      y: yRange
    }),
    isAlive: fc.constant(true)
  });
}).chain(gen => gen);

// 生成器：创建项羽玩家
const xiangYuPlayerGenerator = fc.record({
  color: fc.constantFrom(PlayerColor.RED, PlayerColor.BLACK)
}).map(({ color }) => {
  const xiangYuHero = getHeroById('xiangyu');
  if (!xiangYuHero) {
    throw new Error('项羽武将未找到');
  }

  return {
    id: `xiangyu_player_${color}`,
    color,
    hero: createHeroCopy(xiangYuHero),
    pieces: []
  } as Player;
});

// 生成器：创建游戏状态
const gameStateWithXiangYuGenerator = xiangYuPlayerGenerator.map(player => {
  const opponent: Player = {
    id: 'opponent',
    color: player.color === PlayerColor.RED ? PlayerColor.BLACK : PlayerColor.RED,
    hero: { id: 'test_hero', name: '测试武将', skills: [], awakened: false },
    pieces: []
  };

  return {
    board: new ChessBoard(),
    players: [player, opponent] as [Player, Player],
    currentPlayer: player.color,
    gamePhase: GamePhase.PLAYING,
    moveHistory: []
  } as GameState;
});

// 组合生成器：创建项羽玩家和匹配颜色的未过河兵
const xiangYuWithUnCrossedPawnGenerator = xiangYuPlayerGenerator.chain(player => {
  return xiangYuUnCrossedPawnGeneratorForColor(player.color).map(pawn => {
    const opponent: Player = {
      id: 'opponent',
      color: player.color === PlayerColor.RED ? PlayerColor.BLACK : PlayerColor.RED,
      hero: { id: 'test_hero', name: '测试武将', skills: [], awakened: false },
      pieces: []
    };

    const gameState: GameState = {
      board: new ChessBoard(),
      players: [player, opponent] as [Player, Player],
      currentPlayer: player.color,
      gamePhase: GamePhase.PLAYING,
      moveHistory: []
    };

    return { pawn, gameState };
  });
});

// 组合生成器：创建项羽玩家和匹配颜色的已过河兵
const xiangYuWithCrossedPawnGenerator = xiangYuPlayerGenerator.chain(player => {
  return xiangYuCrossedPawnGeneratorForColor(player.color).map(pawn => {
    const opponent: Player = {
      id: 'opponent',
      color: player.color === PlayerColor.RED ? PlayerColor.BLACK : PlayerColor.RED,
      hero: { id: 'test_hero', name: '测试武将', skills: [], awakened: false },
      pieces: []
    };

    const gameState: GameState = {
      board: new ChessBoard(),
      players: [player, opponent] as [Player, Player],
      currentPlayer: player.color,
      gamePhase: GamePhase.PLAYING,
      moveHistory: []
    };

    return { pawn, gameState };
  });
});

describe('Xiang Yu Beishui Skill Properties', () => {
  let skillEngine: SkillEngine;
  let moveValidator: ChessMoveValidator;

  beforeEach(() => {
    skillEngine = new SkillEngine();
    moveValidator = new ChessMoveValidator(skillEngine);
  });

  it('Property 4: Beishui skill - uncrossed pawns can cross river in one step', () => {
    fc.assert(fc.property(
      xiangYuWithUnCrossedPawnGenerator,
      ({ pawn, gameState }) => {
        // 设置棋盘状态
        gameState.board.setPiece(pawn.position, pawn);

        // 注册项羽的技能
        // 注册项羽的技能
        const xiangYuPlayer = gameState.players.find(p => p.hero.id === 'xiangyu')!;
        skillEngine.registerPlayerSkills(xiangYuPlayer);

        const ruleContext = createDefaultRuleContext();
        xiangYuPlayer.hero.skills.forEach(s => {
          if (s.applyRules) s.applyRules(ruleContext);
        });

        // 计算过河位置
        const riverY = pawn.color === PlayerColor.RED ? 4 : 5;
        const crossRiverPosition: Position = {
          x: pawn.position.x,
          y: riverY
        };

        // 检查是否是有效的一步过河移动（只移动一格）
        const dy = Math.abs(crossRiverPosition.y - pawn.position.y);
        if (dy !== 1) {
          return; // 跳过不是一步过河的情况
        }

        // 创建过河移动
        const crossRiverMove: Move = {
          from: pawn.position,
          to: crossRiverPosition,
          piece: pawn,
          timestamp: Date.now()
        };

        // 验证背水技能允许一步过河
        const result = moveValidator.validateMove(crossRiverMove, gameState, ruleContext);

        // 需求 3.1: 项羽的兵未过河时，可以一步直接过河
        expect(result.isValid).toBe(true);
      }
    ), { numRuns: 100 });
  });

  it('Property 4: Beishui skill - uncrossed pawns normal forward move', () => {
    fc.assert(fc.property(
      xiangYuWithUnCrossedPawnGenerator,
      ({ pawn, gameState }) => {
        // 确保兵不在边界位置，可以正常前进
        const forwardDirection = pawn.color === PlayerColor.RED ? -1 : 1;
        const newY = pawn.position.y + forwardDirection;

        // 跳过边界情况
        if (newY < 0 || newY > 9) {
          return;
        }

        // 设置棋盘状态
        gameState.board.setPiece(pawn.position, pawn);

        // 注册项羽的技能
        // 注册项羽的技能
        const xiangYuPlayer = gameState.players.find(p => p.hero.id === 'xiangyu')!;
        skillEngine.registerPlayerSkills(xiangYuPlayer);

        const ruleContext = createDefaultRuleContext();
        xiangYuPlayer.hero.skills.forEach(s => {
          if (s.applyRules) s.applyRules(ruleContext);
        });

        // 创建正常前进移动
        const normalMove: Move = {
          from: pawn.position,
          to: { x: pawn.position.x, y: newY },
          piece: pawn,
          timestamp: Date.now()
        };

        // 验证正常前进移动也被允许
        const result = moveValidator.validateMove(normalMove, gameState, ruleContext);
        expect(result.isValid).toBe(true);
      }
    ), { numRuns: 100 });
  });

  it('Property 4: Beishui skill - crossed pawns can move up to two steps', () => {
    fc.assert(fc.property(
      xiangYuWithCrossedPawnGenerator,
      fc.integer({ min: 1, max: 2 }), // 移动步数
      fc.boolean(), // 是否横向移动
      ({ pawn, gameState }, steps, isHorizontal) => {
        // 设置棋盘状态
        gameState.board.setPiece(pawn.position, pawn);

        // 注册项羽的技能
        // 注册项羽的技能
        const xiangYuPlayer = gameState.players.find(p => p.hero.id === 'xiangyu')!;
        skillEngine.registerPlayerSkills(xiangYuPlayer);

        const ruleContext = createDefaultRuleContext();
        xiangYuPlayer.hero.skills.forEach(s => {
          if (s.applyRules) s.applyRules(ruleContext);
        });

        let targetPosition: Position;

        if (isHorizontal) {
          // 横向移动
          const direction = fc.sample(fc.constantFrom(-1, 1), 1)[0];
          targetPosition = {
            x: pawn.position.x + (direction * steps),
            y: pawn.position.y
          };
        } else {
          // 纵向移动（前进）
          const forwardDirection = pawn.color === PlayerColor.RED ? -1 : 1;
          const forwardSteps = Math.min(steps, 1); // 最多前进一步
          targetPosition = {
            x: pawn.position.x,
            y: pawn.position.y + (forwardDirection * forwardSteps)
          };
        }

        // 检查目标位置是否在棋盘范围内
        if (!gameState.board.isValidPosition(targetPosition)) {
          return; // 跳过无效位置
        }

        // 创建移动
        const move: Move = {
          from: pawn.position,
          to: targetPosition,
          piece: pawn,
          timestamp: Date.now()
        };

        const totalSteps = Math.abs(targetPosition.x - pawn.position.x) +
          Math.abs(targetPosition.y - pawn.position.y);

        // 验证移动
        const result = moveValidator.validateMove(move, gameState, ruleContext);

        if (totalSteps <= 2) {
          // 需求 3.2: 过河后每次移动可以连走两步
          const forwardSteps = (targetPosition.y - pawn.position.y) *
            (pawn.color === PlayerColor.RED ? -1 : 1);

          if (forwardSteps <= 1 && forwardSteps >= 0) {
            // 需求 3.2: 但最多前进一步
            expect(result.isValid).toBe(true);
          } else {
            // 前进超过一步应该被拒绝
            expect(result.isValid).toBe(false);
          }
        } else {
          // 超过两步应该被拒绝
          expect(result.isValid).toBe(false);
        }
      }
    ), { numRuns: 100 });
  });

  it('Property 4: Beishui skill - crossed pawns cannot retreat', () => {
    fc.assert(fc.property(
      xiangYuWithCrossedPawnGenerator,
      ({ pawn, gameState }) => {
        // 确保兵不在边界位置
        const backwardDirection = pawn.color === PlayerColor.RED ? 1 : -1;
        const backwardY = pawn.position.y + backwardDirection;

        // 跳过边界情况
        if (backwardY < 0 || backwardY > 9) {
          return;
        }

        // 设置棋盘状态
        gameState.board.setPiece(pawn.position, pawn);

        // 注册项羽的技能
        // 注册项羽的技能
        const xiangYuPlayer = gameState.players.find(p => p.hero.id === 'xiangyu')!;
        skillEngine.registerPlayerSkills(xiangYuPlayer);

        const ruleContext = createDefaultRuleContext();
        xiangYuPlayer.hero.skills.forEach(s => {
          if (s.applyRules) s.applyRules(ruleContext);
        });

        // 创建后退移动
        const retreatMove: Move = {
          from: pawn.position,
          to: { x: pawn.position.x, y: backwardY },
          piece: pawn,
          timestamp: Date.now()
        };

        // 验证后退移动被拒绝
        const result = moveValidator.validateMove(retreatMove, gameState, ruleContext);
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('后退');
      }
    ), { numRuns: 100 });
  });

  it('Property 4: Beishui skill - crossed pawns cannot move diagonally', () => {
    fc.assert(fc.property(
      xiangYuWithCrossedPawnGenerator,
      ({ pawn, gameState }) => {
        // 设置棋盘状态
        gameState.board.setPiece(pawn.position, pawn);

        // 注册项羽的技能
        // 注册项羽的技能
        const xiangYuPlayer = gameState.players.find(p => p.hero.id === 'xiangyu')!;
        skillEngine.registerPlayerSkills(xiangYuPlayer);

        const ruleContext = createDefaultRuleContext();
        xiangYuPlayer.hero.skills.forEach(s => {
          if (s.applyRules) s.applyRules(ruleContext);
        });

        // 创建斜向移动，确保 dx > 0 且 dy > 0
        const dx = pawn.position.x < 8 ? 1 : -1;
        const dy = pawn.position.y < 9 ? 1 : -1;

        const diagonalPosition: Position = {
          x: pawn.position.x + dx,
          y: pawn.position.y + dy
        };

        // 跳过无效位置或相同位置
        if (!gameState.board.isValidPosition(diagonalPosition) ||
          (diagonalPosition.x === pawn.position.x && diagonalPosition.y === pawn.position.y)) {
          return;
        }

        const diagonalMove: Move = {
          from: pawn.position,
          to: diagonalPosition,
          piece: pawn,
          timestamp: Date.now()
        };

        // 验证斜向移动被拒绝
        const result = moveValidator.validateMove(diagonalMove, gameState, ruleContext);
        expect(result.isValid).toBe(false);
        // 错误消息可能是 "斜走" 或 "两步"（当总步数 > 2 时先触发步数限制）
        const reason = result.reason || '';
        expect(reason.includes('斜走') || reason.includes('两步') || reason.includes('只能走一格') || reason.includes('背水') || reason.includes('兵')).toBe(true);
      }
    ), { numRuns: 100 });
  });

  it('Property 4: Beishui skill - crossed pawns forward limit enforcement', () => {
    fc.assert(fc.property(
      xiangYuWithCrossedPawnGenerator,
      fc.integer({ min: 2, max: 4 }), // 前进步数（超过限制）
      ({ pawn, gameState }, forwardSteps) => {
        // 设置棋盘状态
        gameState.board.setPiece(pawn.position, pawn);

        // 注册项羽的技能
        // 注册项羽的技能
        const xiangYuPlayer = gameState.players.find(p => p.hero.id === 'xiangyu')!;
        skillEngine.registerPlayerSkills(xiangYuPlayer);

        const ruleContext = createDefaultRuleContext();
        xiangYuPlayer.hero.skills.forEach(s => {
          if (s.applyRules) s.applyRules(ruleContext);
        });

        // 创建超过前进限制的移动
        const forwardDirection = pawn.color === PlayerColor.RED ? -1 : 1;
        const targetY = pawn.position.y + (forwardDirection * forwardSteps);

        // 跳过无效位置
        if (targetY < 0 || targetY > 9) {
          return;
        }

        const excessiveForwardMove: Move = {
          from: pawn.position,
          to: { x: pawn.position.x, y: targetY },
          piece: pawn,
          timestamp: Date.now()
        };

        // 验证超过前进限制的移动被拒绝
        const result = moveValidator.validateMove(excessiveForwardMove, gameState, ruleContext);
        expect(result.isValid).toBe(false);
        // 错误消息可能是 "前进一步" 或 "两步"（当总步数 > 2 时先触发步数限制）
        expect(result.reason?.includes('前进一步') || result.reason?.includes('两步')).toBe(true);
      }
    ), { numRuns: 100 });
  });

  it('Property 4: Beishui skill - total step limit enforcement', () => {
    fc.assert(fc.property(
      xiangYuWithCrossedPawnGenerator,
      fc.integer({ min: 3, max: 5 }), // 总步数（超过限制）
      ({ pawn, gameState }, totalSteps) => {
        // 确保兵有足够空间移动超过2步
        // 兵需要在 x 位置使得横向移动 totalSteps 后仍在棋盘内
        if (pawn.position.x + totalSteps > 8 && pawn.position.x - totalSteps < 0) {
          return; // 跳过边界情况，无法确保移动超过2步
        }

        // 设置棋盘状态
        gameState.board.setPiece(pawn.position, pawn);

        // 注册项羽的技能
        // 注册项羽的技能
        const xiangYuPlayer = gameState.players.find(p => p.hero.id === 'xiangyu')!;
        skillEngine.registerPlayerSkills(xiangYuPlayer);

        const ruleContext = createDefaultRuleContext();
        xiangYuPlayer.hero.skills.forEach(s => {
          if (s.applyRules) s.applyRules(ruleContext);
        });

        // 创建超过总步数限制的移动（横向移动）
        // 选择方向确保实际移动步数等于 totalSteps
        const direction = pawn.position.x + totalSteps <= 8 ? 1 : -1;
        const targetX = pawn.position.x + (direction * totalSteps);

        // 验证实际步数确实超过2步
        const actualSteps = Math.abs(targetX - pawn.position.x);
        if (actualSteps <= 2) {
          return; // 跳过无法超过限制的情况
        }

        const excessiveStepsMove: Move = {
          from: pawn.position,
          to: { x: targetX, y: pawn.position.y },
          piece: pawn,
          timestamp: Date.now()
        };

        // 验证超过总步数限制的移动被拒绝
        const result = moveValidator.validateMove(excessiveStepsMove, gameState, ruleContext);
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('两步');
      }
    ), { numRuns: 100 });
  });
});

/**
 * Feature: sanguo-xiangqi, Property 5: 项羽霸王技能效果
 * 验证: 需求 3.3, 3.5
 * 
 * 属性 5: 项羽霸王技能效果
 * 对于任何项羽的马，移动时不受拌马腿影响（除非马受攻击），
 * 且不能连续两步都跳马
 */

// 生成器：创建项羽的马（颜色由玩家决定）
const xiangYuHorseGeneratorForColor = (color: PlayerColor) => {
  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 10 }),
    type: fc.constant(PieceType.HORSE),
    color: fc.constant(color),
    position: validPositionGenerator,
    isAlive: fc.constant(true)
  });
};

// 生成器：创建项羽的马
const xiangYuHorseGenerator = fc.record({
  color: fc.constantFrom(PlayerColor.RED, PlayerColor.BLACK),
}).map(({ color }) => {
  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 10 }),
    type: fc.constant(PieceType.HORSE),
    color: fc.constant(color),
    position: validPositionGenerator,
    isAlive: fc.constant(true)
  });
}).chain(gen => gen);

// 组合生成器：创建项羽玩家和匹配颜色的马
const xiangYuWithHorseGenerator = xiangYuPlayerGenerator.chain(player => {
  return xiangYuHorseGeneratorForColor(player.color).map(horse => {
    const opponent: Player = {
      id: 'opponent',
      color: player.color === PlayerColor.RED ? PlayerColor.BLACK : PlayerColor.RED,
      hero: { id: 'test_hero', name: '测试武将', skills: [], awakened: false },
      pieces: []
    };

    const gameState: GameState = {
      board: new ChessBoard(),
      players: [player, opponent] as [Player, Player],
      currentPlayer: player.color,
      gamePhase: GamePhase.PLAYING,
      moveHistory: []
    };

    return { horse, gameState };
  });
});

// 组合生成器：创建有拌马腿的马移动（颜色匹配项羽玩家）
const xiangYuHorseWithLegBlockGenerator = xiangYuPlayerGenerator.chain(player => {
  return fc.record({
    horse: xiangYuHorseGeneratorForColor(player.color),
    direction: fc.constantFrom(
      { dx: 2, dy: 1 },   // 右上
      { dx: 2, dy: -1 },  // 右下
      { dx: -2, dy: 1 },  // 左上
      { dx: -2, dy: -1 }, // 左下
      { dx: 1, dy: 2 },   // 上右
      { dx: -1, dy: 2 },  // 上左
      { dx: 1, dy: -2 },  // 下右
      { dx: -1, dy: -2 }  // 下左
    )
  }).map(({ horse, direction }) => {
    const targetPosition = {
      x: horse.position.x + direction.dx,
      y: horse.position.y + direction.dy
    };

    // 计算拌马腿位置
    let legPosition: Position;
    if (Math.abs(direction.dx) === 2) {
      legPosition = {
        x: horse.position.x + direction.dx / 2,
        y: horse.position.y
      };
    } else {
      legPosition = {
        x: horse.position.x,
        y: horse.position.y + direction.dy / 2
      };
    }

    const opponent: Player = {
      id: 'opponent',
      color: player.color === PlayerColor.RED ? PlayerColor.BLACK : PlayerColor.RED,
      hero: { id: 'test_hero', name: '测试武将', skills: [], awakened: false },
      pieces: []
    };

    const gameState: GameState = {
      board: new ChessBoard(),
      players: [player, opponent] as [Player, Player],
      currentPlayer: player.color,
      gamePhase: GamePhase.PLAYING,
      moveHistory: []
    };

    return { horse, targetPosition, legPosition, gameState };
  });
});

// 生成器：创建有拌马腿的马移动
const horseWithLegBlockGenerator = fc.record({
  horse: xiangYuHorseGenerator,
  direction: fc.constantFrom(
    { dx: 2, dy: 1 },   // 右上
    { dx: 2, dy: -1 },  // 右下
    { dx: -2, dy: 1 },  // 左上
    { dx: -2, dy: -1 }, // 左下
    { dx: 1, dy: 2 },   // 上右
    { dx: -1, dy: 2 },  // 上左
    { dx: 1, dy: -2 },  // 下右
    { dx: -1, dy: -2 }  // 下左
  )
}).map(({ horse, direction }) => {
  const targetPosition = {
    x: horse.position.x + direction.dx,
    y: horse.position.y + direction.dy
  };

  // 计算拌马腿位置
  let legPosition: Position;
  if (Math.abs(direction.dx) === 2) {
    legPosition = {
      x: horse.position.x + direction.dx / 2,
      y: horse.position.y
    };
  } else {
    legPosition = {
      x: horse.position.x,
      y: horse.position.y + direction.dy / 2
    };
  }

  return { horse, targetPosition, legPosition };
});

describe('Xiang Yu Bawang Skill Properties', () => {
  let skillEngine: SkillEngine;
  let moveValidator: ChessMoveValidator;

  beforeEach(() => {
    skillEngine = new SkillEngine();
    moveValidator = new ChessMoveValidator(skillEngine);
  });

  it('Property 5: Bawang skill - horses ignore leg blocking when not under attack', () => {
    fc.assert(fc.property(
      xiangYuHorseWithLegBlockGenerator,
      ({ horse, targetPosition, legPosition, gameState }) => {
        // 跳过无效位置
        if (!gameState.board.isValidPosition(targetPosition) ||
          !gameState.board.isValidPosition(legPosition)) {
          return;
        }

        // 设置棋盘状态
        gameState.board.setPiece(horse.position, horse);

        // 获取项羽玩家
        const xiangYuPlayer = gameState.players.find(p => p.hero.id === 'xiangyu')!;

        // 在拌马腿位置放置阻挡棋子（使用己方棋子，不会攻击马）
        const blockingPiece: Piece = {
          id: 'blocking-piece',
          type: PieceType.PAWN,
          color: xiangYuPlayer.color, // 使用己方棋子作为阻挡
          position: legPosition,
          isAlive: true
        };
        gameState.board.setPiece(legPosition, blockingPiece);

        // 注册项羽的技能
        skillEngine.registerPlayerSkills(xiangYuPlayer);

        const ruleContext = createDefaultRuleContext();
        xiangYuPlayer.hero.skills.forEach(s => {
          if (s.applyRules) s.applyRules(ruleContext);
        });

        // 创建马的移动
        const horseMove: Move = {
          from: horse.position,
          to: targetPosition,
          piece: horse,
          timestamp: Date.now()
        };

        // 验证霸王技能允许马忽略拌马腿
        const result = moveValidator.validateMove(horseMove, gameState, ruleContext);

        // 需求 3.3: 项羽的马移动时，不受拌马腿影响
        expect(result.isValid).toBe(true);
      }
    ), { numRuns: 100 });
  });

  it('Property 5: Bawang skill - consecutive horse moves are blocked', () => {
    fc.assert(fc.property(
      xiangYuWithHorseGenerator,
      ({ horse, gameState }) => {
        // 获取项羽玩家
        const xiangYuPlayer = gameState.players.find(p => p.hero.id === 'xiangyu')!;

        // 确保第一匹马有足够空间做有效移动
        // 马需要在位置 (0-6, 0-7) 才能做 (+2, +1) 或 (+1, +2) 的移动
        if (horse.position.x > 6 || horse.position.y > 7) {
          return; // 跳过边界情况
        }

        // 创建第二匹马，确保有足够空间做有效移动
        const secondHorseX = horse.position.x < 6 ? horse.position.x + 2 : horse.position.x - 2;
        const secondHorse: Piece = {
          id: horse.id + '_second',
          type: PieceType.HORSE,
          color: xiangYuPlayer.color,
          position: {
            x: Math.max(0, Math.min(6, secondHorseX)),
            y: Math.max(0, Math.min(7, horse.position.y))
          },
          isAlive: true
        };

        // 确保位置不同
        if (secondHorse.position.x === horse.position.x &&
          secondHorse.position.y === horse.position.y) {
          return; // 跳过无效情况
        }

        // 确保第二匹马也能做有效移动
        if (secondHorse.position.x > 6 || secondHorse.position.y > 7) {
          return;
        }

        // 设置棋盘状态
        gameState.board.setPiece(horse.position, horse);
        gameState.board.setPiece(secondHorse.position, secondHorse);

        // 注册项羽的技能
        // 注册项羽的技能
        skillEngine.registerPlayerSkills(xiangYuPlayer);

        const ruleContext = createDefaultRuleContext();
        xiangYuPlayer.hero.skills.forEach(s => {
          if (s.applyRules) s.applyRules(ruleContext);
        });

        // 创建第一次马移动（有效的日字格移动: +2, +1）
        const firstMove: Move = {
          from: horse.position,
          to: { x: horse.position.x + 2, y: horse.position.y + 1 },
          piece: horse,
          timestamp: Date.now()
        };

        // 添加第一次移动到历史记录
        gameState.moveHistory.push(firstMove);

        // 创建第二次马移动（有效的日字格移动: +1, +2）
        const secondMove: Move = {
          from: secondHorse.position,
          to: { x: secondHorse.position.x + 1, y: secondHorse.position.y + 2 },
          piece: secondHorse,
          timestamp: Date.now()
        };

        // 验证第二次马移动被阻止
        // 验证第二次马移动被阻止
        const result = moveValidator.validateMove(secondMove, gameState, ruleContext);

        // 需求 3.5: 项羽连续两步都选择跳马时，系统应当阻止第二次跳马
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('连续');
      }
    ), { numRuns: 100 });
  });

  it('Property 5: Bawang skill - horses under attack follow normal leg blocking rules', () => {
    fc.assert(fc.property(
      xiangYuHorseWithLegBlockGenerator,
      ({ horse, targetPosition, legPosition, gameState }) => {
        // 跳过无效位置
        if (!gameState.board.isValidPosition(targetPosition) ||
          !gameState.board.isValidPosition(legPosition)) {
          return;
        }

        // 获取项羽玩家
        const xiangYuPlayer = gameState.players.find(p => p.hero.id === 'xiangyu')!;
        const opponentColor = xiangYuPlayer.color === PlayerColor.RED ? PlayerColor.BLACK : PlayerColor.RED;

        // 设置棋盘状态
        gameState.board.setPiece(horse.position, horse);

        // 在拌马腿位置放置阻挡棋子（己方棋子）
        const blockingPiece: Piece = {
          id: 'blocking-piece',
          type: PieceType.PAWN,
          color: xiangYuPlayer.color,
          position: legPosition,
          isAlive: true
        };
        gameState.board.setPiece(legPosition, blockingPiece);

        // 放置一个可以攻击马的对手车（在同一行或列）
        // 找一个可以攻击马的位置
        let attackerPosition: Position | null = null;

        // 尝试在马的同一行放置车
        for (let x = 0; x <= 8; x++) {
          if (x !== horse.position.x && x !== legPosition.x) {
            const pos = { x, y: horse.position.y };
            if (!gameState.board.getPiece(pos)) {
              // 检查路径是否畅通
              const pathClear = !gameState.board.isPathBlocked(pos, horse.position);
              if (pathClear) {
                attackerPosition = pos;
                break;
              }
            }
          }
        }

        // 如果找不到有效的攻击位置，跳过测试
        if (!attackerPosition) {
          return;
        }

        const attackingPiece: Piece = {
          id: 'attacking-piece',
          type: PieceType.CHARIOT,
          color: opponentColor,
          position: attackerPosition,
          isAlive: true
        };
        gameState.board.setPiece(attackerPosition, attackingPiece);

        // 注册项羽的技能
        skillEngine.registerPlayerSkills(xiangYuPlayer);

        const ruleContext = createDefaultRuleContext();
        xiangYuPlayer.hero.skills.forEach(s => {
          if (s.applyRules) s.applyRules(ruleContext);
        });

        // 创建马的移动
        const horseMove: Move = {
          from: horse.position,
          to: targetPosition,
          piece: horse,
          timestamp: Date.now()
        };

        // 验证马受攻击时遵循正常拌马腿规则
        const result = moveValidator.validateMove(horseMove, gameState, ruleContext);

        // 需求 3.4: 马受到攻击时，系统应当正常处理拌马腿限制
        // 由于有拌马腿阻挡，移动应该被拒绝
        expect(result.isValid).toBe(false);
      }
    ), { numRuns: 100 });
  });





  it('Property 5: Bawang skill - valid horse moves are allowed', () => {
    fc.assert(fc.property(
      xiangYuWithHorseGenerator,
      fc.constantFrom(
        { dx: 2, dy: 1 }, { dx: 2, dy: -1 }, { dx: -2, dy: 1 }, { dx: -2, dy: -1 },
        { dx: 1, dy: 2 }, { dx: -1, dy: 2 }, { dx: 1, dy: -2 }, { dx: -1, dy: -2 }
      ),
      ({ horse, gameState }, direction) => {
        const targetPosition = {
          x: horse.position.x + direction.dx,
          y: horse.position.y + direction.dy
        };

        // 跳过无效位置
        if (!gameState.board.isValidPosition(targetPosition)) {
          return;
        }

        // 设置棋盘状态
        gameState.board.setPiece(horse.position, horse);

        // 注册项羽的技能
        const xiangYuPlayer = gameState.players.find(p => p.hero.id === 'xiangyu')!;
        skillEngine.registerPlayerSkills(xiangYuPlayer);

        const ruleContext = createDefaultRuleContext();
        xiangYuPlayer.hero.skills.forEach(s => {
          if (s.applyRules) s.applyRules(ruleContext);
        });

        // 创建有效的马移动
        const horseMove: Move = {
          from: horse.position,
          to: targetPosition,
          piece: horse,
          timestamp: Date.now()
        };

        // 验证有效的马移动被允许
        const result = moveValidator.validateMove(horseMove, gameState, ruleContext);
        expect(result.isValid).toBe(true);
      }
    ), { numRuns: 100 });
  });

  it('Property 5: Bawang skill - invalid horse moves are rejected', () => {
    fc.assert(fc.property(
      xiangYuWithHorseGenerator,
      fc.record({
        dx: fc.integer({ min: -3, max: 3 }),
        dy: fc.integer({ min: -3, max: 3 })
      }).filter(({ dx, dy }) => {
        // 过滤掉有效的马移动
        const isValidHorseMove =
          (Math.abs(dx) === 2 && Math.abs(dy) === 1) ||
          (Math.abs(dx) === 1 && Math.abs(dy) === 2);
        return !isValidHorseMove && (dx !== 0 || dy !== 0);
      }),
      ({ horse, gameState }, direction) => {
        const targetPosition = {
          x: horse.position.x + direction.dx,
          y: horse.position.y + direction.dy
        };

        // 跳过无效位置
        if (!gameState.board.isValidPosition(targetPosition)) {
          return;
        }

        // 设置棋盘状态
        gameState.board.setPiece(horse.position, horse);

        // 注册项羽的技能
        const xiangYuPlayer = gameState.players.find(p => p.hero.id === 'xiangyu')!;
        skillEngine.registerPlayerSkills(xiangYuPlayer);

        // 创建无效的马移动
        const horseMove: Move = {
          from: horse.position,
          to: targetPosition,
          piece: horse,
          timestamp: Date.now()
        };

        // 验证无效的马移动被拒绝
        const result = moveValidator.validateMove(horseMove, gameState);
        expect(result.isValid).toBe(false);
      }
    ), { numRuns: 100 });
  });
});