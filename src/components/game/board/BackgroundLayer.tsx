import React from 'react';
import { Layer, Rect, Line, Text } from 'react-konva';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  BOARD_COLS,
  BOARD_ROWS,
  COLORS,
  GRID_CONFIG,
  LAYER_NAMES,
  gridToPixel,
} from './constants';

/**
 * BackgroundLayer - Renders the static board background, grid, and river
 * This layer rarely needs to re-render, optimizing performance
 */
export const BackgroundLayer: React.FC = () => {
  const renderGridLines = () => {
    const lines: JSX.Element[] = [];

    // Horizontal lines (all 10 rows)
    for (let y = 0; y < BOARD_ROWS; y++) {
      const startPos = gridToPixel(0, y);
      const endPos = gridToPixel(BOARD_COLS - 1, y);
      
      lines.push(
        <Line
          key={`h-${y}`}
          points={[startPos.x, startPos.y, endPos.x, endPos.y]}
          stroke={COLORS.gridLine}
          strokeWidth={GRID_CONFIG.lineWidth}
          listening={false} // Optimization: no hit detection needed
        />
      );
    }

    // Vertical lines (columns split by river)
    for (let x = 0; x < BOARD_COLS; x++) {
      // Top section (rows 0-4)
      const topStart = gridToPixel(x, 0);
      const topEnd = gridToPixel(x, 4);
      
      lines.push(
        <Line
          key={`v-top-${x}`}
          points={[topStart.x, topStart.y, topEnd.x, topEnd.y]}
          stroke={COLORS.gridLine}
          strokeWidth={GRID_CONFIG.lineWidth}
          listening={false}
        />
      );

      // Bottom section (rows 5-9)
      const bottomStart = gridToPixel(x, 5);
      const bottomEnd = gridToPixel(x, 9);
      
      lines.push(
        <Line
          key={`v-bottom-${x}`}
          points={[bottomStart.x, bottomStart.y, bottomEnd.x, bottomEnd.y]}
          stroke={COLORS.gridLine}
          strokeWidth={GRID_CONFIG.lineWidth}
          listening={false}
        />
      );
    }

    // Palace diagonal lines (九宫格)
    GRID_CONFIG.palaceLines.forEach((line, index) => {
      const fromPos = gridToPixel(line.from.x, line.from.y);
      const toPos = gridToPixel(line.to.x, line.to.y);
      
      lines.push(
        <Line
          key={`palace-${index}`}
          points={[fromPos.x, fromPos.y, toPos.x, toPos.y]}
          stroke={COLORS.gridLine}
          strokeWidth={GRID_CONFIG.lineWidth}
          listening={false}
        />
      );
    });

    return lines;
  };

  const renderRiver = () => {
    const riverStart = gridToPixel(0, GRID_CONFIG.riverY);
    const riverWidth = gridToPixel(BOARD_COLS - 1, 0).x - riverStart.x;

    return (
      <>
        {/* River background */}
        <Rect
          x={riverStart.x}
          y={riverStart.y - GRID_CONFIG.riverHeight / 2}
          width={riverWidth}
          height={GRID_CONFIG.riverHeight}
          fill={COLORS.river}
          opacity={0.3}
          listening={false}
        />

        {/* River text - 楚河 (Chu River) */}
        <Text
          x={riverStart.x + riverWidth * 0.2}
          y={riverStart.y - 12}
          text="楚河"
          fontSize={20}
          fontFamily="KaiTi, STKaiti, SimSun, serif"
          fontStyle="bold"
          fill={COLORS.riverText}
          listening={false}
        />

        {/* River text - 汉界 (Han Border) */}
        <Text
          x={riverStart.x + riverWidth * 0.65}
          y={riverStart.y - 12}
          text="汉界"
          fontSize={20}
          fontFamily="KaiTi, STKaiti, SimSun, serif"
          fontStyle="bold"
          fill={COLORS.riverText}
          listening={false}
        />
      </>
    );
  };

  return (
    <Layer name={LAYER_NAMES.background}>
      {/* Board background */}
      <Rect
        x={0}
        y={0}
        width={BOARD_WIDTH}
        height={BOARD_HEIGHT}
        fill={COLORS.background}
        listening={false}
      />

      {/* Grid lines */}
      {renderGridLines()}

      {/* River */}
      {renderRiver()}
    </Layer>
  );
};
