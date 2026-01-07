'use client';

import React from 'react';
import { Stage, Layer } from 'react-konva';
import { useGameStore } from '@/store/gameStore';

interface GameBoardProps {
  width?: number;
  height?: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({ 
  width = 800, 
  height = 900 
}) => {
  const { gameState } = useGameStore();

  if (!gameState) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p>正在加载游戏...</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center">
      <Stage width={width} height={height}>
        <Layer name="background">
          {/* TODO: 实现棋盘背景渲染 */}
        </Layer>
        <Layer name="grid">
          {/* TODO: 实现网格线渲染 */}
        </Layer>
        <Layer name="pieces">
          {/* TODO: 实现棋子渲染 */}
        </Layer>
        <Layer name="highlights">
          {/* TODO: 实现高亮效果渲染 */}
        </Layer>
        <Layer name="effects">
          {/* TODO: 实现特效渲染 */}
        </Layer>
      </Stage>
    </div>
  );
};