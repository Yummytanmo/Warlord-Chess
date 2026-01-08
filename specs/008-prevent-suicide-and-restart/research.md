# Research Findings

## Suicide Prevention
- **Current Logic**: `GameManager.executeMove` validates moves using `moveValidator` but does not check if the move results in self-check.
- **Proposed Logic**:
  - In `executeMove`, after creating `newGameState` (but before returning success), check `isPlayerInCheck(newGameState, currentPlayer)`.
  - If true, return `success: false` with error "Cannot move into check".
  - This leverages existing `isPlayerInCheck` logic.

## Restart / Reselect
- **Socket Events**:
  - Need new events for request/response flow.
  - `game:restart:request`, `game:restart:response`
  - `game:reselect:request`, `game:reselect:response`
- **State Management**:
  - `GameManager` needs `restartGame(players)` to reset board but keep players.
  - `GameManager` needs `resetToHeroSelection(players)` to clear heroes and reset phase.
