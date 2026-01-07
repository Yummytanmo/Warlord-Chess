import React from 'react';
import { Layer, Circle, Ring } from 'react-konva';
import { Position } from '@/types/game';
import {
  COLORS,
  VALID_MOVE_CONFIG,
  PIECE_CONFIG,
  LAYER_NAMES,
  gridToPixel,
} from './constants';

interface HighlightLayerProps {
  selectedPosition: Position | null;
  validMoves: Position[];
}

/**
 * HighlightLayer - Renders selection highlights and valid move indicators
 * Updates frequently based on player interactions
 */
export const HighlightLayer: React.FC<HighlightLayerProps> = ({
  selectedPosition,
  validMoves,
}) => {
  const renderSelection = () => {
    if (!selectedPosition) return null;

    const pos = gridToPixel(selectedPosition.x, selectedPosition.y);

    return (
      <React.Fragment key="selection">
        {/* Outer glow ring */}
        <Ring
          x={pos.x}
          y={pos.y}
          innerRadius={PIECE_CONFIG.radius + 2}
          outerRadius={PIECE_CONFIG.radius + 8}
          fill={COLORS.selectionGlow}
          opacity={0.4}
          listening={false}
        />
        
        {/* Selection ring */}
        <Circle
          x={pos.x}
          y={pos.y}
          radius={PIECE_CONFIG.radius + 4}
          stroke={COLORS.selection}
          strokeWidth={PIECE_CONFIG.selectionStrokeWidth}
          listening={false}
        />
      </React.Fragment>
    );
  };

  const renderValidMoves = () => {
    return validMoves.map((move, index) => {
      const pos = gridToPixel(move.x, move.y);

      return (
        <Circle
          key={`valid-${index}-${move.x}-${move.y}`}
          x={pos.x}
          y={pos.y}
          radius={VALID_MOVE_CONFIG.radius}
          fill={COLORS.validMove}
          opacity={VALID_MOVE_CONFIG.opacity}
          listening={false}
          // Add subtle shadow for depth
          shadowBlur={5}
          shadowOpacity={0.5}
          shadowColor={COLORS.validMove}
        />
      );
    });
  };

  return (
    <Layer name={LAYER_NAMES.highlights}>
      {renderSelection()}
      {renderValidMoves()}
    </Layer>
  );
};
