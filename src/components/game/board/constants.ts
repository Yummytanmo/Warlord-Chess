/**
 * Visual constants for the Konva-based board
 */

// Board dimensions (in grid units)
export const BOARD_COLS = 9;
export const BOARD_ROWS = 10;

// Grid configuration
export const GRID_SIZE = 70; // Size of each grid cell in pixels
export const BOARD_PADDING = 40; // Padding around the board

// Calculated dimensions
export const BOARD_WIDTH = (BOARD_COLS - 1) * GRID_SIZE + BOARD_PADDING * 2;
export const BOARD_HEIGHT = (BOARD_ROWS - 1) * GRID_SIZE + BOARD_PADDING * 2;

// Colors - Modern yet traditional palette
export const COLORS = {
  // Board
  background: '#f5deb3', // Wheat/light wood color
  gridLine: '#8b4513', // Saddle brown
  river: '#b0e0e6', // Powder blue
  riverText: '#4a4a4a', // Dark gray

  // Pieces
  red: {
    fill: '#dc2626', // Crimson
    stroke: '#7f1d1d', // Dark crimson
    text: '#fef2f2', // Light red for text
    selected: '#fbbf24', // Amber for selection
  },
  black: {
    fill: '#1f2937', // Charcoal
    stroke: '#030712', // Almost black
    text: '#f9fafb', // Off-white for text
    selected: '#fbbf24', // Amber for selection
  },

  // Interactions
  validMove: '#22c55e', // Green
  validMoveOpacity: 0.6,
  selection: '#fbbf24', // Amber
  selectionGlow: '#f59e0b', // Darker amber
  hover: '#e5e7eb', // Light gray
};

// Piece visual configuration
export const PIECE_CONFIG = {
  radius: 28, // Piece circle radius
  strokeWidth: 3,
  fontSize: 28,
  fontFamily: 'KaiTi, STKaiti, SimSun, serif', // Traditional Chinese fonts
  fontStyle: 'bold',

  // Animation
  animationDuration: 0.3, // seconds

  // Effects
  shadowBlur: 10,
  shadowOpacity: 0.3,
  shadowOffsetY: 3,

  // Selection effect
  selectionStrokeWidth: 4,
  selectionPulseScale: 1.1,
};

// Grid configuration
export const GRID_CONFIG = {
  lineWidth: 2,
  riverHeight: 15, // Height of the river visual indicator
  riverY: 4.5, // Y position of river (between row 4 and 5)

  // Palace (九宫格) diagonal lines
  palaceLines: [
    // Red palace (top)
    { from: { x: 3, y: 0 }, to: { x: 5, y: 2 } },
    { from: { x: 5, y: 0 }, to: { x: 3, y: 2 } },
    // Black palace (bottom)
    { from: { x: 3, y: 7 }, to: { x: 5, y: 9 } },
    { from: { x: 5, y: 7 }, to: { x: 3, y: 9 } },
  ],
};

// Valid move indicator configuration
export const VALID_MOVE_CONFIG = {
  radius: 8,
  opacity: COLORS.validMoveOpacity,
};

// Layer names for organization
export const LAYER_NAMES = {
  background: 'background-layer',
  grid: 'grid-layer',
  highlights: 'highlights-layer',
  pieces: 'pieces-layer',
};

/**
 * Convert grid coordinates (0-8, 0-9) to canvas pixel coordinates
 */
export function gridToPixel(gridX: number, gridY: number): { x: number; y: number } {
  return {
    x: BOARD_PADDING + gridX * GRID_SIZE,
    y: BOARD_PADDING + gridY * GRID_SIZE,
  };
}

/**
 * Convert canvas pixel coordinates to grid coordinates
 */
export function pixelToGrid(pixelX: number, pixelY: number): { x: number; y: number } {
  const gridX = Math.round((pixelX - BOARD_PADDING) / GRID_SIZE);
  const gridY = Math.round((pixelY - BOARD_PADDING) / GRID_SIZE);

  // Clamp to valid board range
  return {
    x: Math.max(0, Math.min(BOARD_COLS - 1, gridX)),
    y: Math.max(0, Math.min(BOARD_ROWS - 1, gridY)),
  };
}

/**
 * Check if grid coordinates are within board bounds
 */
export function isValidGridPosition(x: number, y: number): boolean {
  return x >= 0 && x < BOARD_COLS && y >= 0 && y < BOARD_ROWS;
}

/**
 * Get display position based on board flip state
 * If flipped (Black player view), rotates the board 180 degrees
 */
export function getDisplayPos(x: number, y: number, flip: boolean): { x: number; y: number } {
  if (flip) {
    return {
      x: BOARD_COLS - 1 - x,
      y: BOARD_ROWS - 1 - y,
    };
  }
  return { x, y };
}
