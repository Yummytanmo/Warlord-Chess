import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  GameState, 
  Piece, 
  Position, 
  PlayerColor, 
  GamePhase,
  Move,
  GameError
} from '@/types/game';
import { GameManager } from '@/lib/gameManager';
import { HeroClass, createHeroCopy } from '@/lib/heroes';
import toast from 'react-hot-toast';

interface GameStore {
  // 游戏状态
  gameState: GameState | null;
  selectedPiece: Piece | null;
  validMoves: Position[];
  isOnline: boolean;
  roomId: string | null;
  
  // 游戏管理器
  gameManager: GameManager;
  
  // UI状态
  isHeroSelectionOpen: boolean;
  
  // 错误状态
  lastError: GameError | null;
  
  // Actions - 游戏控制
  initializeGame: () => void;
  startNewGame: () => void;
  selectPiece: (piece: Piece | null) => void;
  movePiece: (from: Position, to: Position) => boolean;
  undoLastMove: () => void;
  
  // Actions - 武将和技能
  selectHero: (playerId: string, hero: HeroClass) => void;
  useSkill: (skillId: string) => void;
  getAvailableSkills: () => Skill[];
  getSkillStates: () => any[];
  
  // Actions - 网络相关
  connectToRoom: (roomId: string) => void;
  disconnectFromRoom: () => void;
  updateGameState: (gameState: GameState) => void;
  
  // Actions - UI控制
  setHeroSelectionOpen: (open: boolean) => void;
  clearError: () => void;
  
  // Getters
  getCurrentPlayer: () => PlayerColor | null;
  getOpponentPlayer: () => PlayerColor | null;
  isCurrentPlayerTurn: (piece: Piece) => boolean;
  canUndoMove: () => boolean;
}

// 初始游戏状态
const createInitialGameState = (): GameState => {
  const gameManager = new GameManager();
  return gameManager.createNewGame();
};

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      // 初始状态
      gameState: null,
      selectedPiece: null,
      validMoves: [],
      isOnline: false,
      roomId: null,
      gameManager: new GameManager(),
      isHeroSelectionOpen: false,
      lastError: null,

      // Actions - 游戏控制
      initializeGame: () => {
        const gameState = createInitialGameState();
        set({ 
          gameState,
          selectedPiece: null,
          validMoves: [],
          lastError: null
        });
      },

      startNewGame: () => {
        const state = get();
        const gameState = state.gameManager.createNewGame();
        set({ 
          gameState,
          selectedPiece: null,
          validMoves: [],
          lastError: null
        });
        toast.success('新游戏开始！');
      },

      selectPiece: (piece: Piece | null) => {
        const state = get();
        if (!piece || !state.gameState) {
          set({ selectedPiece: null, validMoves: [] });
          return;
        }

        // 检查是否是当前玩家的回合
        if (!state.isCurrentPlayerTurn(piece)) {
          toast.error('不是您的回合！');
          set({ selectedPiece: null, validMoves: [] });
          return;
        }

        // 计算有效移动位置
        const validMoves = state.gameManager.getValidMoves(piece, state.gameState);
        set({ selectedPiece: piece, validMoves });
      },

      movePiece: (from: Position, to: Position): boolean => {
        const state = get();
        if (!state.gameState || !state.selectedPiece) {
          return false;
        }

        // 创建移动对象
        const capturedPiece = state.gameState.board.getPiece(to);
        const move: Move = {
          from,
          to,
          piece: state.selectedPiece,
          capturedPiece: capturedPiece || undefined,
          timestamp: Date.now()
        };

        if (state.isOnline && state.roomId) {
          // 网络游戏 - 发送到服务器
          // TODO: 实现WebSocket通信
          console.log('Sending move to server:', { from, to });
          return true;
        } else {
          // 本地游戏 - 执行移动
          const result = state.gameManager.executeMove(state.gameState, move);
          
          if (result.success && result.newGameState) {
            // 检查游戏是否结束
            const gameEndResult = state.gameManager.checkGameEnd(result.newGameState);
            if (gameEndResult.isGameOver) {
              result.newGameState.gamePhase = GamePhase.GAME_OVER;
              result.newGameState.winner = gameEndResult.winner;
              
              // 根据结束原因显示不同的通知
              if (gameEndResult.winner) {
                const winnerName = gameEndResult.winner === PlayerColor.RED ? '红方' : '黑方';
                toast.success(`🎉 游戏结束！${winnerName}获胜！\n原因：${gameEndResult.reason}`);
              } else {
                toast('🤝 游戏结束！' + gameEndResult.reason);
              }
            } else {
              // 检查是否被将军
              const opponentColor = result.newGameState.currentPlayer;
              if (state.gameManager.isPlayerInCheck(result.newGameState, opponentColor)) {
                const playerName = opponentColor === PlayerColor.RED ? '红方' : '黑方';
                toast.error(`⚠️ ${playerName}被将军！`);
              }
            }

            set({ 
              gameState: result.newGameState,
              selectedPiece: null,
              validMoves: [],
              lastError: null
            });
            return true;
          } else {
            // 移动失败
            if (result.error) {
              set({ lastError: result.error });
              toast.error(result.error.message);
            }
            return false;
          }
        }
      },

      undoLastMove: () => {
        const state = get();
        if (!state.gameState || !state.canUndoMove()) {
          toast.error('无法撤销移动');
          return;
        }

        const newGameState = state.gameManager.undoLastMove(state.gameState);
        if (newGameState) {
          set({ 
            gameState: newGameState,
            selectedPiece: null,
            validMoves: [],
            lastError: null
          });
          toast.success('已撤销上一步移动');
        }
      },

      // Actions - 武将和技能
      selectHero: (playerId: string, hero: HeroClass) => {
        const state = get();
        if (!state.gameState) return;

        // 创建武将的深拷贝以避免状态共享
        const heroCopy = createHeroCopy(hero);
        
        const newGameState = state.gameManager.selectHero(state.gameState, playerId, heroCopy);
        set({ gameState: newGameState });
        
        if (newGameState.gamePhase === GamePhase.PLAYING) {
          toast.success('武将选择完成，游戏开始！');
        }
      },

      useSkill: (skillId: string) => {
        const state = get();
        if (!state.gameState) {
          toast.error('游戏未开始');
          return;
        }

        const currentPlayer = state.gameState.players.find(p => p.color === state.gameState!.currentPlayer);
        if (!currentPlayer) {
          toast.error('无法获取当前玩家');
          return;
        }

        if (state.isOnline && state.roomId) {
          // 网络游戏 - 发送到服务器
          console.log('Sending skill use to server:', skillId);
          // TODO: 实现WebSocket通信
        } else {
          // 本地游戏 - 执行技能
          const result = state.gameManager.useSkill(state.gameState, currentPlayer.id, skillId);
          
          if (result.success && result.newGameState) {
            set({ 
              gameState: result.newGameState,
              lastError: null
            });
            toast.success('技能使用成功！');
          } else {
            if (result.error) {
              set({ lastError: result.error });
              toast.error(result.error.message);
            }
          }
        }
      },

      // Actions - 网络相关
      connectToRoom: (roomId: string) => {
        set({ isOnline: true, roomId });
        toast.success(`已连接到房间: ${roomId}`);
        // TODO: 实现WebSocket连接
      },

      disconnectFromRoom: () => {
        set({ isOnline: false, roomId: null });
        toast('已断开网络连接');
        // TODO: 断开WebSocket连接
      },

      updateGameState: (gameState: GameState) => {
        set({ gameState, lastError: null });
      },

      // Actions - UI控制
      setHeroSelectionOpen: (open: boolean) => {
        set({ isHeroSelectionOpen: open });
      },

      clearError: () => {
        set({ lastError: null });
      },

      // Getters
      getCurrentPlayer: () => {
        const state = get();
        return state.gameState?.currentPlayer || null;
      },

      getOpponentPlayer: () => {
        const state = get();
        if (!state.gameState) return null;
        return state.gameState.currentPlayer === PlayerColor.RED 
          ? PlayerColor.BLACK 
          : PlayerColor.RED;
      },

      isCurrentPlayerTurn: (piece: Piece) => {
        const state = get();
        if (!state.gameState) return false;
        return piece.color === state.gameState.currentPlayer;
      },

      canUndoMove: () => {
        const state = get();
        return !!(state.gameState && 
                 state.gameState.moveHistory.length > 0 && 
                 !state.isOnline &&
                 state.gameState.gamePhase === GamePhase.PLAYING);
      }
    }),
    {
      name: 'game-store',
    }
  )
);