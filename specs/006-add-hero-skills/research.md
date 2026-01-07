# Research: Hero Skills Implementation

## 1. Multi-Stage Turns (Zhangliang, Xiaohe, Xiangyu)
**Problem**: Current `GameManager` switches turn immediately after a valid move. Some skills require multiple moves by the same player.
**Solution**:
- Add `turnState` to `GameState`:
  ```typescript
  interface TurnState {
    phase: 'normal' | 'extra_move' | 'force_move';
    activeSkillId?: string; // The skill causing this state
    requiredPieceId?: string; // If must move specific piece (Xiaohe)
    allowedPieceTypes?: PieceType[]; // If restricted (Zhangliang: no Chariot)
    remainingMoves: number;
  }
  ```
- In `executeMove`:
  - Check `turnState`.
  - If `extra_move`, validate against constraints.
  - If valid, apply move.
  - Decrement `remainingMoves`. If 0, clear `turnState` and switch turn.

## 2. Hanxin's Pawn Placement (Dian Bing)
**Problem**: Need UI and Logic to place pieces.
**Solution**:
- Logic: Use `useSkill` API.
  - Payload: `{ targetPosition: Position, count: number }`.
- UI:
  - When skill activated, show highlight on valid placement zones (River bank).
  - User clicks cell -> Trigger `useSkill`.

## 3. Initial Positions (Xiaohe/Fankui)
**Problem**: Need to know "Initial Position" of a piece.
**Solution**:
- Standard Setup is static.
- Add helper `PieceSetup.getInitialPosition(pieceId: string): Position`.
- Use deterministic IDs (e.g. `red-chariot-left` -> `{x:0, y:9}`).

## 4. Piece Exchange/Removal (Fankui/Hanxin)
**Problem**: Removing/Swapping pieces.
**Solution**:
- `SkillResult` already supports `gameStateChanges`.
- Just manipulate `board.grid` and `player.pieces` in `skill.execute()`.
