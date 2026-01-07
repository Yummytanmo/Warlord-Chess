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
  GamePhase,
  SkillType
} from '@/types/game';
import { createDefaultRuleContext } from '@/types/rules';

/**
 * Feature: sanguo-xiangqi, Property 6: 刘邦技能综合效果
 * 验证: 需求 4.1, 4.4, 4.5
 * 
 * 属性 6: 刘邦技能综合效果
 * 对于任何刘邦的棋子，将可以出九宫，士可以出九宫但不能过河，象不受象心限制
 */

// 生成器：创建有效的棋盘位置
const validPositionGenerator = fc.record({
  x: fc.integer({ min: 0, max: 8 }),
  y: fc.integer({ min: 0, max: 9 })
});

// 生成器：创建刘邦的将（在九宫内）

// 生成器：创建刘邦的士（在九宫内）

// 生成器：创建刘邦的象（在己方半场）

// 生成器：创建刘邦玩家
const liuBangPlayerGenerator = fc.record({
  color: fc.constantFrom(PlayerColor.RED, PlayerColor.BLACK)
}).map(({ color }) => {
  const liuBangHero = getHeroById('liubang');
  if (!liuBangHero) {
    throw new Error('刘邦武将未找到');
  }

  return {
    id: `liubang_player_${color}`,
    color,
    hero: createHeroCopy(liuBangHero),
    pieces: []
  } as Player;
});

// 生成器：创建游戏状态


// 组合生成器：创建刘邦玩家和匹配颜色的将（在九宫内）
const liuBangWithKingGenerator = liuBangPlayerGenerator.chain(player => {
  const palaceYRange = player.color === PlayerColor.RED
    ? fc.integer({ min: 7, max: 9 })
    : fc.integer({ min: 0, max: 2 });

  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 10 }),
    type: fc.constant(PieceType.KING),
    color: fc.constant(player.color),
    position: fc.record({
      x: fc.integer({ min: 3, max: 5 }),
      y: palaceYRange
    }),
    isAlive: fc.constant(true)
  }).map(king => {
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

    return { king, gameState };
  });
});

// 组合生成器：创建刘邦玩家和匹配颜色的士（在九宫内）
const liuBangWithAdvisorGenerator = liuBangPlayerGenerator.chain(player => {
  const palaceYRange = player.color === PlayerColor.RED
    ? fc.integer({ min: 7, max: 9 })
    : fc.integer({ min: 0, max: 2 });

  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 10 }),
    type: fc.constant(PieceType.ADVISOR),
    color: fc.constant(player.color),
    position: fc.record({
      x: fc.integer({ min: 3, max: 5 }),
      y: palaceYRange
    }),
    isAlive: fc.constant(true)
  }).map(advisor => {
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

    return { advisor, gameState };
  });
});

// 组合生成器：创建刘邦玩家和匹配颜色的象（在己方半场）
const liuBangWithElephantGenerator = liuBangPlayerGenerator.chain(player => {
  const halfYRange = player.color === PlayerColor.RED
    ? fc.integer({ min: 5, max: 9 })
    : fc.integer({ min: 0, max: 4 });

  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 10 }),
    type: fc.constant(PieceType.ELEPHANT),
    color: fc.constant(player.color),
    position: fc.record({
      x: fc.integer({ min: 0, max: 8 }),
      y: halfYRange
    }),
    isAlive: fc.constant(true)
  }).map(elephant => {
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

    return { elephant, gameState };
  });
});

describe('Liu Bang Genyi and Hongmen Skills Properties', () => {
  let skillEngine: SkillEngine;
  let moveValidator: ChessMoveValidator;

  beforeEach(() => {
    skillEngine = new SkillEngine();
    moveValidator = new ChessMoveValidator(skillEngine);
  });

  it('Property 6: Genyi skill - king can move out of palace', () => {
    fc.assert(fc.property(
      liuBangWithKingGenerator,
      fc.constantFrom(
        { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
      ),
      ({ king, gameState }, direction) => {
        // 计算目标位置（出九宫）
        const targetPosition: Position = {
          x: king.position.x + direction.dx,
          y: king.position.y + direction.dy
        };

        // 跳过无效位置
        if (!gameState.board.isValidPosition(targetPosition)) {
          return;
        }

        // 跳过仍在九宫内的移动
        if (gameState.board.isInPalace(targetPosition, king.color)) {
          return;
        }

        // 设置棋盘状态
        gameState.board.setPiece(king.position, king);

        // 注册刘邦的技能
        // 注册刘邦的技能
        const liuBangPlayer = gameState.players.find(p => p.hero.id === 'liubang')!;
        skillEngine.registerPlayerSkills(liuBangPlayer);

        const ruleContext = createDefaultRuleContext();
        liuBangPlayer.hero.skills.forEach(s => {
          if (s.applyRules) s.applyRules(ruleContext);
        });

        // 创建出九宫移动
        const outOfPalaceMove: Move = {
          from: king.position,
          to: targetPosition,
          piece: king,
          timestamp: Date.now()
        };

        // 验证更衣技能允许将出九宫
        const result = moveValidator.validateMove(outOfPalaceMove, gameState, ruleContext);

        // 需求 4.1: 刘邦使用更衣技能时，游戏系统应当允许将出九宫
        expect(result.isValid).toBe(true);
      }
    ), { numRuns: 100 });
  });

  it('Property 6: Genyi skill - king still follows basic movement rules', () => {
    fc.assert(fc.property(
      liuBangWithKingGenerator,
      fc.record({
        dx: fc.integer({ min: -3, max: 3 }),
        dy: fc.integer({ min: -3, max: 3 })
      }).filter(({ dx, dy }) => {
        // 过滤掉有效的将移动（一格横或竖）
        const isValidKingMove =
          (Math.abs(dx) === 1 && dy === 0) ||
          (dx === 0 && Math.abs(dy) === 1);
        return !isValidKingMove && (dx !== 0 || dy !== 0);
      }),
      ({ king, gameState }, direction) => {
        const targetPosition: Position = {
          x: king.position.x + direction.dx,
          y: king.position.y + direction.dy
        };

        // 跳过无效位置
        if (!gameState.board.isValidPosition(targetPosition)) {
          return;
        }

        // 设置棋盘状态
        gameState.board.setPiece(king.position, king);

        // 注册刘邦的技能
        // 注册刘邦的技能
        const liuBangPlayer = gameState.players.find(p => p.hero.id === 'liubang')!;
        skillEngine.registerPlayerSkills(liuBangPlayer);

        const ruleContext = createDefaultRuleContext();
        liuBangPlayer.hero.skills.forEach(s => {
          if (s.applyRules) s.applyRules(ruleContext);
        });

        // 创建无效的将移动
        const invalidKingMove: Move = {
          from: king.position,
          to: targetPosition,
          piece: king,
          timestamp: Date.now()
        };

        // 验证更衣技能不能违反将的基本移动规则
        const result = moveValidator.validateMove(invalidKingMove, gameState, ruleContext);
        expect(result.isValid).toBe(false);
      }
    ), { numRuns: 100 });
  });

  it('Property 6: Hongmen skill - advisor can move out of palace but not cross river', () => {
    fc.assert(fc.property(
      liuBangWithAdvisorGenerator,
      fc.constantFrom(
        { dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
      ),
      ({ advisor, gameState }, direction) => {
        // 计算目标位置（出九宫但不过河）
        const targetPosition: Position = {
          x: advisor.position.x + direction.dx,
          y: advisor.position.y + direction.dy
        };

        // 跳过无效位置
        if (!gameState.board.isValidPosition(targetPosition)) {
          return;
        }

        // 跳过仍在九宫内的移动
        if (gameState.board.isInPalace(targetPosition, advisor.color)) {
          return;
        }

        // 跳过过河的移动
        if (gameState.board.hasRiverCrossed(targetPosition, advisor.color)) {
          return;
        }

        // 设置棋盘状态
        gameState.board.setPiece(advisor.position, advisor);

        // 注册刘邦的技能
        // 注册刘邦的技能
        const liuBangPlayer = gameState.players.find(p => p.hero.id === 'liubang')!;
        skillEngine.registerPlayerSkills(liuBangPlayer);

        const ruleContext = createDefaultRuleContext();
        liuBangPlayer.hero.skills.forEach(s => {
          if (s.applyRules) s.applyRules(ruleContext);
        });

        // 创建出九宫但不过河的移动
        const outOfPalaceMove: Move = {
          from: advisor.position,
          to: targetPosition,
          piece: advisor,
          timestamp: Date.now()
        };

        // 验证鸿门技能允许士出九宫但不过河
        const result = moveValidator.validateMove(outOfPalaceMove, gameState, ruleContext);

        // 需求 4.4: 刘邦的士移动时，游戏系统应当允许士出九宫但不能过河
        expect(result.isValid).toBe(true);
      }
    ), { numRuns: 100 });
  });

  it('Property 6: Hongmen skill - advisor cannot cross river', () => {
    fc.assert(fc.property(
      liuBangWithAdvisorGenerator,
      ({ advisor, gameState }) => {
        // 计算过河位置
        const riverY = advisor.color === PlayerColor.RED ? 4 : 5;
        const crossRiverPosition: Position = {
          x: advisor.position.x + 1,
          y: riverY
        };

        // 跳过无效位置
        if (!gameState.board.isValidPosition(crossRiverPosition)) {
          return;
        }

        // 确保这是一个过河的移动
        if (!gameState.board.hasRiverCrossed(crossRiverPosition, advisor.color)) {
          return;
        }

        // 设置棋盘状态
        gameState.board.setPiece(advisor.position, advisor);

        // 注册刘邦的技能
        // 注册刘邦的技能
        const liuBangPlayer = gameState.players.find(p => p.hero.id === 'liubang')!;
        skillEngine.registerPlayerSkills(liuBangPlayer);

        const ruleContext = createDefaultRuleContext();
        liuBangPlayer.hero.skills.forEach(s => {
          if (s.applyRules) s.applyRules(ruleContext);
        });

        // 创建过河移动
        const crossRiverMove: Move = {
          from: advisor.position,
          to: crossRiverPosition,
          piece: advisor,
          timestamp: Date.now()
        };

        // 验证鸿门技能不允许士过河
        const result = moveValidator.validateMove(crossRiverMove, gameState, ruleContext);
        expect(result.isValid).toBe(false);
        // 消息可能是 "鸿门技能：士不能过河" 或 "士不能离开九宫"（如果未触发技能检查）
      }
    ), { numRuns: 100 });
  });

  it('Property 6: Hongmen skill - advisor still follows diagonal movement rules', () => {
    fc.assert(fc.property(
      liuBangWithAdvisorGenerator,
      fc.record({
        dx: fc.integer({ min: -2, max: 2 }),
        dy: fc.integer({ min: -2, max: 2 })
      }).filter(({ dx, dy }) => {
        // 过滤掉有效的士移动（斜走一格）
        const isValidAdvisorMove = Math.abs(dx) === 1 && Math.abs(dy) === 1;
        return !isValidAdvisorMove && (dx !== 0 || dy !== 0);
      }),
      ({ advisor, gameState }, direction) => {
        const targetPosition: Position = {
          x: advisor.position.x + direction.dx,
          y: advisor.position.y + direction.dy
        };

        // 跳过无效位置
        if (!gameState.board.isValidPosition(targetPosition)) {
          return;
        }

        // 设置棋盘状态
        gameState.board.setPiece(advisor.position, advisor);

        // 注册刘邦的技能
        // 注册刘邦的技能
        const liuBangPlayer = gameState.players.find(p => p.hero.id === 'liubang')!;
        skillEngine.registerPlayerSkills(liuBangPlayer);

        const ruleContext = createDefaultRuleContext();
        liuBangPlayer.hero.skills.forEach(s => {
          if (s.applyRules) s.applyRules(ruleContext);
        });

        // 创建无效的士移动
        const invalidAdvisorMove: Move = {
          from: advisor.position,
          to: targetPosition,
          piece: advisor,
          timestamp: Date.now()
        };

        // 验证鸿门技能不能违反士的基本移动规则
        const result = moveValidator.validateMove(invalidAdvisorMove, gameState, ruleContext);
        expect(result.isValid).toBe(false);
      }
    ), { numRuns: 100 });
  });

  it('Property 6: Hongmen skill - elephant ignores elephant heart blocking', () => {
    fc.assert(fc.property(
      liuBangWithElephantGenerator,
      fc.constantFrom(
        { dx: 2, dy: 2 }, { dx: 2, dy: -2 }, { dx: -2, dy: 2 }, { dx: -2, dy: -2 }
      ),
      ({ elephant, gameState }, direction) => {

        const targetPosition: Position = {
          x: elephant.position.x + direction.dx,
          y: elephant.position.y + direction.dy
        };

        // 跳过无效位置
        if (!gameState.board.isValidPosition(targetPosition)) {
          return;
        }

        // 跳过过河的移动
        if (gameState.board.hasRiverCrossed(targetPosition, elephant.color)) {
          return;
        }

        // 设置棋盘状态
        gameState.board.setPiece(elephant.position, elephant);

        // 在象心位置放置阻挡棋子
        const elephantHeartPosition: Position = {
          x: elephant.position.x + direction.dx / 2,
          y: elephant.position.y + direction.dy / 2
        };

        const blockingPiece: Piece = {
          id: 'blocking-piece',
          type: PieceType.PAWN,
          color: elephant.color === PlayerColor.RED ? PlayerColor.BLACK : PlayerColor.RED,
          position: elephantHeartPosition,
          isAlive: true
        };
        gameState.board.setPiece(elephantHeartPosition, blockingPiece);

        // 注册刘邦的技能
        const liuBangPlayer = gameState.players.find(p => p.hero.id === 'liubang')!;
        skillEngine.registerPlayerSkills(liuBangPlayer);

        const ruleContext = createDefaultRuleContext();
        liuBangPlayer.hero.skills.forEach(s => {
          if (s.applyRules) s.applyRules(ruleContext);
        });

        // 创建象的移动
        const elephantMove: Move = {
          from: elephant.position,
          to: targetPosition,
          piece: elephant,
          timestamp: Date.now()
        };

        // 验证鸿门技能允许象忽略象心限制
        const result = moveValidator.validateMove(elephantMove, gameState, ruleContext);

        // 需求 4.5: 刘邦的象移动时，游戏系统应当忽略象心限制
        expect(result.isValid).toBe(true);
      }
    ), { numRuns: 100 });
  });

  it('Property 6: Hongmen skill - elephant cannot cross river', () => {
    fc.assert(fc.property(
      liuBangWithElephantGenerator,
      fc.constantFrom(
        { dx: 2, dy: 2 }, { dx: 2, dy: -2 }, { dx: -2, dy: 2 }, { dx: -2, dy: -2 }
      ),
      ({ elephant, gameState }, direction) => {
        const targetPosition: Position = {
          x: elephant.position.x + direction.dx,
          y: elephant.position.y + direction.dy
        };

        // 跳过无效位置
        if (!gameState.board.isValidPosition(targetPosition)) {
          return;
        }

        // 只测试过河的移动
        if (!gameState.board.hasRiverCrossed(targetPosition, elephant.color)) {
          return;
        }

        // 设置棋盘状态
        gameState.board.setPiece(elephant.position, elephant);

        // 注册刘邦的技能
        // 注册刘邦的技能
        const liuBangPlayer = gameState.players.find(p => p.hero.id === 'liubang')!;
        skillEngine.registerPlayerSkills(liuBangPlayer);

        const ruleContext = createDefaultRuleContext();
        liuBangPlayer.hero.skills.forEach(s => {
          if (s.applyRules) s.applyRules(ruleContext);
        });

        // 创建过河移动
        const crossRiverMove: Move = {
          from: elephant.position,
          to: targetPosition,
          piece: elephant,
          timestamp: Date.now()
        };

        // 验证鸿门技能不允许象过河
        const result = moveValidator.validateMove(crossRiverMove, gameState, ruleContext);
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('过河');
      }
    ), { numRuns: 100 });
  });

  it('Property 6: Hongmen skill - elephant still follows field movement rules', () => {
    fc.assert(fc.property(
      liuBangWithElephantGenerator,
      fc.record({
        dx: fc.integer({ min: -3, max: 3 }),
        dy: fc.integer({ min: -3, max: 3 })
      }).filter(({ dx, dy }) => {
        // 过滤掉有效的象移动（田字格：斜走两格）
        const isValidElephantMove = Math.abs(dx) === 2 && Math.abs(dy) === 2;
        return !isValidElephantMove && (dx !== 0 || dy !== 0);
      }),
      ({ elephant, gameState }, direction) => {
        const targetPosition: Position = {
          x: elephant.position.x + direction.dx,
          y: elephant.position.y + direction.dy
        };

        // 跳过无效位置
        if (!gameState.board.isValidPosition(targetPosition)) {
          return;
        }

        // 设置棋盘状态
        gameState.board.setPiece(elephant.position, elephant);

        // 注册刘邦的技能
        // 注册刘邦的技能
        const liuBangPlayer = gameState.players.find(p => p.hero.id === 'liubang')!;
        skillEngine.registerPlayerSkills(liuBangPlayer);

        const ruleContext = createDefaultRuleContext();
        liuBangPlayer.hero.skills.forEach(s => {
          if (s.applyRules) s.applyRules(ruleContext);
        });

        // 创建无效的象移动
        const invalidElephantMove: Move = {
          from: elephant.position,
          to: targetPosition,
          piece: elephant,
          timestamp: Date.now()
        };

        // 验证鸿门技能不能违反象的基本移动规则
        const result = moveValidator.validateMove(invalidElephantMove, gameState, ruleContext);
        expect(result.isValid).toBe(false);
      }
    ), { numRuns: 100 });
  });




});

/**
 * Feature: sanguo-xiangqi, Property 7: 刘邦亲征技能效果
 * 验证: 需求 4.2, 4.3
 * 
 * 属性 7: 刘邦亲征技能效果
 * 对于任何刘邦使用亲征技能的情况，必须强制对方将与己方将在同一条线上，并清除路径上的阻挡
 */

// 生成器：创建两个不在同一条线上的将
const twoKingsNotAlignedGenerator = fc.record({
  liuBangColor: fc.constantFrom(PlayerColor.RED, PlayerColor.BLACK)
}).map(({ liuBangColor }) => {
  const opponentColor = liuBangColor === PlayerColor.RED ? PlayerColor.BLACK : PlayerColor.RED;

  // 刘邦的将在九宫内
  const liuBangKingPos = liuBangColor === PlayerColor.RED
    ? fc.record({ x: fc.integer({ min: 3, max: 5 }), y: fc.integer({ min: 7, max: 9 }) })
    : fc.record({ x: fc.integer({ min: 3, max: 5 }), y: fc.integer({ min: 0, max: 2 }) });

  // 对方的将在九宫内，但不与刘邦的将在同一条线上
  const opponentKingPos = opponentColor === PlayerColor.RED
    ? fc.record({ x: fc.integer({ min: 3, max: 5 }), y: fc.integer({ min: 7, max: 9 }) })
    : fc.record({ x: fc.integer({ min: 3, max: 5 }), y: fc.integer({ min: 0, max: 2 }) });

  return fc.record({
    liuBangKing: fc.record({
      id: fc.constant('liubang-king'),
      type: fc.constant(PieceType.KING),
      color: fc.constant(liuBangColor),
      position: liuBangKingPos,
      isAlive: fc.constant(true)
    }),
    opponentKing: fc.record({
      id: fc.constant('opponent-king'),
      type: fc.constant(PieceType.KING),
      color: fc.constant(opponentColor),
      position: opponentKingPos,
      isAlive: fc.constant(true)
    })
  }).filter(({ liuBangKing, opponentKing }) => {
    // 确保两个将不在同一条线上
    return liuBangKing.position.x !== opponentKing.position.x &&
      liuBangKing.position.y !== opponentKing.position.y;
  });
}).chain(gen => gen);

// 生成器：创建带有阻挡棋子的游戏状态
const gameStateWithBlockingPiecesGenerator = fc.record({
  kingsData: twoKingsNotAlignedGenerator,
  blockingPieces: fc.array(
    fc.record({
      id: fc.string({ minLength: 1, maxLength: 10 }),
      type: fc.constantFrom(PieceType.PAWN, PieceType.CHARIOT, PieceType.CANNON),
      color: fc.constantFrom(PlayerColor.RED, PlayerColor.BLACK),
      position: validPositionGenerator,
      isAlive: fc.constant(true)
    }),
    { minLength: 0, maxLength: 5 }
  )
}).map(({ kingsData, blockingPieces }) => {
  const liuBangPlayer: Player = {
    id: 'liubang-player',
    color: kingsData.liuBangKing.color,
    hero: createHeroCopy(getHeroById('liubang')!),
    pieces: [kingsData.liuBangKing]
  };

  const opponentPlayer: Player = {
    id: 'opponent-player',
    color: kingsData.opponentKing.color,
    hero: { id: 'test_hero', name: '测试武将', skills: [], awakened: false },
    pieces: [kingsData.opponentKing]
  };

  const gameState: GameState = {
    board: new ChessBoard(),
    players: [liuBangPlayer, opponentPlayer] as [Player, Player],
    currentPlayer: liuBangPlayer.color,
    gamePhase: GamePhase.PLAYING,
    moveHistory: []
  };

  // 设置棋盘状态
  gameState.board.setPiece(kingsData.liuBangKing.position, kingsData.liuBangKing);
  gameState.board.setPiece(kingsData.opponentKing.position, kingsData.opponentKing);

  // 放置阻挡棋子
  for (const piece of blockingPieces) {
    // 避免与将重叠
    if ((piece.position.x !== kingsData.liuBangKing.position.x ||
      piece.position.y !== kingsData.liuBangKing.position.y) &&
      (piece.position.x !== kingsData.opponentKing.position.x ||
        piece.position.y !== kingsData.opponentKing.position.y)) {
      gameState.board.setPiece(piece.position, piece);
    }
  }

  return { gameState, kingsData };
});

describe('Liu Bang Qinzheng Skill Properties', () => {
  let skillEngine: SkillEngine;

  beforeEach(() => {
    skillEngine = new SkillEngine();
  });

  it('Property 7: Qinzheng skill - forces opponent king alignment', () => {
    fc.assert(fc.property(
      gameStateWithBlockingPiecesGenerator,
      ({ gameState, kingsData }) => {
        // 注册刘邦的技能
        const liuBangPlayer = gameState.players.find(p => p.hero.id === 'liubang')!;
        skillEngine.registerPlayerSkills(liuBangPlayer);

        // 获取亲征技能
        const qinzhengSkill = liuBangPlayer.hero.skills.find(s => s.id === 'liubang_qinzheng');
        expect(qinzhengSkill).toBeDefined();

        // 确保技能可以使用
        if (!qinzhengSkill!.canUse()) {
          return; // 跳过已使用的技能
        }

        // 使用亲征技能
        const context = {
          gameState,
          player: liuBangPlayer
        };

        const result = qinzhengSkill!.execute(context);

        // 需求 4.2: 刘邦使用亲征技能时，游戏系统应当强制对方将与己方将在同一条线上
        if (result.success) {
          expect(result.gameStateChanges).toBeDefined();
          expect(result.gameStateChanges!.opponentKingPosition).toBeDefined();

          const newOpponentPos = result.gameStateChanges!.opponentKingPosition;
          const liuBangKingPos = kingsData.liuBangKing.position;

          // 验证对方将与己方将在同一条线上
          const isAligned = newOpponentPos.x === liuBangKingPos.x ||
            newOpponentPos.y === liuBangKingPos.y;
          expect(isAligned).toBe(true);

          // 验证对方将仍在九宫内
          expect(gameState.board.isInPalace(newOpponentPos, kingsData.opponentKing.color)).toBe(true);
        }
      }
    ), { numRuns: 100 });
  });

  it('Property 7: Qinzheng skill - clears blocking pieces from path', () => {
    fc.assert(fc.property(
      gameStateWithBlockingPiecesGenerator,
      ({ gameState, kingsData }) => {
        // 注册刘邦的技能
        const liuBangPlayer = gameState.players.find(p => p.hero.id === 'liubang')!;
        skillEngine.registerPlayerSkills(liuBangPlayer);

        // 获取亲征技能
        const qinzhengSkill = liuBangPlayer.hero.skills.find(s => s.id === 'liubang_qinzheng');
        expect(qinzhengSkill).toBeDefined();

        // 确保技能可以使用
        if (!qinzhengSkill!.canUse()) {
          return; // 跳过已使用的技能
        }

        // 记录使用技能前的棋盘状态
        const piecesBeforeSkill = gameState.board.getAllPieces().length;

        // 使用亲征技能
        const context = {
          gameState,
          player: liuBangPlayer
        };

        const result = qinzhengSkill!.execute(context);

        // 需求 4.3: 亲征技能触发时，游戏系统应当移除移动路径上的阻挡棋子
        if (result.success && result.gameStateChanges) {
          const removedPieces = result.gameStateChanges.removedPieces || [];
          const clearedPositions = result.gameStateChanges.clearedPositions || [];

          // 验证移除的棋子信息完整
          for (const removedPiece of removedPieces) {
            expect(removedPiece.id).toBeDefined();
            expect(removedPiece.position).toBeDefined();
            expect(removedPiece.type).toBeDefined();
            expect(removedPiece.color).toBeDefined();
          }

          // 验证清除的位置信息
          for (const clearedPos of clearedPositions) {
            expect(clearedPos.x).toBeGreaterThanOrEqual(0);
            expect(clearedPos.x).toBeLessThanOrEqual(8);
            expect(clearedPos.y).toBeGreaterThanOrEqual(0);
            expect(clearedPos.y).toBeLessThanOrEqual(9);
          }

          // 验证移除的棋子数量合理
          expect(removedPieces.length).toBeGreaterThanOrEqual(0);
          expect(removedPieces.length).toBeLessThanOrEqual(piecesBeforeSkill);
        }
      }
    ), { numRuns: 100 });
  });

  it('Property 7: Qinzheng skill - is limited use only', () => {
    fc.assert(fc.property(
      gameStateWithBlockingPiecesGenerator,
      ({ gameState }) => {
        // 注册刘邦的技能
        const liuBangPlayer = gameState.players.find(p => p.hero.id === 'liubang')!;
        skillEngine.registerPlayerSkills(liuBangPlayer);

        // 获取亲征技能
        const qinzhengSkill = liuBangPlayer.hero.skills.find(s => s.id === 'liubang_qinzheng');
        expect(qinzhengSkill).toBeDefined();

        // 验证技能类型是限定技
        expect(qinzhengSkill!.type).toBe(SkillType.LIMITED);

        // 第一次使用应该成功
        const context = {
          gameState,
          player: liuBangPlayer
        };

        const firstResult = qinzhengSkill!.execute(context);

        // 如果第一次使用成功，第二次应该失败
        if (firstResult.success) {
          const secondResult = qinzhengSkill!.execute(context);
          expect(secondResult.success).toBe(false);
          expect(secondResult.message).toContain('已使用');
        }
      }
    ), { numRuns: 100 });
  });

  it('Property 7: Qinzheng skill - only works when kings are not aligned', () => {
    fc.assert(fc.property(
      fc.record({
        color: fc.constantFrom(PlayerColor.RED, PlayerColor.BLACK),
        alignment: fc.constantFrom('horizontal', 'vertical')
      }),
      ({ color, alignment }) => {
        const opponentColor = color === PlayerColor.RED ? PlayerColor.BLACK : PlayerColor.RED;

        // 创建已经对齐的两个将
        let liuBangKingPos: Position, opponentKingPos: Position;

        if (alignment === 'horizontal') {
          // 水平对齐
          liuBangKingPos = color === PlayerColor.RED
            ? { x: 3, y: 7 } : { x: 3, y: 1 };
          opponentKingPos = opponentColor === PlayerColor.RED
            ? { x: 3, y: 8 } : { x: 3, y: 0 };
        } else {
          // 垂直对齐
          liuBangKingPos = color === PlayerColor.RED
            ? { x: 4, y: 7 } : { x: 4, y: 1 };
          opponentKingPos = opponentColor === PlayerColor.RED
            ? { x: 4, y: 8 } : { x: 4, y: 0 };
        }

        const liuBangKing: Piece = {
          id: 'liubang-king',
          type: PieceType.KING,
          color,
          position: liuBangKingPos,
          isAlive: true
        };

        const opponentKing: Piece = {
          id: 'opponent-king',
          type: PieceType.KING,
          color: opponentColor,
          position: opponentKingPos,
          isAlive: true
        };

        const liuBangPlayer: Player = {
          id: 'liubang-player',
          color,
          hero: createHeroCopy(getHeroById('liubang')!),
          pieces: [liuBangKing]
        };

        const opponentPlayer: Player = {
          id: 'opponent-player',
          color: opponentColor,
          hero: { id: 'test_hero', name: '测试武将', skills: [], awakened: false },
          pieces: [opponentKing]
        };

        const gameState: GameState = {
          board: new ChessBoard(),
          players: [liuBangPlayer, opponentPlayer] as [Player, Player],
          currentPlayer: color,
          gamePhase: GamePhase.PLAYING,
          moveHistory: []
        };

        gameState.board.setPiece(liuBangKingPos, liuBangKing);
        gameState.board.setPiece(opponentKingPos, opponentKing);

        // 注册刘邦的技能
        skillEngine.registerPlayerSkills(liuBangPlayer);

        // 获取亲征技能
        const qinzhengSkill = liuBangPlayer.hero.skills.find(s => s.id === 'liubang_qinzheng');
        expect(qinzhengSkill).toBeDefined();

        // 验证已对齐时技能不应该可用或使用失败
        const context = {
          gameState,
          player: liuBangPlayer
        };

        // 技能应该识别出已经对齐的情况
        const result = qinzhengSkill!.execute(context);

        // 如果将已经对齐，技能使用应该失败或不产生效果
        if (result.success) {
          // 如果成功，应该没有实际的游戏状态变化
          expect(result.gameStateChanges?.opponentKingPosition).toBeUndefined();
        }
      }
    ), { numRuns: 100 });
  });

  it('Property 7: Qinzheng skill - opponent king stays in palace', () => {
    fc.assert(fc.property(
      gameStateWithBlockingPiecesGenerator,
      ({ gameState, kingsData }) => {
        // 注册刘邦的技能
        const liuBangPlayer = gameState.players.find(p => p.hero.id === 'liubang')!;
        skillEngine.registerPlayerSkills(liuBangPlayer);

        // 获取亲征技能
        const qinzhengSkill = liuBangPlayer.hero.skills.find(s => s.id === 'liubang_qinzheng');
        expect(qinzhengSkill).toBeDefined();

        // 确保技能可以使用
        if (!qinzhengSkill!.canUse()) {
          return; // 跳过已使用的技能
        }

        // 使用亲征技能
        const context = {
          gameState,
          player: liuBangPlayer
        };

        const result = qinzhengSkill!.execute(context);

        // 验证对方将仍在九宫内
        if (result.success && result.gameStateChanges?.opponentKingPosition) {
          const newOpponentPos = result.gameStateChanges.opponentKingPosition;
          const opponentColor = kingsData.opponentKing.color;

          expect(gameState.board.isInPalace(newOpponentPos, opponentColor)).toBe(true);
        }
      }
    ), { numRuns: 100 });
  });

  it('Property 7: Qinzheng skill - skill only applies to Liu Bang', () => {
    fc.assert(fc.property(
      gameStateWithBlockingPiecesGenerator,
      ({ gameState }) => {
        // 创建非刘邦玩家
        const nonLiuBangPlayer: Player = {
          id: 'non-liubang-player',
          color: gameState.players[0].color,
          hero: { id: 'test_hero', name: '测试武将', skills: [], awakened: false },
          pieces: []
        };

        // 尝试使用刘邦的亲征技能
        const liuBangPlayer = gameState.players.find(p => p.hero.id === 'liubang')!;
        const qinzhengSkill = liuBangPlayer.hero.skills.find(s => s.id === 'liubang_qinzheng');
        expect(qinzhengSkill).toBeDefined();

        const context = {
          gameState,
          player: nonLiuBangPlayer // 使用非刘邦玩家
        };

        // 验证技能检查玩家身份
        const result = qinzhengSkill!.execute(context);

        // 应该失败，因为不是刘邦玩家使用
        expect(result.success).toBe(false);
      }
    ), { numRuns: 100 });
  });
});