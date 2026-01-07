'use client';

import React from 'react';
import { Stage, Layer } from 'react-konva';
import { useGameStore } from '@/store/gameStore';
import { BoardBackground } from './BoardBackground';
import { BoardGrid } from './BoardGrid';
import { ChessPiece } from './ChessPiece';
import { BoardHighlights } from './BoardHighlights';
import { Piece } from '@/types/game';

interface GameBoardProps {
  width?: number;
  height?: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({ 
  width = 800, 
  height = 900 
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
      <div className="flex items-center justify-center w-full h-full">
        <p>正在加载游戏...</p>
      </div>
    );
  }

  const cellSize = Math.min(width / 10, height / 12);
  const boardWidth = cellSize * 8;
  const boardHeight = cellSize * 9;
  const offsetX = (width - boardWidth) / 2;
  const offsetY = (height - boardHeight) / 2;

  // 获取所有棋子
  const allPieces = gameState.board.getAllPieces();

  const handlePieceClick = (piece: Piece) => {
    selectPiece(piece);
  };

  const handlePieceDragEnd = (piece: Piece, newX: number, newY: number) => {
    // 验证新位置是否有效
    if (newX >= 0 && newX < 9 && newY >= 0 && newY < 10) {
      const newPosition = { x: newX, y: newY };
      
      // 检查是否是有效移动
      const isValidMove = validMoves.some(
        move => move.x === newX && move.y === newY
      );
      
      if (isValidMove) {
        movePiece(piece.position, newPosition);
      }
    }
  };

  return (
    <div className="flex justify-center items-center">
      <Stage width={width} height={height}>
        <Layer name="background">
          <BoardBackground 
            width={width} 
            height={height} 
            cellSize={cellSize} 
          />
        </Layer>
        
        <Layer name="grid">
          <BoardGrid 
            width={width} 
            height={height} 
            cellSize={cellSize} 
          />
        </Layer>
        
        <Layer name="highlights">
          <BoardHighlights
            validMoves={validMoves}
            cellSize={cellSize}
            offsetX={offsetX}
            offsetY={offsetY}
          />
        </Layer>
        
        <Layer name="pieces">
          {allPieces.map((piece) => (
            <ChessPiece
              key={piece.id}
              piece={piece}
              cellSize={cellSize}
              offsetX={offsetX}
              offsetY={offsetY}
              isSelected={selectedPiece?.id === piece.id}
              onClick={handlePieceClick}
              onDragEnd={handlePieceDragEnd}
            />
          ))}
        </Layer>
        
        <Layer name="effects">
          {/* 技能特效将在后续任务中实现 */}
        </Layer>
      </Stage>
    </div>
  );
};