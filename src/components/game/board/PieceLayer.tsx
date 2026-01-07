import React from 'react';
import { Layer, Circle, Text, Group } from 'react-konva';
import { Piece, PieceType, PlayerColor } from '@/types/game';
import {
  COLORS,
  PIECE_CONFIG,
  LAYER_NAMES,
  gridToPixel,
} from './constants';

interface PieceLayerProps {
  pieces: Piece[];
  selectedPieceId: string | null;
  onPieceClick: (piece: Piece) => void;
}

/**
 * Get the Chinese character for a piece
 */
const getPieceText = (type: PieceType, color: PlayerColor): string => {
  const pieceNames = {
    [PieceType.KING]: color === PlayerColor.RED ? '帅' : '将',
    [PieceType.ADVISOR]: color === PlayerColor.RED ? '仕' : '士',
    [PieceType.ELEPHANT]: color === PlayerColor.RED ? '相' : '象',
    [PieceType.HORSE]: '马',
    [PieceType.CHARIOT]: '车',
    [PieceType.CANNON]: '炮',
    [PieceType.PAWN]: color === PlayerColor.RED ? '兵' : '卒',
  };
  return pieceNames[type];
};

/**
 * PieceLayer - Renders all game pieces with interactions
 * Updates when pieces move or state changes
 * 
 * TODO (T010): Add smooth movement animations using Konva.Tween
 * - Animate piece position changes over PIECE_CONFIG.animationDuration
 * - Add capture animations (scale/fade out)
 * - Consider using react-konva's `to` prop for declarative animations
 */
export const PieceLayer: React.FC<PieceLayerProps> = ({
  pieces,
  selectedPieceId,
  onPieceClick,
}) => {
  const renderPiece = (piece: Piece) => {
    const pos = gridToPixel(piece.position.x, piece.position.y);
    const isSelected = piece.id === selectedPieceId;
    const colorConfig = piece.color === PlayerColor.RED ? COLORS.red : COLORS.black;
    const pieceText = getPieceText(piece.type, piece.color);

    return (
      <Group
        key={piece.id}
        x={pos.x}
        y={pos.y}
        onClick={() => onPieceClick(piece)}
        onTap={() => onPieceClick(piece)}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'pointer';
          }
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'default';
          }
        }}
      >
        {/* Shadow */}
        <Circle
          radius={PIECE_CONFIG.radius}
          fill="black"
          opacity={PIECE_CONFIG.shadowOpacity}
          blur={PIECE_CONFIG.shadowBlur}
          offsetY={PIECE_CONFIG.shadowOffsetY}
          listening={false}
        />

        {/* Piece circle background */}
        <Circle
          radius={PIECE_CONFIG.radius}
          fill={colorConfig.fill}
          stroke={isSelected ? colorConfig.selected : colorConfig.stroke}
          strokeWidth={isSelected ? PIECE_CONFIG.selectionStrokeWidth : PIECE_CONFIG.strokeWidth}
          // Add subtle scale effect on hover
          shadowBlur={isSelected ? 15 : 5}
          shadowColor={isSelected ? colorConfig.selected : 'black'}
          shadowOpacity={isSelected ? 0.6 : 0.3}
        />

        {/* Piece text */}
        <Text
          text={pieceText}
          fontSize={PIECE_CONFIG.fontSize}
          fontFamily={PIECE_CONFIG.fontFamily}
          fontStyle={PIECE_CONFIG.fontStyle}
          fill={colorConfig.text}
          // Center the text
          offsetX={PIECE_CONFIG.fontSize / 2}
          offsetY={PIECE_CONFIG.fontSize / 2}
          align="center"
          verticalAlign="middle"
          listening={false}
        />
      </Group>
    );
  };

  return (
    <Layer name={LAYER_NAMES.pieces}>
      {pieces.filter(p => p.isAlive).map(renderPiece)}
    </Layer>
  );
};
