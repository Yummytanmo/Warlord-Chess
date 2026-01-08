'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { initializeSocket, joinRoom, onRoomJoined, onPlayerStatus, onGameStateUpdate } from '@/lib/multiplayer/socketClient';
import { getSessionId, setCurrentRoomId, getCurrentRoomId, getDisplayName } from '@/lib/multiplayer/sessionUtils';
import { useGameStore } from '@/store/gameStore';
import type { Room } from '@/types/multiplayer';
import { GameBoard } from '@/components/game/GameBoard';
import { GameStatus } from '@/components/game/GameStatus';
import { SkillPanel } from '@/components/game/SkillPanel';
import { MultiplayerHeroSelection } from '@/components/game/MultiplayerHeroSelection';
import { GamePhase } from '@/types/game';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const { gameState, connectToRoom, updateGameState, initializeGame } = useGameStore();
  const playerColor = useGameStore(state => state.playerColor);
  const [room, setRoom] = useState<Room | null>(null);
  const [isJoining, setIsJoining] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!roomId) {
      setError('无效的房间ID');
      setIsJoining(false);
      return;
    }

    // Initialize socket
    const socket = initializeSocket();

    // Get session ID
    const sessionId = getSessionId();
    const displayName = getDisplayName() || '玩家';

    // Setup event listeners
    onRoomJoined(({ room: joinedRoom, yourColor }) => {
      setRoom(joinedRoom);
      setIsJoining(false);
      setCurrentRoomId(joinedRoom.id);
      connectToRoom(joinedRoom.id, yourColor);

      if (joinedRoom.gameState) {
        updateGameState(joinedRoom.gameState);
      }

      toast.success(`已加入房间！你是 ${yourColor === 'red' ? '红方' : '黑方'}`);
    });

    onPlayerStatus(({ status, displayName: playerName }) => {
      if (status === 'connected') {
        toast.success(`${playerName} 已加入房间`);
      } else if (status === 'disconnected') {
        toast.error(`${playerName} 已断开连接`);
      }
    });

    onGameStateUpdate(({ gameState: newState }) => {
      updateGameState(newState);
    });

    // Listen for room updates (when second player joins)
    if (socket) {
      // Handle automatic reconnection
      socket.on('connect', () => {
        console.log('Socket connected/reconnected, verifying room membership...');
        const currentSessionId = getSessionId();
        const currentDisplayName = getDisplayName() || 'Player';
        
        joinRoom({ roomId, sessionId: currentSessionId, displayName: currentDisplayName }, (response) => {
          if (response.success && response.room && response.yourColor) {
            console.log('✅ Automatically re-joined room');
            setRoom(response.room);
            connectToRoom(response.room.id, response.yourColor);
            
            if (response.room.gameState) {
              updateGameState(response.room.gameState);
            }
          } else {
             console.warn('Silent rejoin failed:', response.message);
          }
        });
      });

      socket.on('room:update', ({ room: updatedRoom }) => {
        console.log('Room updated:', updatedRoom);
        setRoom(updatedRoom);
        if (updatedRoom.status === 'active') {
          toast.success('对手已加入，游戏开始！');

          // Initialize game if not already initialized
          if (!gameState || !updatedRoom.gameState) {
            console.log('Initializing game state...');
            initializeGame();

            // Send initialized game state to server
            const initializedState = useGameStore.getState().gameState;
            if (initializedState && socket) {
              socket.emit('game:init', {
                roomId: updatedRoom.id,
                gameState: initializedState
              });
            }
          }
        }
      });
    }

    // Check if already in this room (page refresh)
    const currentRoom = getCurrentRoomId();
    if (currentRoom === roomId) {
      // Rejoin
      joinRoom({ roomId, sessionId, displayName }, (response) => {
        if (response.success && response.room && response.yourColor) {
          setRoom(response.room);
          setIsJoining(false);
          connectToRoom(response.room.id, response.yourColor);

          if (response.room.gameState) {
            updateGameState(response.room.gameState);
          }
        } else {
          setError(response.message || '重新加入房间失败');
          setIsJoining(false);
        }
      });
    } else {
      // Join for first time
      joinRoom({ roomId, sessionId, displayName }, (response) => {
        if (response.success && response.room && response.yourColor) {
          setRoom(response.room);
          setIsJoining(false);
          setCurrentRoomId(response.room.id);
          connectToRoom(response.room.id, response.yourColor);

          if (response.room.gameState) {
            updateGameState(response.room.gameState);
          }
        } else {
          setError(response.message || '加入房间失败');
          setIsJoining(false);
        }
      });
    }

    // Set share URL
    const url = typeof window !== 'undefined' ? window.location.href : '';
    setShareUrl(url);

    // Cleanup
    return () => {
      // Remove room:update listener
      if (socket) {
        socket.off('room:update');
      }
      // Don't disconnect on unmount, only on explicit leave
    };
  }, [roomId, connectToRoom, updateGameState]);

  const handleCopyUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        toast.success('链接已复制到剪贴板！');
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  if (isJoining) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center bg-white rounded-xl shadow-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">正在加入房间...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">无法加入房间</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回首页
          </button>
        </div>
      </main>
    );
  }

  const isWaiting = room?.status === 'waiting';
  const isActive = room?.status === 'active';
  const isMyTurn = gameState && playerColor && gameState.currentPlayer === playerColor;

  // Debug logging
  console.log('=== Room Page Debug ===');
  console.log('room:', room);
  console.log('isActive:', isActive);
  console.log('gameState:', gameState);
  console.log('gameState?.gamePhase:', gameState?.gamePhase);
  console.log('playerColor:', playerColor);
  console.log('Should show hero selection:', isActive && gameState && gameState.gamePhase === GamePhase.HERO_SELECTION && playerColor);
  console.log('=======================');

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />

      <div className="container mx-auto px-4 py-6">
        {/* 房间信息 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">多人游戏房间</h1>
              <p className="text-gray-600">
                房间ID: <span className="font-mono font-semibold">{roomId.substring(0, 8)}...</span>
              </p>
            </div>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              返回首页
            </button>
          </div>

          {/* 分享链接 */}
          {isWaiting && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-2">分享此链接邀请好友加入：</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white font-mono text-sm"
                />
                <button
                  onClick={handleCopyUrl}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copied ? '✓ 已复制' : '复制链接'}
                </button>
              </div>
            </div>
          )}

          {/* 房间状态 */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
              <span className="text-gray-700 font-semibold">
                {isWaiting && '等待玩家加入...'}
                {isActive && '游戏进行中'}
              </span>
            </div>
            <div className="text-gray-600">
              玩家: {room?.players.length || 0} / 2
            </div>
          </div>

          {/* 玩家列表 */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            {room?.players.map((player) => (
              <div key={player.sessionId} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${player.color === 'red' ? 'bg-red-500' : 'bg-gray-800'} flex items-center justify-center text-white font-bold`}>
                    {player.color === 'red' ? '红' : '黑'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{player.displayName}</p>
                    <p className="text-xs text-gray-500">
                      {player.isConnected ? '在线' : '离线'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {room && room.players.length < 2 && (
              <div className="bg-gray-100 rounded-lg p-3 border-2 border-dashed border-gray-300 flex items-center justify-center">
                <p className="text-gray-500">等待玩家...</p>
              </div>
            )}
          </div>
        </div>

        {/* 游戏区域 */}
        {isActive && gameState && (
          <>
            {/* 英雄选择阶段 */}
            {gameState.gamePhase === GamePhase.HERO_SELECTION && playerColor && (
              <div className="flex justify-center">
                <MultiplayerHeroSelection playerColor={playerColor} />
              </div>
            )}

            {/* 游戏进行中 */}
            {gameState.gamePhase === GamePhase.PLAYING && (
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* 左侧面板 - 游戏状态 */}
                <div className="xl:col-span-1 space-y-4">
                  <GameStatus />
                </div>

                {/* 中间 - 游戏棋盘 */}
                <div className="xl:col-span-2 flex flex-col items-center">
                  {/* Turn Indicator */}
                  <div className={`w-full max-w-[600px] mb-4 px-6 py-3 rounded-lg text-center font-semibold transition-all ${
                    isMyTurn
                      ? 'bg-green-100 border-2 border-green-500 text-green-800'
                      : 'bg-gray-100 border-2 border-gray-300 text-gray-600'
                  }`}>
                    {isMyTurn ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-pulse">▶</span>
                        您的回合 - {playerColor === 'red' ? '红方' : '黑方'}
                      </span>
                    ) : (
                      <span>
                        对手回合 - {gameState?.currentPlayer === 'red' ? '红方' : '黑方'}
                      </span>
                    )}
                  </div>

                  {/* Board */}
                  <div className="bg-white rounded-xl shadow-lg p-4">
                    <GameBoard width={600} height={700} />
                  </div>
                </div>

                {/* 右侧面板 - 技能面板 */}
                <div className="xl:col-span-1 space-y-4">
                  <SkillPanel />
                </div>
              </div>
            )}
          </>
        )}

        {/* 等待界面 */}
        {isWaiting && (
          <div className="flex justify-center">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
              <div className="text-6xl mb-4">⏳</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">等待对手加入</h2>
              <p className="text-gray-600 mb-6">
                分享上方链接给你的朋友，当两位玩家都加入后游戏将自动开始！
              </p>
              <div className="animate-pulse text-blue-600 font-semibold">
                等待中...
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
