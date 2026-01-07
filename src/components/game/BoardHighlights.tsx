import React from 'react';
import { Circle } from 'react-konva';
import { Position } from '@/types/game';

interface BoardHighlightsProps {
  validMoves: Position[];
  cellSize: number;
  offsetX: number;
  offsetY: number;
}

/**
 * 棋盘高亮组件
 * 显示可移动位置的高亮效果
 */
export const BoardHighlights: React.FC<BoardHighlightsProps> = ({
  validMoves,
  cellSize,
  offsetX,
  offsetY
}) => {
  return (
    <>
      {validMoves.map((position, index) => {
        const x = offsetX + position.x * cellSize;
        const y = offsetY + position.y * cellSize;
        
        return (
          <Circle
            key={`highlight-${index}`}
            x={x}
            y={y}
            radius={cellSize * 0.15}
            fill="#32CD32"
            opacity={0.7}
            shadowColor="black"
            shadowBlur={2}
            shadowOffset={{ x: 1, y: 1 }}
            shadowOpacity={0.3}
          />
        );
      })}
    </>
  );
};