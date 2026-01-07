import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  GameState, 
  Piece, 
  Position, 
  PlayerColor, 
  GamePhase,
  Hero
} from '@/types/game';

interface GameStore {
  // 游戏状态
  gameState: GameState | null;
  selectedPiece: Piece | null;
  validMoves: Position[];
  isOnline: boolean;
  roomId: string | null;
  
  // UI状态
  isHeroSelectionOpen: boolean;
  availableHeroes: Hero[];
  
  // Actions
  initializeGame: () => void;
  selectPiece: (piece: Piece | null) => void;
  movePiece: (from: Position, to: Position) => void;
  useSkill: (skillId: string) => void;
  selectHero: (playerId: string, heroId: string) => void;
  
  // 网络相关
  connectToRoom: (roomId: string) => void;
  disconnectFromRoom: () => void;
  updateGameState: (gameState: GameState) => void;
  
  // UI控制
  setHeroSelectionOpen: (open: boolean) => void;
  setAvailableHeroes: (heroes: Hero[]) => void;
}

// 初始游戏状态
const createInitialGameState = (): GameState => ({
  board: {
    grid: Array(10).fill(null).map(() => Array(9).fill(null)),
    BOARD_SIZE: { width: 9, height: 10 },
    getPiece: function(position: Position) {
      if (!this.isValidPosition(position)) return null;
      return this.grid[position.y][position.x];
    },
    setPiece: function(position: Position, piece: Piece | null) {
      if (!this.isValidPosition(position)) return;
      this.grid[position.y][position.x] = piece;
    },
    isValidPosition: function(position: Position) {
      return position.x >= 0 && position.x < 9 && 
             position.y >= 0 && position.y < 10;
    },
    isInPalace: function(position: Position, color: PlayerColor) {
      const palaceX = position.x >= 3 && position.x <= 5;
      if (color === PlayerColor.RED) {
        return palaceX && position.y >= 7 && position.y <= 9;
      } else {
        return palaceX && position.y >= 0 && position.y <= 2;
      }
    },
    hasRiverCrossed: function(position: Position, color: PlayerColor) {
      if (color === PlayerColor.RED) {
        return position.y < 5;
      } else {
        return position.y > 4;
      }
    }
  },
  players: [
    {
      id: 'player1',
      color: PlayerColor.RED,
      hero: {
        id: '',
        name: '',
        skills: [],
        awakened: false
      },
      pieces: []
    },
    {
      id: 'player2',
      color: PlayerColor.BLACK,
      hero: {
        id: '',
        name: '',
        skills: [],
        awakened: false
      },
      pieces: []
    }
  ],
  currentPlayer: PlayerColor.RED,
  gamePhase: GamePhase.HERO_SELECTION,
  moveHistory: []
});

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      // 初始状态
      gameState: null,
      selectedPiece: null,
      validMoves: [],
      isOnline: false,
      roomId: null,
      isHeroSelectionOpen: false,
      availableHeroes: [],

      // Actions
      initializeGame: () => {
        set({ 
          gameState: createInitialGameState(),
          selectedPiece: null,
          validMoves: []
        });
      },

      selectPiece: (piece: Piece | null) => {
        const state = get();
        if (!piece) {
          set({ selectedPiece: null, validMoves: [] });
          return;
        }

        // 只能选择当前玩家的棋子
        if (state.gameState && piece.color === state.gameState.currentPlayer) {
          // TODO: 计算有效移动位置
          const validMoves: Position[] = [];
          set({ selectedPiece: piece, validMoves });
        } else {
          // 如果不是当前玩家的棋子，清除选择
          set({ selectedPiece: null, validMoves: [] });
        }
      },

      movePiece: (from: Position, to: Position) => {
        const state = get();
        if (!state.gameState || !state.selectedPiece) return;

        if (state.isOnline && state.roomId) {
          // 发送到服务器
          // TODO: 实现WebSocket通信
          console.log('Sending move to server:', { from, to });
        } else {
          // 本地游戏
          // TODO: 实现移动逻辑
          console.log('Local move:', { from, to });
          
          // 切换玩家
          const newGameState = { ...state.gameState };
          newGameState.currentPlayer = 
            state.gameState.currentPlayer === PlayerColor.RED 
              ? PlayerColor.BLACK 
              : PlayerColor.RED;
          
          set({ 
            gameState: newGameState,
            selectedPiece: null,
            validMoves: []
          });
        }
      },

      useSkill: (skillId: string) => {
        const state = get();
        if (!state.gameState) return;

        // TODO: 实现技能使用逻辑
        console.log('Using skill:', skillId);
      },

      selectHero: (playerId: string, heroId: string) => {
        const state = get();
        if (!state.gameState) return;

        // TODO: 实现武将选择逻辑
        console.log('Selecting hero:', { playerId, heroId });
      },

      // 网络相关
      connectToRoom: (roomId: string) => {
        set({ isOnline: true, roomId });
        // TODO: 实现WebSocket连接
      },

      disconnectFromRoom: () => {
        set({ isOnline: false, roomId: null });
        // TODO: 断开WebSocket连接
      },

      updateGameState: (gameState: GameState) => {
        set({ gameState });
      },

      // UI控制
      setHeroSelectionOpen: (open: boolean) => {
        set({ isHeroSelectionOpen: open });
      },

      setAvailableHeroes: (heroes: Hero[]) => {
        set({ availableHeroes: heroes });
      }
    }),
    {
      name: 'game-store',
    }
  )
);