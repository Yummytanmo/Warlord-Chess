'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Stage } from 'react-konva';
import { useGameStore } from '@/store/gameStore';
import { Piece } from '@/types/game';
import { BackgroundLayer } from './BackgroundLayer';
import { HighlightLayer } from './HighlightLayer';
import { PieceLayer } from './PieceLayer';
import { BOARD_WIDTH, BOARD_HEIGHT, pixelToGrid } from './constants';

interface KonvaBoardProps {
  width?: number;
  height?: number;
}

/**
 * KonvaBoard - Main canvas-based board component using react-konva
 * Manages the Stage and all layers, handles responsive sizing and interactions
 */
export const KonvaBoard: React.FC<KonvaBoardProps> = ({
  width: propWidth,
  height: propHeight,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    width: propWidth || BOARD_WIDTH,
    height: propHeight || BOARD_HEIGHT,
  });
  
  const {
    gameState,
    selectedPiece,
    validMoves,
    selectPiece,
    movePiece,
  } = useGameStore();

  // Calculate scale to fit container while maintaining aspect ratio
  const scale = Math.min(
    dimensions.width / BOARD_WIDTH,
    dimensions.height / BOARD_HEIGHT
  );

  // Handle responsive resizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: propWidth || width,
          height: propHeight || height,
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [propWidth, propHeight]);

  // Handle piece clicks
  const handlePieceClick = (piece: Piece) => {
    // If a piece is already selected and this is a valid move target, move
    if (selectedPiece && validMoves.some(
      move => move.x === piece.position.x && move.y === piece.position.y
    )) {
      movePiece(selectedPiece.position, piece.position);
    } else {
      // Otherwise, select this piece
      selectPiece(piece);
    }
  };

  // Handle board clicks (empty cell clicks)
  const handleStageClick = (e: any) => {
    // Only handle clicks on the stage itself, not on pieces
    if (e.target === e.target.getStage()) {
      // Convert click position to grid coordinates
      const stage = e.target.getStage();
      const pointerPosition = stage.getPointerPosition();
      
      if (!pointerPosition) return;

      // Account for scaling
      const gridPos = pixelToGrid(
        pointerPosition.x / scale,
        pointerPosition.y / scale
      );

      // Check if this is a valid move
      if (selectedPiece) {
        const isValidMove = validMoves.some(
          move => move.x === gridPos.x && move.y === gridPos.y
        );
        
        if (isValidMove) {
          movePiece(selectedPiece.position, gridPos);
        } else {
          // Click on empty cell with no valid move - deselect
          selectPiece(null);
        }
      }
    }
  };

  if (!gameState) {
    return (
      <div
        ref={containerRef}
        className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载棋盘...</p>
        </div>
      </div>
    );
  }

  const allPieces = gameState.board.getAllPieces();

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center w-full h-full"
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
    >
      <Stage
        width={BOARD_WIDTH * scale}
        height={BOARD_HEIGHT * scale}
        scaleX={scale}
        scaleY={scale}
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        <BackgroundLayer />
        
        <HighlightLayer
          selectedPosition={selectedPiece?.position || null}
          validMoves={validMoves}
        />
        
        <PieceLayer
          pieces={allPieces}
          selectedPieceId={selectedPiece?.id || null}
          onPieceClick={handlePieceClick}
        />
      </Stage>
    </div>
  );
};
