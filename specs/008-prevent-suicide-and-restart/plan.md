# Implementation Plan: Suicide Prevention and Restart Options

**Branch**: `008-prevent-suicide-and-restart` | **Date**: 2026-01-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-prevent-suicide-and-restart/spec.md`

## Summary

Implement strict validation to prevent moves that result in self-check ("suicide"), providing visual feedback ("General!"). Add multiplayer-supported options to Restart Game and Reselect Hero, utilizing a request-accept flow similar to Draw/Undo.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React, Zustand, Socket.IO, Konva
**Storage**: In-memory (GameStore)
**Testing**: Vitest (Unit), Playwright (E2E)
**Target Platform**: Web (Next.js)
**Project Type**: Web application

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Test-First**: Will create unit tests for `GameManager` suicide prevention and integration tests for restart flows.
- **Component-Based**: New UI elements will be modular (e.g., reuse `Dialog` or create `GameMenu`).

## Project Structure

### Documentation (this feature)

```text
specs/008-prevent-suicide-and-restart/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── socket-events.md
└── tasks.md             # Phase 2 output
```

### Source Code

```text
src/
├── lib/
│   ├── gameManager.ts       # Update executeMove for suicide check, add restart/reselect logic
│   └── multiplayer/
│       └── socketClient.ts  # Add new socket events
├── store/
│   └── gameStore.ts         # Add actions for restart/reselect
├── components/
│   └── game/
│       ├── GameStatus.tsx   # Add Restart/Reselect buttons
│       └── RestartDialog.tsx # New dialog (optional, or reuse generic)
└── test/
    ├── unit/
    │   └── SuicideCheck.test.ts
    └── integration/
        └── restart-flow.test.ts
```

**Structure Decision**: Extend existing `GameManager` and `GameStore`. Add new UI components for the restart/reselect flow.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A       |            |                                      |
