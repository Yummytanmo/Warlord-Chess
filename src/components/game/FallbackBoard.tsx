'use client';

import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { Piece, PieceType, PlayerColor } from '@/types/game';

interface FallbackBoardProps {
  width?: number;
  height?: number;
}

/**
 * 备用棋盘组件
 * 当Konva.js无法加载时使用的HTML/CSS实现
 */
export const FallbackBoard: React.FC<FallbackBoardProps> = ({
  width = 600,
  height = 700
}) => {
  const {
    gameState,
    selectedPiece,
    validMoves,
    selectPiece,
    movePiece
  } = useGameStore();

  if (!gameState) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ width, height }}>
        <p className="text-gray-600">正在加载棋盘...</p>
      </div>
    );
  }

  const cellSize = Math.min(width / 9, height / 10);
  const boardWidth = cellSize * 8;
  const boardHeight = cellSize * 9;

  // 获取所有棋子
  const allPieces = gameState.board.getAllPieces();

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

  const handlePieceClick = (piece: Piece) => {
    // 如果已经选中了一个棋子，且点击的是一个有效的移动目标（即吃子），则执行移动
    if (selectedPiece && validMoves.some(move => move.x === piece.position.x && move.y === piece.position.y)) {
      movePiece(selectedPiece.position, piece.position);
    } else {
      // 否则，尝试选择该棋子
      selectPiece(piece);
    }
  };

  const handleCellClick = (x: number, y: number) => {
    if (selectedPiece) {
      const isValidMove = validMoves.some(move => move.x === x && move.y === y);
      if (isValidMove) {
        movePiece(selectedPiece.position, { x, y });
      }
    }
  };

  return (
    <div className="flex justify-center items-center p-4">
      <div
        className="relative bg-amber-50 border-4 border-amber-800 rounded-lg"
        style={{ width: boardWidth + 40, height: boardHeight + 40 }}
      >
        {/* 棋盘网格 */}
        <div className="absolute inset-5">
          {/* 横线 */}
          {Array.from({ length: 10 }, (_, y) => (
            <div
              key={`h-${y}`}
              className="absolute w-full border-t border-amber-800"
              style={{
                top: y * cellSize,
                height: 1
              }}
            />
          ))}

          {/* 竖线 */}
          {Array.from({ length: 9 }, (_, x) => (
            <div
              key={`v-${x}`}
              className="absolute h-full border-l border-amber-800"
              style={{
                left: x * cellSize,
                width: 1
              }}
            />
          ))}

          {/* 河界 */}
          <div
            className="absolute w-full bg-blue-100 opacity-30"
            style={{
              top: cellSize * 4.4,
              height: cellSize * 0.2
            }}
          />

          {/* 河界文字 */}
          <div
            className="absolute text-amber-800 font-bold text-lg"
            style={{
              top: cellSize * 4.5 - 10,
              left: cellSize * 1.5,
            }}
          >
            楚河
          </div>
          <div
            className="absolute text-amber-800 font-bold text-lg"
            style={{
              top: cellSize * 4.5 - 10,
              left: cellSize * 5.5,
            }}
          >
            汉界
          </div>

          {/* 棋盘交点 */}
          {Array.from({ length: 10 }, (_, y) =>
            Array.from({ length: 9 }, (_, x) => {
              const isValidMove = validMoves.some(move => move.x === x && move.y === y);
              return (
                <div
                  key={`cell-${x}-${y}`}
                  className={`absolute w-6 h-6 rounded-full cursor-pointer transition-colors ${isValidMove ? 'bg-green-400 opacity-70' : 'hover:bg-gray-200'
                    }`}
                  style={{
                    left: x * cellSize - 12,
                    top: y * cellSize - 12,
                  }}
                  onClick={() => handleCellClick(x, y)}
                />
              );
            })
          )}

          {/* 棋子 */}
          {allPieces.map((piece) => (
            <div
              key={piece.id}
              className={`absolute w-12 h-12 rounded-full border-2 cursor-pointer transition-all duration-200 flex items-center justify-center font-bold text-lg ${piece.color === PlayerColor.RED
                  ? 'bg-red-100 border-red-600 text-red-800'
                  : 'bg-gray-100 border-gray-800 text-gray-800'
                } ${selectedPiece?.id === piece.id
                  ? 'ring-4 ring-yellow-400 scale-110'
                  : 'hover:scale-105'
                }`}
              style={{
                left: piece.position.x * cellSize - 24,
                top: piece.position.y * cellSize - 24,
                zIndex: selectedPiece?.id === piece.id ? 10 : 5
              }}
              onClick={() => handlePieceClick(piece)}
            >
              {getPieceText(piece.type, piece.color)}
            </div>
          ))}
        </div>

        {/* 游戏信息 */}
        <div className="absolute -bottom-16 left-0 right-0 text-center">
          <p className="text-sm text-gray-600">
            HTML/CSS 棋盘 (Konva.js 备用方案)
          </p>
          {selectedPiece && (
            <p className="text-xs text-blue-600 mt-1">
              已选择: {getPieceText(selectedPiece.type, selectedPiece.color)}
              ({selectedPiece.position.x}, {selectedPiece.position.y})
            </p>
          )}
        </div>
      </div>
    </div>
  );
};