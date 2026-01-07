# Tasks: Fix Long Check Draw Logic

**Feature**: Fix Long Check Draw Logic
**Branch**: `005-fix-long-check-draw`
**Spec**: `/specs/005-fix-long-check-draw/spec.md`
**Plan**: `/specs/005-fix-long-check-draw/plan.md`

## Dependencies

- **Story Order**: [US1] Normal Play -> [US2] Long Check Draw
- **Critical Path**: T001 (Type) -> T003 (Populate Flag) -> T005 (Use Flag) -> T007 (End Game)

## Phase 1: Setup

- [x] T001 Verify feature branch 005-fix-long-check-draw is active

## Phase 2: Foundational

- [x] T002 Update Move interface to include optional isCheck boolean in src/types/game.ts

## Phase 3: User Story 1 - Normal Play (No False Positives)

**Goal**: Ensure normal moves are NOT counted as checks, preventing premature draws.
**Test Criteria**: Game continues past 6 moves if no checks occur.

- [x] T003 [US1] Create unit test verifying Move.isCheck is populated correctly in src/test/unit/gameManager.test.ts
- [x] T004 [US1] Implement isCheck calculation in GameManager.executeMove in src/lib/gameManager.ts
- [x] T005 [US1] Create unit test verifying game does NOT end after 6 non-checking moves in src/test/unit/gameManager.test.ts
- [x] T006 [US1] Update GameManager.getConsecutiveChecks to count only moves with isCheck=true in src/lib/gameManager.ts

## Phase 4: User Story 2 - Long Check Draw (True Positives)

**Goal**: Ensure game ends in a draw ONLY when actual long check (3 repeats/6 moves) occurs.
**Test Criteria**: Game ends with "Long Check Draw" reason after 6 consecutive checking moves.

- [x] T007 [US2] Create unit test verifying game ends after 6 consecutive checking moves in src/test/unit/gameManager.test.ts
- [x] T008 [US2] Review and verify GameManager.checkGameEnd logic uses updated getConsecutiveChecks in src/lib/gameManager.ts

## Phase 5: Polish & Cross-Cutting

- [x] T009 Run full test suite to ensure no regressions in game logic
- [x] T010 [P] Verify performance of check detection does not degrade loop

## Implementation Strategy

1.  **Types First**: Define the data model change.
2.  **Populate Data**: Ensure `isCheck` is correctly calculated for every move.
3.  **Consume Data**: Switch the draw logic to use the new flag.
4.  **Verify**: Test both negative (normal play) and positive (long check) cases.
