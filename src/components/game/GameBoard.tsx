'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useGameStore } from '@/store/gameStore';

// Dynamically import KonvaBoard with SSR disabled (Canvas APIs not available in SSR)
const KonvaBoard = dynamic(
  () => import('./board/KonvaBoard').then(mod => ({ default: mod.KonvaBoard })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载棋盘...</p>
        </div>
      </div>
    )
  }
);

interface GameBoardProps {
  width?: number;
  height?: number;
  flipBoard?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  width = 800,
  height = 900,
  flipBoard = false
}) => {
  const { gameState } = useGameStore();

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

  return <KonvaBoard width={width} height={height} flipBoard={flipBoard} />;
};