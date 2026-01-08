import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  GameState,
  Piece,
  Position,
  PlayerColor,
  GamePhase,
  Move,
  GameError,
  Skill
} from '@/types/game';
import { GameManager } from '@/lib/gameManager';
import { ChessBoard } from '@/lib/board';
import { HeroClass, createHeroCopy } from '@/lib/heroes';
import toast from 'react-hot-toast';
import {
  initializeSocket,
  disconnectSocket,
  makeMove as socketMakeMove,
  useSkill as socketUseSkill,
  selectHero as socketSelectHero,
  requestDraw as socketRequestDraw,
  respondDraw as socketRespondDraw,
  requestUndo as socketRequestUndo,
  respondUndo as socketRespondUndo,
  surrender as socketSurrender,
  onGameStateUpdate,
  onPlayerStatus,
  onGameEnd,
  onDrawRequested,
  onDrawResponded,
  onUndoRequested,
  onUndoResponded,
  getSocket
} from '@/lib/multiplayer/socketClient';
import type { GameMovePayload, UseSkillPayload } from '@/types/multiplayer';

/**
 * 从序列化的gameState重建Board实例
 * Socket.IO传输会丢失类方法，需要重新实例化
 */
function reconstructBoard(serializedGameState: any): GameState {
  const board = new ChessBoard();

  // 复制grid数据
  if (serializedGameState.board && serializedGameState.board.grid) {
    board.grid = serializedGameState.board.grid;
  }

  // 返回带有正确Board实例的gameState
  return {
    ...serializedGameState,
    board
  };
}

interface GameStore {
  // 游戏状态
  gameState: GameState | null;
  selectedPiece: Piece | null;
  validMoves: Position[];
  isOnline: boolean;
  roomId: string | null;
  playerColor: PlayerColor | null; // Player's color in multiplayer

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
  connectToRoom: (roomId: string, playerColor: PlayerColor) => void;
  disconnectFromRoom: () => void;
  updateGameState: (gameState: GameState) => void;

  // Draw/Undo state
  drawRequestReceived: boolean;
  undoRequestReceived: boolean;
  requestingPlayerName: string | null;

  // Actions - Draw/Undo/Surrender
  requestDraw: () => void;
  acceptDraw: () => void;
  rejectDraw: () => void;
  requestUndo: () => void;
  acceptUndo: () => void;
  rejectUndo: () => void;
  surrender: () => void;

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

// Store listener cleanup functions
let socketListenersCleanup: (() => void) | null = null;

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      // 初始状态
      gameState: null,
      selectedPiece: null,
      validMoves: [],
      isOnline: false,
      roomId: null,
      playerColor: null,
      gameManager: new GameManager(),
      isHeroSelectionOpen: false,
      lastError: null,

      // Draw/Undo state
      drawRequestReceived: false,
      undoRequestReceived: false,
      requestingPlayerName: null,

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
          // Optimistic update: apply move locally
          const result = state.gameManager.executeMove(state.gameState, move);

          if (result.success && result.newGameState) {
            set({
              gameState: result.newGameState,
              selectedPiece: null,
              validMoves: [],
              lastError: null
            });

            // Check if game ended
            const gameEndResult = state.gameManager.checkGameEnd(result.newGameState);
            if (gameEndResult.isGameOver) {
              // Game ended - notify server
              const socket = getSocket();
              if (socket) {
                socket.emit('game:end', {
                  result: gameEndResult.winner ? 'checkmate' : 'draw',
                  winner: gameEndResult.winner
                });
              }
            }

            // Send move to server with full game state
            const payload: GameMovePayload = {
              move,
              gameState: result.newGameState,
              gameStateHash: JSON.stringify(result.newGameState).slice(0, 32) // Simple hash
            };

            socketMakeMove(payload, (response) => {
              if (!response.success) {
                // Rollback on server rejection
                if (response.correctState) {
                  set({ gameState: response.correctState });
                }
                toast.error(response.error || '移动失败');
              }
            });
          } else {
            // Invalid move locally
            if (result.error) {
              toast.error(result.error.message);
            }
            return false;
          }

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

        // Capture previous state for rollback
        const previousGameState = JSON.parse(JSON.stringify(state.gameState));

        // Create deep copy of hero to avoid state sharing
        const heroCopy = createHeroCopy(hero);

        const newGameState = state.gameManager.selectHero(state.gameState, playerId, heroCopy);

        if (state.isOnline && state.roomId) {
          // Online game - optimistically update
          set({ gameState: newGameState });

          // Send to server
          socketSelectHero({ gameState: newGameState }, (response) => {
            if (response.success) {
              if (newGameState.gamePhase === GamePhase.PLAYING) {
                toast.success('武将选择完成，游戏开始！');
              }
            } else {
              // Rollback on failure
              console.error('Hero selection failed, rolling back state:', response.error);

              // If we have a correct state from server (not currently returned by selectHero but good practice for future)
              // For now, revert to previous local state
              set({ gameState: reconstructBoard(previousGameState) });

              toast.error(response.error || '英雄选择失败，请重试');
            }
          });
        } else {
          // 本地游戏
          set({ gameState: newGameState });

          if (newGameState.gamePhase === GamePhase.PLAYING) {
            toast.success('武将选择完成，游戏开始！');
          }
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
          // 网络游戏 - 执行技能并发送到服务器
          // Execute skill locally first (optimistic update)
          const result = state.gameManager.useSkill(state.gameState, currentPlayer.id, skillId);

          if (result.success && result.newGameState) {
            // Update local state
            set({
              gameState: result.newGameState,
              lastError: null
            });

            // Send to server with updated game state
            const payload: UseSkillPayload = {
              skillId,
              gameState: result.newGameState,
              targetPieceId: undefined // TODO: add target selection UI
            };

            socketUseSkill(payload, (response) => {
              if (response.success) {
                toast.success('技能使用成功！');
              } else {
                toast.error(response.error || '技能使用失败');
                // Rollback if server rejects (though server should accept since we executed locally)
              }
            });
          } else {
            toast.error(result.error?.message || '技能使用失败');
          }
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

      getAvailableSkills: () => {
        const state = get();
        if (!state.gameState) return [];

        const currentPlayer = state.gameState.players.find(p => p.color === state.gameState!.currentPlayer);
        if (!currentPlayer) return [];

        return state.gameManager.getAvailableSkills(state.gameState, currentPlayer.id);
      },

      getSkillStates: () => {
        const state = get();
        if (!state.gameState) return [];

        const currentPlayer = state.gameState.players.find(p => p.color === state.gameState!.currentPlayer);
        if (!currentPlayer) return [];

        return state.gameManager.getSkillStates(state.gameState, currentPlayer.id);
      },

      // Actions - Draw/Undo/Surrender
      requestDraw: () => {
        const state = get();
        if (!state.isOnline || !state.roomId) {
          toast.error('仅在线对战可用');
          return;
        }
        socketRequestDraw({ roomId: state.roomId }, (response) => {
          if (response.success) {
            toast.success('已发送提和请求');
          } else {
            toast.error(response.error || '请求失败');
          }
        });
      },

      acceptDraw: () => {
        const state = get();
        if (!state.isOnline || !state.roomId) return;
        socketRespondDraw({ roomId: state.roomId, accept: true }, (response) => {
          if (!response.success) toast.error(response.error || '操作失败');
          set({ drawRequestReceived: false, requestingPlayerName: null });
        });
      },

      rejectDraw: () => {
        const state = get();
        if (!state.isOnline || !state.roomId) return;
        socketRespondDraw({ roomId: state.roomId, accept: false }, (response) => {
          if (!response.success) toast.error(response.error || '操作失败');
          set({ drawRequestReceived: false, requestingPlayerName: null });
        });
      },

      requestUndo: () => {
        const state = get();
        if (!state.isOnline || !state.roomId) {
          // Local game undo handled by undoLastMove
          state.undoLastMove();
          return;
        }
        socketRequestUndo({ roomId: state.roomId }, (response) => {
          if (response.success) {
            toast.success('已发送悔棋请求');
          } else {
            toast.error(response.error || '请求失败');
          }
        });
      },

      acceptUndo: () => {
        const state = get();
        if (!state.isOnline || !state.roomId) return;
        socketRespondUndo({ roomId: state.roomId, accept: true }, (response) => {
          if (!response.success) toast.error(response.error || '操作失败');
          set({ undoRequestReceived: false, requestingPlayerName: null });
        });
      },

      rejectUndo: () => {
        const state = get();
        if (!state.isOnline || !state.roomId) return;
        socketRespondUndo({ roomId: state.roomId, accept: false }, (response) => {
          if (!response.success) toast.error(response.error || '操作失败');
          set({ undoRequestReceived: false, requestingPlayerName: null });
        });
      },

      surrender: () => {
        const state = get();
        if (!state.isOnline || !state.roomId) {
          // Local game surrender - just end game
          if (state.gameState) {
            const newState = { ...state.gameState };
            newState.gamePhase = GamePhase.GAME_OVER;
            newState.winner = state.gameState.currentPlayer === PlayerColor.RED ? PlayerColor.BLACK : PlayerColor.RED;
            set({ gameState: newState });
            toast.success('游戏结束');
          }
          return;
        }

        if (confirm('确定要认输吗？')) {
          socketSurrender({ roomId: state.roomId }, (response) => {
            if (!response.success) toast.error(response.error || '操作失败');
          });
        }
      },

      // Actions - 网络相关
      connectToRoom: (roomId: string, playerColor: PlayerColor) => {
        // Initialize Socket.IO connection
        initializeSocket();

        // Clean up existing game-specific listeners to prevent duplicates or stale closures
        if (socketListenersCleanup) {
          socketListenersCleanup();
          socketListenersCleanup = null;
        }

        // Setup event listeners for game state updates
        const cleanupGameState = onGameStateUpdate(({ gameState, lastMove }) => {
          // 重建Board实例（Socket.IO传输会丢失类方法）
          const reconstructedState = reconstructBoard(gameState);
          set({ gameState: reconstructedState, lastError: null });

          // Show toast only if the move was made by the opponent
          if (lastMove && lastMove.piece.color !== playerColor) {
            toast.success('对手已移动');
          }
        });

        // Listen for player status changes
        const cleanupPlayerStatus = onPlayerStatus(({ status, displayName }) => {
          if (status === 'connected') {
            toast.success(`${displayName} 已加入`);
          } else if (status === 'disconnected') {
            toast.error(`${displayName} 已断开连接`);
          } else if (status === 'reconnected') {
            toast.success(`${displayName} 已重新连接`);
          }
        });

        // Listen for game end
        const cleanupGameEnd = onGameEnd(({ result, winner }) => {
          const currentState = get().gameState;

          if (currentState) {
            // Update game state to GAME_OVER phase
            currentState.gamePhase = GamePhase.GAME_OVER;
            currentState.winner = winner;

            set({
              gameState: currentState,
              isOnline: false,
              roomId: null,
              playerColor: null,
              drawRequestReceived: false,
              undoRequestReceived: false
            });
          }

          // Clear current room ID from sessionStorage
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('current_room_id');
          }

          // Show appropriate message
          if (result === 'checkmate') {
            toast.success(`游戏结束！${winner === 'red' ? '红方' : '黑方'} 获胜！`);
          } else if (result === 'stalemate') {
            toast('游戏结束！和局');
          } else if (result === 'forfeit') {
            toast.success(`${winner === 'red' ? '红方' : '黑方'} 因对手弃权而获胜`);
          } else if (result === 'timeout') {
            toast('游戏因超时而结束');
          } else if (result === 'draw') {
            toast('游戏结束！协商和局');
          } else if (result === 'surrender') {
            toast.success(`${winner === 'red' ? '红方' : '黑方'} 获胜（对手认输）`);
          }
        });

        // Listen for draw/undo requests
        const cleanupDrawRequest = onDrawRequested(({ requestingPlayerId }) => {
          const state = get();
          const player = state.gameState?.players.find(p => p.id === requestingPlayerId);
          set({
            drawRequestReceived: true,
            requestingPlayerName: player?.displayName || '对手'
          });
        });

        const cleanupDrawResponse = onDrawResponded(({ accepted }) => {
          if (accepted) {
            toast.success('对方同意了和棋请求');
          } else {
            toast.error('对方拒绝了和棋请求');
          }
        });

        const cleanupUndoRequest = onUndoRequested(({ requestingPlayerId }) => {
          const state = get();
          const player = state.gameState?.players.find(p => p.id === requestingPlayerId);
          set({
            undoRequestReceived: true,
            requestingPlayerName: player?.displayName || '对手'
          });
        });

        const cleanupUndoResponse = onUndoResponded(({ accepted }) => {
          if (accepted) {
            toast.success('对方同意了悔棋请求');
            // State update will come via onGameStateUpdate
          } else {
            toast.error('对方拒绝了悔棋请求');
          }
        });

        // Store cleanup function
        socketListenersCleanup = () => {
          cleanupGameState();
          cleanupPlayerStatus();
          cleanupGameEnd();
          cleanupDrawRequest();
          cleanupDrawResponse();
          cleanupUndoRequest();
          cleanupUndoResponse();
        };

        set({ isOnline: true, roomId, playerColor });
        toast.success(`已连接到房间: ${roomId}`);
      },

      disconnectFromRoom: () => {
        // Clean up listeners
        if (socketListenersCleanup) {
          socketListenersCleanup();
          socketListenersCleanup = null;
        }

        // Disconnect socket
        disconnectSocket();

        set({
          isOnline: false,
          roomId: null,
          playerColor: null,
          drawRequestReceived: false,
          undoRequestReceived: false
        });
        toast('已断开网络连接');
      },

      updateGameState: (gameState: GameState) => {
        // 重建Board实例（Socket.IO传输会丢失类方法）
        const reconstructedState = reconstructBoard(gameState);
        set({ gameState: reconstructedState, lastError: null });
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

        // Check if it's this piece's color's turn
        if (piece.color !== state.gameState.currentPlayer) return false;

        // In multiplayer, also check if it's the player's color
        if (state.isOnline && state.playerColor !== null) {
          return piece.color === state.playerColor;
        }

        return true;
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