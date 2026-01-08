# Feature Specification: Suicide Prevention and Restart Options

## Overview
This feature aims to enhance the gameplay experience by enforcing standard chess rules regarding "suicide" moves (moving into check) and providing options to restart the game or reselect heroes.

## Requirements

### 1. Prevent Suicide Moves (No "Send General")
- **Validation**: The game must validate that a player's move does not leave their own King (General) in check.
- **Feedback**: If a player attempts a move that results in their own King being in check, the move must be rejected.
- **Prompt**: Display a visual prompt or toast message (e.g., "General!" or "Cannot move into check") when a suicide move is attempted.

### 2. Restart Game
- **UI**: Add a "Restart Game" button to the game interface (likely in the GameStatus panel).
- **Logic**:
  - Resets the board to the initial chess arrangement.
  - Keeps the current players and their selected heroes.
  - Resets game history and turn counters.
  - Requires mutual agreement? (For multiplayer, usually yes, but for now we can implement as a request/accept flow or just direct restart if it's friendly). *Assumption: Follows Draw/Undo pattern with request/accept.*

### 3. Reselect Hero
- **UI**: Add a "Reselect Hero" button.
- **Logic**:
  - Ends the current game.
  - Returns both players to the Hero Selection phase.
  - Resets the board and game state.
  - Requires mutual agreement (Request/Accept flow).

## Technical Constraints
- Must integrate with existing `GameManager` and `GameStore`.
- Must work in Multiplayer mode using Socket.IO events.
- UI should be consistent with existing dialogs (Draw/Undo).
