'use client';

import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useGameStore } from '@/store/gameStore';
import { HeroSelection } from '@/components/game/HeroSelection';
import { SkillPanel } from '@/components/game/SkillPanel';
import { GameStatus } from '@/components/game/GameStatus';
import { GameBoard } from '@/components/game/GameBoard';
import { GamePhase } from '@/types/game';

export default function Home() {
  const { gameState, initializeGame, lastError, clearError, startNewGame } = useGameStore();

  useEffect(() => {
    // 初始化游戏
    initializeGame();
  }, [initializeGame]);

  // 处理错误显示
  useEffect(() => {
    if (lastError) {
      // 错误会通过toast显示，这里可以添加额外的错误处理逻辑
      console.error('Game Error:', lastError);
      
      // 清除错误状态
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [lastError, clearError]);

  if (!gameState) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">正在加载游戏...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50" data-testid="game-container">
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
        {/* 游戏标题 */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            楚汉棋战
          </h1>
          <h2 className="text-2xl font-semibold text-gray-600 mb-4">Warlord Chess</h2>
          <p className="text-lg text-gray-700">结合楚汉英雄技能的创新象棋游戏</p>
        </div>

        {/* 游戏内容 */}
        {gameState.gamePhase === GamePhase.HERO_SELECTION ? (
          <div className="flex justify-center">
            <div className="text-center">
              <p className="text-xl text-gray-600 mb-6">选择您的武将开始游戏</p>
              <HeroSelection />
            </div>
          </div>
        ) : gameState.gamePhase === GamePhase.GAME_OVER ? (
          <div className="flex justify-center">
            <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
              <h2 className="text-3xl font-bold mb-4 text-gray-800">游戏结束</h2>
              {gameState.winner ? (
                <p className="text-xl mb-6 text-gray-600">
                  🎉 {gameState.winner === 'red' ? '红方' : '黑方'}获胜！
                </p>
              ) : (
                <p className="text-xl mb-6 text-gray-600">🤝 平局</p>
              )}
              <div className="space-y-3">
                <button
                  onClick={startNewGame}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  再来一局
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  重新选择武将
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* 左侧面板 - 游戏状态 */}
            <div className="xl:col-span-1 space-y-4">
              <GameStatus />
            </div>

            {/* 中间 - 游戏棋盘 */}
            <div className="xl:col-span-2 flex justify-center">
              <div className="bg-white rounded-xl shadow-lg p-4">
                <GameBoard width={600} height={700} />
              </div>
            </div>

            {/* 右侧面板 - 技能面板 */}
            <div className="xl:col-span-1 space-y-4">
              <SkillPanel />
              
              {/* 重新开始游戏按钮 */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">游戏控制</h3>
                <div className="space-y-2">
                  <button
                    onClick={startNewGame}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    重新开始
                  </button>
                  <HeroSelection />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}