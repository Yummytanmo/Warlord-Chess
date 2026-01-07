import React from 'react';
import { Rect, Text } from 'react-konva';

interface BoardBackgroundProps {
  width: number;
  height: number;
  cellSize: number;
}

/**
 * 棋盘背景组件
 * 渲染棋盘的背景色、边框和河界
 */
export const BoardBackground: React.FC<BoardBackgroundProps> = ({
  width,
  height,
  cellSize
}) => {
  const boardWidth = cellSize * 8; // 8个间隔
  const boardHeight = cellSize * 9; // 9个间隔
  const offsetX = (width - boardWidth) / 2;
  const offsetY = (height - boardHeight) / 2;

  return (
    <>
      {/* 棋盘背景 */}
      <Rect
        x={offsetX - cellSize / 2}
        y={offsetY - cellSize / 2}
        width={boardWidth + cellSize}
        height={boardHeight + cellSize}
        fill="#F5DEB3" // 浅棕色背景
        stroke="#8B4513" // 深棕色边框
        strokeWidth={3}
      />
      
      {/* 河界背景 */}
      <Rect
        x={offsetX - cellSize / 2}
        y={offsetY + cellSize * 4 - cellSize / 4}
        width={boardWidth + cellSize}
        height={cellSize / 2}
        fill="#E6E6FA" // 淡紫色河界
        opacity={0.3}
      />
      
      {/* 河界文字 - 楚河 */}
      <Text
        x={offsetX + cellSize * 1}
        y={offsetY + cellSize * 4.5 - 10}
        text="楚河"
        fontSize={20}
        fontFamily="serif"
        fill="#8B4513"
        align="center"
      />
      
      {/* 河界文字 - 汉界 */}
      <Text
        x={offsetX + cellSize * 5}
        y={offsetY + cellSize * 4.5 - 10}
        text="汉界"
        fontSize={20}
        fontFamily="serif"
        fill="#8B4513"
        align="center"
      />
    </>
  );
};