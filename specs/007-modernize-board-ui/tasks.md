# Tasks: Modernize Board UI

**Feature**: Modernize Board UI
**Branch**: `007-modernize-board-ui`
**Spec**: `/specs/007-modernize-board-ui/spec.md`
**Plan**: `/specs/007-modernize-board-ui/plan.md`

## Dependencies

- **Critical Path**: Setup -> Constants -> Background -> Pieces -> Integration -> Replacement
- **Parallelizable**: Layer implementation (Background, Highlights, Pieces)

## Phase 1: Setup

- [x] T001 Install konva and react-konva dependencies
- [x] T002 Create directory structure for board components at src/components/game/board

## Phase 2: Foundational

**Goal**: Establish the Canvas infrastructure and responsive sizing.

- [x] T003 Create visual constants (colors, grid size) in src/components/game/board/constants.ts
- [x] T004 Implement KonvaBoard component in src/components/game/board/KonvaBoard.tsx with Stage and ResizeObserver
- [x] T005 Update src/components/game/GameBoard.tsx to dynamically import KonvaBoard with ssr: false

## Phase 3: Core Layers

**Goal**: Implement the visual layers of the board.

- [x] T006 [P] Implement BackgroundLayer in src/components/game/board/BackgroundLayer.tsx (Grid & River)
- [x] T007 [P] Implement HighlightLayer in src/components/game/board/HighlightLayer.tsx (Valid moves & Selection)
- [x] T008 [P] Implement PieceLayer in src/components/game/board/PieceLayer.tsx (Rendering pieces with Konva)

## Phase 4: Integration

**Goal**: Connect the UI to the game logic.

- [x] T009 Integrate layers into KonvaBoard.tsx and connect store interactions (select/move)

## Phase 5: Polish & Cross-Cutting

**Goal**: Ensure smooth UX and 60fps performance.

- [ ] T010 Add animation support to PieceLayer for smooth movement
- [ ] T011 Verify board responsiveness and visual scaling manually
- [ ] T012 Remove FallbackBoard.tsx code if no longer needed (cleanup)

## Implementation Strategy

1.  **Scaffolding**: Get the `Stage` rendering on the screen first (even if empty).
2.  **Static Elements**: Draw the grid and river to verify scale/resolution.
3.  **Dynamic Elements**: Render pieces based on store state.
4.  **Interaction**: Enable clicking pieces and valid moves.
