# Data Model: Fix Long Check Draw Logic

## 1. Move Interface
Located in `src/types/game.ts`.

```typescript
export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  capturedPiece?: Piece;
  timestamp: number;
  
  /**
   * Indicates if this move caused a check on the opponent's King.
   * Calculated and stored at the time of the move.
   */
  isCheck?: boolean; 
}
```

## 2. State Management
`GameManager` and `GameState` remain largely unchanged, but `moveHistory` will now contain `Move` objects with the `isCheck` flag populated.
