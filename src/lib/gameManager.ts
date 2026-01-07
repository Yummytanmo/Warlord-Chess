import { 
  GameState, 
  Move, 
  Position, 
  Piece, 
  PlayerColor, 
  GamePhase,
  Player,
  Hero,
  PieceType,
  GameError,
  GameErrorType
} from '@/types/game';
import { ChessBoard } from './board';
import { ChessMoveValidator } from './moveValidator';
import { PieceSetup } from './pieceSetup';
import { SkillEngine, SkillTrigger, globalSkillEngine } from './skillEngine';

/**
 * 游戏管理器类
 * 负责管理游戏状态、回合制逻辑、移动历史记录等核心游戏逻辑
 */
export class GameManager {
  private moveValidator: ChessMoveValidator;
  private skillEngine: SkillEngine;
  private turnCounter: number = 0;

  constructor(skillEngine?: SkillEngine) {
    this.moveValidator = new ChessMoveValidator();
    this.skillEngine = skillEngine || globalSkillEngine;
  }

  /**
   * 创建新游戏
   */
  createNewGame(): GameState {
    const board = new ChessBoard();
    const pieces = PieceSetup.createStandardSetup();
    
    // 将棋子放置到棋盘上
    PieceSetup.setupBoard(board, pieces);
    
    const players: [Player, Player] = [
      {
        id: 'player1',
        color: PlayerColor.RED,
        hero: this.createEmptyHero(),
        pieces: PieceSetup.getPiecesByColor(pieces, PlayerColor.RED)
      },
      {
        id: 'player2',
        color: PlayerColor.BLACK,
        hero: this.createEmptyHero(),
        pieces: PieceSetup.getPiecesByColor(pieces, PlayerColor.BLACK)
      }
    ];

    // 重置技能引擎状态
    this.skillEngine.resetSkillStates();
    this.turnCounter = 0;

    return {
      board,
      players,
      currentPlayer: PlayerColor.RED, // 红方先行
      gamePhase: GamePhase.HERO_SELECTION,
      moveHistory: []
    };
  }

  /**
   * 创建空武将（用于游戏初始化）
   */
  private createEmptyHero(): Hero {
    return {
      id: '',
      name: '未选择',
      skills: [],
      awakened: false
    };
  }

  /**
   * 执行移动
   */
  executeMove(gameState: GameState, move: Move): { success: boolean; newGameState?: GameState; error?: GameError } {
    // 验证游戏状态
    if (gameState.gamePhase !== GamePhase.PLAYING) {
      return {
        success: false,
        error: {
          type: GameErrorType.GAME_STATE_INVALID,
          message: '游戏未在进行中',
          context: { gamePhase: gameState.gamePhase }
        }
      };
    }

    // 验证是否轮到当前玩家
    if (move.piece.color !== gameState.currentPlayer) {
      return {
        success: false,
        error: {
          type: GameErrorType.INVALID_MOVE,
          message: '不是当前玩家的回合',
          context: { currentPlayer: gameState.currentPlayer, pieceColor: move.piece.color }
        }
      };
    }

    // 触发移动前技能
    const currentPlayer = this.getCurrentPlayer(gameState);
    const beforeMoveResults = this.skillEngine.triggerSkills(
      SkillTrigger.BEFORE_MOVE, 
      gameState, 
      { piece: move.piece, move, player: currentPlayer }
    );

    // 检查技能是否阻止了移动
    const blockingResult = beforeMoveResults.find(result => !result.success);
    if (blockingResult) {
      return {
        success: false,
        error: {
          type: GameErrorType.SKILL_NOT_AVAILABLE,
          message: blockingResult.message || '技能阻止了移动',
          context: { move }
        }
      };
    }

    // 应用技能对移动的修改
    let modifiedMove = move;
    for (const result of beforeMoveResults) {
      if (result.modifiedMove) {
        modifiedMove = result.modifiedMove;
      }
    }

    // 验证移动合法性（包括技能修改后的移动）
    const validationResult = this.moveValidator.validateMove(modifiedMove, gameState);
    if (!validationResult.isValid) {
      return {
        success: false,
        error: {
          type: GameErrorType.INVALID_MOVE,
          message: validationResult.reason || '非法移动',
          context: { move: modifiedMove }
        }
      };
    }

    // 执行移动
    const newGameState = this.applyMove(gameState, modifiedMove);
    
    // 触发移动后技能
    const afterMoveResults = this.skillEngine.triggerSkills(
      SkillTrigger.AFTER_MOVE, 
      newGameState, 
      { piece: modifiedMove.piece, move: modifiedMove, player: currentPlayer }
    );

    // 应用移动后技能的游戏状态变化
    for (const result of afterMoveResults) {
      if (result.gameStateChanges) {
        Object.assign(newGameState, result.gameStateChanges);
      }
    }

    // 如果有吃子，触发吃子技能
    if (modifiedMove.capturedPiece) {
      this.skillEngine.triggerSkills(
        SkillTrigger.ON_CAPTURE, 
        newGameState, 
        { 
          piece: modifiedMove.piece, 
          move: modifiedMove, 
          player: currentPlayer,
          capturedPiece: modifiedMove.capturedPiece
        }
      );
    }

    // 更新回合计数器
    this.turnCounter++;
    this.skillEngine.updateTurn(this.turnCounter);

    return {
      success: true,
      newGameState
    };
  }

  /**
   * 应用移动到游戏状态
   */
  private applyMove(gameState: GameState, move: Move): GameState {
    const newGameState = this.cloneGameState(gameState);
    const newBoard = newGameState.board.clone();
    
    // 移除起始位置的棋子
    newBoard.setPiece(move.from, null);
    
    // 在目标位置放置棋子
    const movedPiece = { ...move.piece, position: move.to };
    newBoard.setPiece(move.to, movedPiece);
    
    // 更新玩家的棋子列表
    const currentPlayerIndex = newGameState.currentPlayer === PlayerColor.RED ? 0 : 1;
    const opponentPlayerIndex = 1 - currentPlayerIndex;
    
    // 更新当前玩家的棋子位置
    newGameState.players[currentPlayerIndex].pieces = 
      newGameState.players[currentPlayerIndex].pieces.map(p => 
        p.id === movedPiece.id ? movedPiece : p
      );
    
    // 如果吃子，移除对方棋子
    if (move.capturedPiece) {
      newGameState.players[opponentPlayerIndex].pieces = 
        newGameState.players[opponentPlayerIndex].pieces.map(p => 
          p.id === move.capturedPiece!.id ? { ...p, isAlive: false } : p
        );
    }
    
    // 更新棋盘和移动历史
    newGameState.board = newBoard;
    newGameState.moveHistory = [...newGameState.moveHistory, move];
    
    // 切换玩家回合
    newGameState.currentPlayer = this.getOpponentColor(gameState.currentPlayer);
    
    return newGameState;
  }

  /**
   * 获取对手颜色
   */
  private getOpponentColor(color: PlayerColor): PlayerColor {
    return color === PlayerColor.RED ? PlayerColor.BLACK : PlayerColor.RED;
  }

  /**
   * 深度克隆游戏状态
   */
  private cloneGameState(gameState: GameState): GameState {
    return {
      board: gameState.board.clone(),
      players: [
        {
          ...gameState.players[0],
          pieces: gameState.players[0].pieces.map(p => ({ ...p }))
        },
        {
          ...gameState.players[1],
          pieces: gameState.players[1].pieces.map(p => ({ ...p }))
        }
      ],
      currentPlayer: gameState.currentPlayer,
      gamePhase: gameState.gamePhase,
      moveHistory: [...gameState.moveHistory],
      winner: gameState.winner
    };
  }

  /**
   * 获取当前玩家
   */
  getCurrentPlayer(gameState: GameState): Player {
    return gameState.players.find(p => p.color === gameState.currentPlayer)!;
  }

  /**
   * 获取对手玩家
   */
  getOpponentPlayer(gameState: GameState): Player {
    return gameState.players.find(p => p.color !== gameState.currentPlayer)!;
  }

  /**
   * 检查游戏是否结束
   */
  checkGameEnd(gameState: GameState): { isGameOver: boolean; winner?: PlayerColor; reason?: string } {
    // 检查是否有将被吃掉
    const redKing = gameState.players[0].pieces.find(p => p.type === PieceType.KING && p.isAlive);
    const blackKing = gameState.players[1].pieces.find(p => p.type === PieceType.KING && p.isAlive);

    if (!redKing) {
      return {
        isGameOver: true,
        winner: PlayerColor.BLACK,
        reason: '红方将被吃掉'
      };
    }

    if (!blackKing) {
      return {
        isGameOver: true,
        winner: PlayerColor.RED,
        reason: '黑方将被吃掉'
      };
    }

    // 检查当前玩家是否被将军
    const currentPlayer = this.getCurrentPlayer(gameState);
    const opponentPlayer = this.getOpponentPlayer(gameState);
    const currentKing = currentPlayer.pieces.find(p => p.type === PieceType.KING && p.isAlive);
    
    if (!currentKing) {
      return {
        isGameOver: true,
        winner: opponentPlayer.color,
        reason: `${currentPlayer.color === PlayerColor.RED ? '红方' : '黑方'}将被吃掉`
      };
    }

    // 检查当前玩家是否被将军
    const isInCheck = this.isKingInCheck(currentKing, gameState);
    
    if (isInCheck) {
      // 检查是否是困毙（被将军且无法逃脱）
      const canEscapeCheck = this.canEscapeCheck(currentPlayer, gameState);
      
      if (!canEscapeCheck) {
        return {
          isGameOver: true,
          winner: opponentPlayer.color,
          reason: `${currentPlayer.color === PlayerColor.RED ? '红方' : '黑方'}被困毙`
        };
      }
    } else {
      // 检查是否是无子可动（困毙的另一种形式）
      const hasValidMoves = this.hasValidMoves(currentPlayer, gameState);
      
      if (!hasValidMoves) {
        return {
          isGameOver: true,
          winner: opponentPlayer.color,
          reason: `${currentPlayer.color === PlayerColor.RED ? '红方' : '黑方'}无子可动`
        };
      }
    }

    // 检查是否是长将（连续将军超过3次）
    const consecutiveChecks = this.getConsecutiveChecks(gameState);
    if (consecutiveChecks >= 6) { // 双方各3次
      return {
        isGameOver: true,
        reason: '长将和棋'
      };
    }

    // 检查是否达到移动次数上限（防止无限对局）
    if (gameState.moveHistory.length >= 200) {
      return {
        isGameOver: true,
        reason: '达到移动次数上限，和棋'
      };
    }
    
    return { isGameOver: false };
  }

  /**
   * 检查将是否被将军
   */
  private isKingInCheck(king: Piece, gameState: GameState): boolean {
    const opponentColor = this.getOpponentColor(king.color);
    const opponentPieces = gameState.board.getPiecesByColor(opponentColor);
    
    // 检查是否有对方棋子可以攻击到将
    for (const piece of opponentPieces) {
      if (!piece.isAlive) continue;
      
      const validMoves = this.moveValidator.getValidMoves(piece, gameState);
      if (validMoves.some(move => move.x === king.position.x && move.y === king.position.y)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 检查玩家是否可以逃脱将军
   */
  private canEscapeCheck(player: Player, gameState: GameState): boolean {
    // 尝试所有可能的移动，看是否能逃脱将军
    for (const piece of player.pieces) {
      if (!piece.isAlive) continue;
      
      const validMoves = this.moveValidator.getValidMoves(piece, gameState);
      
      for (const move of validMoves) {
        // 模拟移动
        const testGameState = this.cloneGameState(gameState);
        const testMove: Move = {
          from: piece.position,
          to: move,
          piece: piece,
          timestamp: Date.now()
        };
        
        const result = this.executeMove(testGameState, testMove);
        if (result.success && result.newGameState) {
          // 检查移动后是否还在被将军
          const king = result.newGameState.players.find(p => p.color === player.color)?.pieces.find(p => p.type === PieceType.KING && p.isAlive);
          if (king && !this.isKingInCheck(king, result.newGameState)) {
            return true; // 找到了可以逃脱的移动
          }
        }
      }
    }
    
    return false;
  }

  /**
   * 检查玩家是否有有效移动
   */
  private hasValidMoves(player: Player, gameState: GameState): boolean {
    for (const piece of player.pieces) {
      if (!piece.isAlive) continue;
      
      const validMoves = this.moveValidator.getValidMoves(piece, gameState);
      if (validMoves.length > 0) {
        // 检查这些移动是否会让自己的将被将军
        for (const move of validMoves) {
          const testGameState = this.cloneGameState(gameState);
          const testMove: Move = {
            from: piece.position,
            to: move,
            piece: piece,
            timestamp: Date.now()
          };
          
          const result = this.executeMove(testGameState, testMove);
          if (result.success && result.newGameState) {
            const king = result.newGameState.players.find(p => p.color === player.color)?.pieces.find(p => p.type === PieceType.KING && p.isAlive);
            if (king && !this.isKingInCheck(king, result.newGameState)) {
              return true; // 找到了有效移动
            }
          }
        }
      }
    }
    
    return false;
  }

  /**
   * 获取连续将军次数
   */
  private getConsecutiveChecks(gameState: GameState): number {
    let consecutiveChecks = 0;
    const recentMoves = gameState.moveHistory.slice(-10); // 检查最近10步
    
    // 简化实现：检查最近的移动是否导致将军
    // 实际实现需要更复杂的逻辑来跟踪连续将军
    for (let i = recentMoves.length - 1; i >= 0; i--) {
      // 这里需要检查这个移动是否导致了将军
      // 为了简化，我们假设如果移动后对方将被攻击，就是将军
      consecutiveChecks++;
      if (consecutiveChecks >= 6) break;
    }
    
    return Math.min(consecutiveChecks, 6);
  }

  /**
   * 检查指定玩家是否被将军（但游戏未结束）
   */
  isPlayerInCheck(gameState: GameState, playerColor: PlayerColor): boolean {
    const player = gameState.players.find(p => p.color === playerColor);
    if (!player) return false;
    
    const king = player.pieces.find(p => p.type === PieceType.KING && p.isAlive);
    if (!king) return false;
    
    return this.isKingInCheck(king, gameState);
  }

  /**
   * 获取有效移动位置
   */
  getValidMoves(piece: Piece, gameState: GameState): Position[] {
    return this.moveValidator.getValidMoves(piece, gameState);
  }

  /**
   * 选择武将
   */
  selectHero(gameState: GameState, playerId: string, hero: Hero): GameState {
    const newGameState = this.cloneGameState(gameState);
    const player = newGameState.players.find(p => p.id === playerId);
    
    if (player) {
      player.hero = hero;
      
      // 注册武将的技能到技能引擎
      this.skillEngine.registerPlayerSkills(player);
    }

    // 检查是否两个玩家都选择了武将
    const allPlayersSelectedHero = newGameState.players.every(p => p.hero.id !== '');
    if (allPlayersSelectedHero) {
      newGameState.gamePhase = GamePhase.PLAYING;
      
      // 触发游戏开始技能
      for (const player of newGameState.players) {
        this.skillEngine.triggerSkills(SkillTrigger.ON_GAME_START, newGameState, { player });
      }
    }

    return newGameState;
  }

  /**
   * 撤销上一步移动
   */
  undoLastMove(gameState: GameState): GameState | null {
    if (gameState.moveHistory.length === 0) {
      return null;
    }

    const newGameState = this.cloneGameState(gameState);
    const lastMove = newGameState.moveHistory.pop()!;
    
    // 恢复棋子位置
    const newBoard = newGameState.board.clone();
    
    // 将棋子移回原位置
    const piece = newBoard.getPiece(lastMove.to);
    if (piece) {
      newBoard.setPiece(lastMove.from, { ...piece, position: lastMove.from });
      newBoard.setPiece(lastMove.to, null);
    }
    
    // 如果有被吃的棋子，恢复它
    if (lastMove.capturedPiece) {
      newBoard.setPiece(lastMove.to, { ...lastMove.capturedPiece, isAlive: true });
      
      // 恢复到对手的棋子列表中
      const opponentPlayerIndex = lastMove.piece.color === PlayerColor.RED ? 1 : 0;
      newGameState.players[opponentPlayerIndex].pieces = 
        newGameState.players[opponentPlayerIndex].pieces.map(p => 
          p.id === lastMove.capturedPiece!.id ? { ...lastMove.capturedPiece!, isAlive: true } : p
        );
    }
    
    // 更新当前玩家的棋子位置
    const currentPlayerIndex = lastMove.piece.color === PlayerColor.RED ? 0 : 1;
    newGameState.players[currentPlayerIndex].pieces = 
      newGameState.players[currentPlayerIndex].pieces.map(p => 
        p.id === lastMove.piece.id ? { ...lastMove.piece, position: lastMove.from } : p
      );
    
    newGameState.board = newBoard;
    
    // 切换回合
    newGameState.currentPlayer = lastMove.piece.color;
    
    // 回退回合计数器
    this.turnCounter = Math.max(0, this.turnCounter - 1);
    this.skillEngine.updateTurn(this.turnCounter);
    
    return newGameState;
  }

  /**
   * 使用技能
   */
  useSkill(gameState: GameState, playerId: string, skillId: string): { success: boolean; newGameState?: GameState; error?: GameError } {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      return {
        success: false,
        error: {
          type: GameErrorType.HERO_NOT_FOUND,
          message: '玩家不存在',
          context: { playerId }
        }
      };
    }

    // 检查是否轮到该玩家
    if (player.color !== gameState.currentPlayer) {
      return {
        success: false,
        error: {
          type: GameErrorType.INVALID_MOVE,
          message: '不是当前玩家的回合',
          context: { currentPlayer: gameState.currentPlayer, playerColor: player.color }
        }
      };
    }

    // 使用技能
    const result = this.skillEngine.useSkill(skillId, gameState, player);
    
    if (!result.success) {
      return {
        success: false,
        error: {
          type: GameErrorType.SKILL_NOT_AVAILABLE,
          message: result.message || '技能使用失败',
          context: { skillId }
        }
      };
    }

    // 应用技能效果到游戏状态
    const newGameState = this.cloneGameState(gameState);
    if (result.gameStateChanges) {
      Object.assign(newGameState, result.gameStateChanges);
    }

    return {
      success: true,
      newGameState
    };
  }

  /**
   * 获取玩家可用技能
   */
  getAvailableSkills(gameState: GameState, playerId: string): any[] {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      return [];
    }

    return this.skillEngine.getAvailableSkills(player, gameState);
  }

  /**
   * 获取技能状态
   */
  getSkillStates(gameState: GameState, playerId: string): any[] {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      return [];
    }

    return this.skillEngine.getPlayerSkillStates(player);
  }

  /**
   * 获取技能引擎实例
   */
  getSkillEngine(): SkillEngine {
    return this.skillEngine;
  }
}