# Specification: Fix Long Check Draw Logic

## 1. Background
The current implementation of "Long Check" (continuous checking) detection in `GameManager` is incorrect. It simply counts the number of recent moves without verifying if they are actual checks, causing games to end in a draw prematurely after 6 moves.

## 2. Requirements
- **Accurate Check Detection**: The system must accurately identify if a move results in a "Check" (attacking the opponent's King).
- **Consecutive Check Tracking**: The game must track the sequence of moves to identify consecutive checks.
- **Game End Condition**: If "Long Check" (Perpetual Check) is detected (defined as 3 consecutive checks by one player, or 6 half-moves of checking sequence), the game should end.
  - *Current Intent*: The existing code sets the result to "Draw" (`长将和棋`). The fix will respect this intent for now, ensuring it only triggers on *actual* checks.

## 3. User Stories
- As a player, I want the game to continue normally if I am just moving pieces without checking.
- As a player, I want the game to end (or warn) if my opponent is perpetually checking me, preventing the game from progressing.

## 4. Technical Constraints
- **Performance**: Check detection should be efficient. Avoid expensive re-calculations of past states if possible.
- **Compatibility**: Must integrate with existing `GameManager`, `Move` types, and `ChessMoveValidator`.
- **Testing**: Must include unit/integration tests verifying the fix.
