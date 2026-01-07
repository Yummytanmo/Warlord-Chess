import React from 'react';
import { Circle, Text, Group } from 'react-konva';
import { Piece, PieceType, PlayerColor } from '@/types/game';

interface ChessPieceProps {
  piece: Piece;
  cellSize: number;
  offsetX: number;
  offsetY: number;
  isSelected?: boolean;
  onClick?: (piece: Piece) => void;
  onDragEnd?: (piece: Piece, newX: number, newY: number) => void;
}

/**
 * 象棋棋子组件
 * 渲染单个棋子，支持拖拽和选择状态，包含动画效果
 */
export const ChessPiece: React.FC<ChessPieceProps> = ({
  piece,
  cellSize,
  offsetX,
  offsetY,
  isSelected = false,
  onClick,
  onDragEnd
}) => {
  // 计算棋子在画布上的位置
  const x = offsetX + piece.position.x * cellSize;
  const y = offsetY + piece.position.y * cellSize;

  // 获取棋子显示文字
  const getPieceText = (type: PieceType, color: PlayerColor): string => {
    const pieceNames = {
      [PieceType.KING]: color === PlayerColor.RED ? '帅' : '将',
      [PieceType.ADVISOR]: color === PlayerColor.RED ? '仕' : '士',
      [PieceType.ELEPHANT]: color === PlayerColor.RED ? '相' : '象',
      [PieceType.HORSE]: '马',
      [PieceType.CHARIOT]: '车',
      [PieceType.CANNON]: '炮',
      [PieceType.PAWN]: color === PlayerColor.RED ? '兵' : '卒'
    };
    return pieceNames[type];
  };

  // 获取棋子颜色
  const getPieceColor = (color: PlayerColor) => {
    return color === PlayerColor.RED ? '#DC143C' : '#000000';
  };

  const handleClick = () => {
    if (onClick) {
      onClick(piece);
    }
  };

  const handleDragStart = () => {
    // 拖拽开始时的动画效果
    return {
      scale: 1.1,
      zIndex: 1000,
      transition: { duration: 0.1 }
    };
  };

  const handleDragEnd = (e: any) => {
    if (onDragEnd) {
      const newX = Math.round((e.target.x() - offsetX) / cellSize);
      const newY = Math.round((e.target.y() - offsetY) / cellSize);
      
      // 如果拖拽到无效位置，回到原位置
      if (newX < 0 || newX > 8 || newY < 0 || newY > 9) {
        e.target.to({
          x: x,
          y: y,
          duration: 0.3
        });
        return;
      }
      
      onDragEnd(piece, newX, newY);
    }
  };

  return (
    <Group
      x={x}
      y={y}
      draggable={true}
      onClick={handleClick}
      onTap={handleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      // 添加悬停效果
      onMouseEnter={(e) => {
        const stage = e.target.getStage();
        if (stage) {
          stage.container().style.cursor = 'pointer';
        }
        // 悬停时轻微放大
        e.target.to({
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 0.1
        });
      }}
      onMouseLeave={(e) => {
        const stage = e.target.getStage();
        if (stage) {
          stage.container().style.cursor = 'default';
        }
        // 恢复原始大小
        e.target.to({
          scaleX: 1,
          scaleY: 1,
          duration: 0.1
        });
      }}
    >
      {/* 棋子背景圆圈 */}
      <Circle
        radius={cellSize * 0.35}
        fill={piece.color === PlayerColor.RED ? '#FFF8DC' : '#F5F5DC'}
        stroke={isSelected ? '#FFD700' : '#8B4513'}
        strokeWidth={isSelected ? 3 : 2}
        shadowColor="black"
        shadowBlur={3}
        shadowOffset={{ x: 1, y: 1 }}
        shadowOpacity={0.3}
      />
      
      {/* 选中状态的外圈 */}
      {isSelected && (
        <Circle
          radius={cellSize * 0.42}
          stroke="#FFD700"
          strokeWidth={2}
          dash={[5, 5]}
        />
      )}
      
      {/* 棋子文字 */}
      <Text
        text={getPieceText(piece.type, piece.color)}
        fontSize={cellSize * 0.3}
        fontFamily="serif"
        fontStyle="bold"
        fill={getPieceColor(piece.color)}
        width={cellSize * 0.7}
        height={cellSize * 0.7}
        offsetX={cellSize * 0.35}
        offsetY={cellSize * 0.35}
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
};