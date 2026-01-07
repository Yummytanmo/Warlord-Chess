import React from 'react';
import { Line } from 'react-konva';

interface BoardGridProps {
  width: number;
  height: number;
  cellSize: number;
}

/**
 * 棋盘网格组件
 * 渲染棋盘的网格线、九宫线等
 */
export const BoardGrid: React.FC<BoardGridProps> = ({
  width,
  height,
  cellSize
}) => {
  const boardWidth = cellSize * 8; // 8个间隔
  const boardHeight = cellSize * 9; // 9个间隔
  const offsetX = (width - boardWidth) / 2;
  const offsetY = (height - boardHeight) / 2;

  const lines: JSX.Element[] = [];

  // 绘制竖线
  for (let i = 0; i <= 8; i++) {
    const x = offsetX + i * cellSize;
    
    if (i === 0 || i === 8) {
      // 边界线，完整长度
      lines.push(
        <Line
          key={`vertical-${i}`}
          points={[x, offsetY, x, offsetY + boardHeight]}
          stroke="#8B4513"
          strokeWidth={2}
        />
      );
    } else {
      // 中间的竖线，在河界处断开
      lines.push(
        <Line
          key={`vertical-${i}-top`}
          points={[x, offsetY, x, offsetY + cellSize * 4]}
          stroke="#8B4513"
          strokeWidth={1.5}
        />
      );
      lines.push(
        <Line
          key={`vertical-${i}-bottom`}
          points={[x, offsetY + cellSize * 5, x, offsetY + boardHeight]}
          stroke="#8B4513"
          strokeWidth={1.5}
        />
      );
    }
  }

  // 绘制横线
  for (let i = 0; i <= 9; i++) {
    const y = offsetY + i * cellSize;
    lines.push(
      <Line
        key={`horizontal-${i}`}
        points={[offsetX, y, offsetX + boardWidth, y]}
        stroke="#8B4513"
        strokeWidth={i === 0 || i === 9 ? 2 : 1.5}
      />
    );
  }

  // 绘制九宫斜线 - 红方九宫
  lines.push(
    <Line
      key="palace-red-1"
      points={[
        offsetX + cellSize * 3, offsetY + cellSize * 7,
        offsetX + cellSize * 5, offsetY + cellSize * 9
      ]}
      stroke="#8B4513"
      strokeWidth={1.5}
    />
  );
  lines.push(
    <Line
      key="palace-red-2"
      points={[
        offsetX + cellSize * 5, offsetY + cellSize * 7,
        offsetX + cellSize * 3, offsetY + cellSize * 9
      ]}
      stroke="#8B4513"
      strokeWidth={1.5}
    />
  );

  // 绘制九宫斜线 - 黑方九宫
  lines.push(
    <Line
      key="palace-black-1"
      points={[
        offsetX + cellSize * 3, offsetY,
        offsetX + cellSize * 5, offsetY + cellSize * 2
      ]}
      stroke="#8B4513"
      strokeWidth={1.5}
    />
  );
  lines.push(
    <Line
      key="palace-black-2"
      points={[
        offsetX + cellSize * 5, offsetY,
        offsetX + cellSize * 3, offsetY + cellSize * 2
      ]}
      stroke="#8B4513"
      strokeWidth={1.5}
    />
  );

  return <>{lines}</>;
};