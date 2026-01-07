import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  GameState, 
  Piece, 
  Position, 
  PlayerColor, 
  GamePhase,
  Hero,
  Move
} from '@/types/game';
import { ChessBoard } from '@/lib/board';
import { ChessMoveValidator } from '@/lib/moveValidator';
import { PieceSetup } from '@/lib/pieceSetup';

interface GameStore {
  // 游戏状态
  gameState: GameState | null;
  selectedPiece: Piece | null;
  validMoves: Position[];
  isOnline: boolean;
  roomId: string | null;
  
  // 游戏逻辑
  moveValidator: ChessMoveValidator;
  
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
const createInitialGameState = (): GameState => {
  const board = new ChessBoard();
  const pieces = PieceSetup.createStandardSetup();
  
  // 将棋子放置到棋盘上
  PieceSetup.setupBoard(board, pieces);
  
  return {
    board,
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
        pieces: PieceSetup.getPiecesByColor(pieces, PlayerColor.RED)
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
        pieces: PieceSetup.getPiecesByColor(pieces, PlayerColor.BLACK)
      }
    ],
    currentPlayer: PlayerColor.RED,
    gamePhase: GamePhase.PLAYING, // 暂时跳过武将选择阶段
    moveHistory: []
  };
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
      moveValidator: new ChessMoveValidator(),
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
        if (!piece || !state.gameState) {
          set({ selectedPiece: null, validMoves: [] });
          return;
        }

        // 只能选择当前玩家的棋子
        if (piece.color === state.gameState.currentPlayer) {
          // 计算有效移动位置
          const validMoves = state.moveValidator.getValidMoves(piece, state.gameState);
          set({ selectedPiece: piece, validMoves });
        } else {
          // 如果不是当前玩家的棋子，清除选择
          set({ selectedPiece: null, validMoves: [] });
        }
      },

      movePiece: (from: Position, to: Position) => {
        const state = get();
        if (!state.gameState || !state.selectedPiece) return;

          // 创建移动对象
          const capturedPiece = state.gameState.board.getPiece(to);
          const move: Move = {
            from,
            to,
            piece: state.selectedPiece,
            capturedPiece: capturedPiece || undefined,
            timestamp: Date.now()
          };

        // 验证移动是否合法
        const validationResult = state.moveValidator.validateMove(move, state.gameState);
        if (!validationResult.isValid) {
          console.warn('非法移动:', validationResult.reason);
          return;
        }

        if (state.isOnline && state.roomId) {
          // 发送到服务器
          // TODO: 实现WebSocket通信
          console.log('Sending move to server:', { from, to });
        } else {
          // 本地游戏 - 执行移动
          const newGameState = { ...state.gameState };
          const newBoard = newGameState.board.clone();
          
          // 移除起始位置的棋子
          newBoard.setPiece(from, null);
          
          // 在目标位置放置棋子
          const movedPiece = { ...state.selectedPiece, position: to };
          newBoard.setPiece(to, movedPiece);
          
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
          newGameState.moveHistory.push(move);
          
          // 切换玩家
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