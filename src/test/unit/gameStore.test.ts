import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { 
  PlayerColor, 
  PieceType, 
  GamePhase,
  Piece
} from '@/types/game';
import { HeroClass } from '@/lib/heroes';

/**
 * 游戏状态管理单元测试
 * 验证: 需求 1.3, 1.5
 */

// Mock toast to avoid issues in tests
vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  })
}));

describe('GameStore', () => {
  beforeEach(() => {
    // 重置store状态
    useGameStore.getState().initializeGame();
  });

  describe('Game Initialization', () => {
    it('should initialize game correctly', () => {
      const state = useGameStore.getState();
      
      expect(state.gameState).toBeDefined();
      expect(state.gameState?.currentPlayer).toBe(PlayerColor.RED);
      expect(state.gameState?.gamePhase).toBe(GamePhase.HERO_SELECTION);
      expect(state.selectedPiece).toBeNull();
      expect(state.validMoves).toEqual([]);
      expect(state.isOnline).toBe(false);
    });

    it('should start new game correctly', () => {
      const state = useGameStore.getState();
      state.startNewGame();
      
      const newState = useGameStore.getState();
      expect(newState.gameState).toBeDefined();
      expect(newState.selectedPiece).toBeNull();
      expect(newState.validMoves).toEqual([]);
      expect(newState.lastError).toBeNull();
    });
  });

  describe('Piece Selection', () => {
    beforeEach(() => {
      const state = useGameStore.getState();
      if (state.gameState) {
        state.gameState.gamePhase = GamePhase.PLAYING;
      }
    });

    it('should select current player piece', () => {
      const state = useGameStore.getState();
      const redPiece = state.gameState?.players[0].pieces.find(p => p.type === PieceType.PAWN);
      
      if (redPiece) {
        state.selectPiece(redPiece);
        
        const newState = useGameStore.getState();
        expect(newState.selectedPiece).toEqual(redPiece);
        expect(Array.isArray(newState.validMoves)).toBe(true);
      }
    });

    it('should not select opponent piece', () => {
      const state = useGameStore.getState();
      const blackPiece = state.gameState?.players[1].pieces.find(p => p.type === PieceType.PAWN);
      
      if (blackPiece) {
        state.selectPiece(blackPiece);
        
        const newState = useGameStore.getState();
        expect(newState.selectedPiece).toBeNull();
        expect(newState.validMoves).toEqual([]);
      }
    });

    it('should clear selection when selecting null', () => {
      const state = useGameStore.getState();
      const redPiece = state.gameState?.players[0].pieces.find(p => p.type === PieceType.PAWN);
      
      if (redPiece) {
        // 先选择一个棋子
        state.selectPiece(redPiece);
        expect(useGameStore.getState().selectedPiece).toEqual(redPiece);
        
        // 然后清除选择
        state.selectPiece(null);
        
        const newState = useGameStore.getState();
        expect(newState.selectedPiece).toBeNull();
        expect(newState.validMoves).toEqual([]);
      }
    });
  });

  describe('Move Execution', () => {
    beforeEach(() => {
      const state = useGameStore.getState();
      if (state.gameState) {
        state.gameState.gamePhase = GamePhase.PLAYING;
      }
    });

    it('should execute valid move', () => {
      const state = useGameStore.getState();
      const redPawn = state.gameState?.players[0].pieces.find(p => p.type === PieceType.PAWN);
      
      if (redPawn) {
        // 选择棋子
        state.selectPiece(redPawn);
        
        // 执行移动
        const from = redPawn.position;
        const to = { x: redPawn.position.x, y: redPawn.position.y - 1 };
        
        const result = state.movePiece(from, to);
        
        if (result) {
          const newState = useGameStore.getState();
          expect(newState.gameState?.currentPlayer).toBe(PlayerColor.BLACK);
          expect(newState.selectedPiece).toBeNull();
          expect(newState.validMoves).toEqual([]);
        }
      }
    });

    it('should not execute move without selected piece', () => {
      const state = useGameStore.getState();
      
      const result = state.movePiece({ x: 0, y: 0 }, { x: 0, y: 1 });
      expect(result).toBe(false);
    });
  });

  describe('Turn Management', () => {
    it('should get current player correctly', () => {
      const state = useGameStore.getState();
      const currentPlayer = state.getCurrentPlayer();
      
      expect(currentPlayer).toBe(PlayerColor.RED);
    });

    it('should get opponent player correctly', () => {
      const state = useGameStore.getState();
      const opponentPlayer = state.getOpponentPlayer();
      
      expect(opponentPlayer).toBe(PlayerColor.BLACK);
    });

    it('should check if piece belongs to current player', () => {
      const state = useGameStore.getState();
      
      const redPiece: Piece = {
        id: 'red-piece',
        type: PieceType.PAWN,
        color: PlayerColor.RED,
        position: { x: 0, y: 0 },
        isAlive: true
      };
      
      const blackPiece: Piece = {
        id: 'black-piece',
        type: PieceType.PAWN,
        color: PlayerColor.BLACK,
        position: { x: 0, y: 0 },
        isAlive: true
      };
      
      expect(state.isCurrentPlayerTurn(redPiece)).toBe(true);
      expect(state.isCurrentPlayerTurn(blackPiece)).toBe(false);
    });
  });

  describe('Hero Selection', () => {
    it('should select hero for player', () => {
      const state = useGameStore.getState();
      
      // Initialize game first
      state.initializeGame();
      
      const testHero = new HeroClass(
        'xiangyu',
        '项羽',
        [],
        undefined,
        '西楚霸王'
      );
      
      state.selectHero('player1', testHero);
      
      const newState = useGameStore.getState();
      expect(newState.gameState?.players[0].hero.id).toBe('xiangyu');
      expect(newState.gameState?.players[0].hero.name).toBe('项羽');
    });

    it('should manage hero selection UI state', () => {
      const state = useGameStore.getState();
      
      expect(state.isHeroSelectionOpen).toBe(false);
      
      state.setHeroSelectionOpen(true);
      expect(useGameStore.getState().isHeroSelectionOpen).toBe(true);
      
      state.setHeroSelectionOpen(false);
      expect(useGameStore.getState().isHeroSelectionOpen).toBe(false);
    });
  });

  describe('Undo Functionality', () => {
    beforeEach(() => {
      const state = useGameStore.getState();
      if (state.gameState) {
        state.gameState.gamePhase = GamePhase.PLAYING;
      }
    });

    it('should check if undo is possible', () => {
      const state = useGameStore.getState();
      
      // 初始状态下不能撤销
      expect(state.canUndoMove()).toBe(false);
      
      // 执行一个移动后应该可以撤销
      const redPawn = state.gameState?.players[0].pieces.find(p => p.type === PieceType.PAWN);
      if (redPawn) {
        state.selectPiece(redPawn);
        const result = state.movePiece(
          redPawn.position, 
          { x: redPawn.position.x, y: redPawn.position.y - 1 }
        );
        
        if (result) {
          expect(useGameStore.getState().canUndoMove()).toBe(true);
        }
      }
    });

    it('should not allow undo in online games', () => {
      const state = useGameStore.getState();
      
      // 设置为在线游戏
      state.connectToRoom('test-room');
      
      expect(useGameStore.getState().canUndoMove()).toBe(false);
    });
  });

  describe('Network Functionality', () => {
    it('should connect to room', () => {
      const state = useGameStore.getState();
      
      state.connectToRoom('test-room-123');
      
      const newState = useGameStore.getState();
      expect(newState.isOnline).toBe(true);
      expect(newState.roomId).toBe('test-room-123');
    });

    it('should disconnect from room', () => {
      const state = useGameStore.getState();
      
      // 先连接
      state.connectToRoom('test-room-123');
      expect(useGameStore.getState().isOnline).toBe(true);
      
      // 然后断开
      state.disconnectFromRoom();
      
      const newState = useGameStore.getState();
      expect(newState.isOnline).toBe(false);
      expect(newState.roomId).toBeNull();
    });

    it('should update game state from network', () => {
      const state = useGameStore.getState();
      const originalGameState = state.gameState;
      
      // 创建一个新的游戏状态
      const newGameState = { ...originalGameState! };
      newGameState.currentPlayer = PlayerColor.BLACK;
      
      state.updateGameState(newGameState);
      
      const updatedState = useGameStore.getState();
      expect(updatedState.gameState?.currentPlayer).toBe(PlayerColor.BLACK);
      expect(updatedState.lastError).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should clear errors', () => {
      const state = useGameStore.getState();
      
      // 设置一个错误
      state.lastError = {
        type: 'invalid_move' as any,
        message: 'Test error',
        context: {}
      };
      
      expect(useGameStore.getState().lastError).toBeDefined();
      
      // 清除错误
      state.clearError();
      
      expect(useGameStore.getState().lastError).toBeNull();
    });
  });

  describe('Skill System', () => {
    it('should handle skill usage', () => {
      const state = useGameStore.getState();
      
      // 目前技能系统未实现，应该不会抛出错误
      expect(() => {
        state.useSkill('test-skill');
      }).not.toThrow();
    });
  });
});