# Data Model: Board UI

## 1. Visual Constants
Located in `src/components/game/board/constants.ts`

```typescript
export const BOARD_CONFIG = {
  GRID_SIZE: 9, // 9 lines
  ROW_SIZE: 10, // 10 lines
  PADDING: 40,  // Padding around grid
  ASPECT_RATIO: 9 / 10,
};

export const COLORS = {
  BOARD_BG: '#f0d9b5', // Light wood
  GRID_LINE: '#8b4513', // Dark brown
  RIVER_BG: '#87ceeb33', // Transparent blue
  
  PIECE_RED_BG: '#fef2f2',
  PIECE_RED_BORDER: '#ef4444',
  PIECE_RED_TEXT: '#dc2626',
  
  PIECE_BLACK_BG: '#f8fafc',
  PIECE_BLACK_BORDER: '#1e293b',
  PIECE_BLACK_TEXT: '#0f172a',
  
  HIGHLIGHT_SELECTED: 'rgba(255, 255, 0, 0.5)',
  HIGHLIGHT_VALID_MOVE: 'rgba(0, 255, 0, 0.3)',
};
```

## 2. Component Props

### `GameBoardProps`
```typescript
interface GameBoardProps {
  width?: number;
  height?: number;
  // State is implicitly retrieved via useGameStore
}
```

### `PieceProps` (Internal to PieceLayer)
```typescript
interface VisualPieceProps {
  piece: Piece;
  x: number;
  y: number;
  radius: number;
  isSelected: boolean;
  onSelect: (piece: Piece) => void;
}
```
