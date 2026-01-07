# Research: Fix Long Check Draw Logic

## 1. Problem Analysis
The current `getConsecutiveChecks` implementation in `GameManager` incorrectly increments the check counter for *every* move in the last 6 moves, regardless of whether it was a check or not. This causes the game to declare a "Long Check Draw" after any 6 consecutive moves if other end conditions aren't met.

## 2. Solution Options

### Option A: Re-calculate Check on demand
- **Approach**: In `getConsecutiveChecks`, iterate through history and call `isKingInCheck` for each historical state.
- **Pros**: No data model change.
- **Cons**: Expensive. Requires reconstructing board state for up to 6 past moves every time `checkGameEnd` is called.

### Option B: Store Check State in Move (Selected)
- **Approach**: Add `isCheck: boolean` to the `Move` interface. Calculate it once during `executeMove` and store it.
- **Pros**: O(1) lookup during game end check. Clear history record. useful for UI (showing check notification).
- **Cons**: Requires migration of existing data if persisted (not an issue here as storage is in-memory).

## 3. Implementation Details

### Data Model
Update `Move` interface in `src/types/game.ts`:
```typescript
export interface Move {
  // ... existing fields
  isCheck?: boolean; // Optional for backward compatibility, but should be set for new moves
}
```

### Logic
In `GameManager.executeMove`:
1. Execute the move.
2. Calculate `isCheck` by calling `isKingInCheck` on the opponent's King in the *new* state.
3. Store `isCheck` in the `Move` object pushed to history.

In `GameManager.getConsecutiveChecks`:
1. Iterate backwards through `moveHistory`.
2. Count consecutive moves where `isCheck` is true.
3. Break if `isCheck` is false.

## 4. Verification Plan
- Create a test case where 6 non-checking moves occur -> Verify NO draw.
- Create a test case where 6 checking moves occur -> Verify draw.
