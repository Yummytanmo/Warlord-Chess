'use client';

import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { FallbackBoard } from './FallbackBoard';

interface GameBoardProps {
  width?: number;
  height?: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({ 
  width = 800, 
  height = 900 
}) => {
  const { gameState } = useGameStore();

  React.useEffect(() => {
    // For now, always use the fallback board to avoid build issues
    // TODO: Implement proper Konva.js integration after build is working
  }, []);

  if (!gameState) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg" style={{ width, height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载棋盘...</p>
        </div>
      </div>
    );
  }

  // Always use fallback board for now to ensure build works
  return <FallbackBoard width={width} height={height} />;
};