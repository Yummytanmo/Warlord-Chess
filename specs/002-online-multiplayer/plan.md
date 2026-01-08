# Implementation Plan: Multiplayer Testing Module

**Branch**: `002-online-multiplayer` | **Date**: 2026-01-08 | **Spec**: [spec.md](./spec.md)
**Input**: Create comprehensive testing module for multiplayer online functionality

**Note**: This plan focuses on creating a dedicated testing infrastructure for the already-implemented multiplayer features.

## Summary

Create a comprehensive testing module to validate the online multiplayer functionality, including room management, real-time synchronization, WebSocket communication, and multi-client scenarios. The testing module will use Vitest for unit/integration tests and Playwright for E2E tests to ensure robust multiplayer gameplay across different network conditions and user scenarios.

## Technical Context

**Language/Version**: TypeScript 5.3.3 with Next.js 14.0.4
**Primary Dependencies**:
- Testing: Vitest 1.1.3, Playwright 1.40.1, @testing-library/react 14.1.2, fast-check 3.15.1
- Multiplayer: Socket.IO 4.8.3 (server), Socket.IO Client 4.7.4
- State Management: Zustand 4.4.7
- Runtime: Node.js HTTP server with custom Socket.IO integration

**Storage**: In-memory Map-based room storage (server-side), sessionStorage (client-side)
**Testing**:
- Unit/Integration: Vitest with fast-check for property-based testing
- E2E: Playwright for multi-browser, multi-client scenarios
- Socket Testing: Socket.IO test utilities for event simulation

**Target Platform**:
- Server: Node.js HTTP server (development & production)
- Client: Modern browsers (Chrome, Firefox, Safari, Edge)

**Project Type**: Web application (Next.js frontend + custom Node.js server with Socket.IO)

**Performance Goals**:
- WebSocket message latency: <200ms p95
- Room creation/join: <1s
- State synchronization: <100ms between clients
- Support 10+ concurrent rooms without degradation

**Constraints**:
- Real-time bidirectional communication required
- Must handle network disconnections gracefully
- Game state must remain consistent across clients
- Support reconnection within session lifetime

**Scale/Scope**:
- Unit tests: 20+ test files covering socket events, room management, state sync
- Integration tests: 10+ scenarios covering multi-client interactions
- E2E tests: 5+ critical user journeys (create → join → play → complete)
- Property tests: Hero selection, game state synchronization

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Principle 1: Player Experience First
**Compliance**: PASS - Testing module ensures robust multiplayer experience by validating:
- Real-time synchronization maintains game flow
- Disconnection handling preserves game state
- Network latency doesn't break gameplay

### ✅ Principle 2: Test-Driven Development (Non-Negotiable)
**Compliance**: PASS - This entire feature IS the testing infrastructure:
- Creating unit tests for socket event handlers
- Integration tests for multi-client scenarios
- Property tests for state synchronization
- E2E tests for complete user journeys

### ✅ Principle 3: Type Safety & Reliability
**Compliance**: PASS - Test code will:
- Use TypeScript strict mode
- Define explicit interfaces for test scenarios
- Type all socket event payloads
- Validate game state consistency with types

### ✅ Principle 4: Performance-First Architecture
**Compliance**: PASS - Tests will validate:
- Socket message latency <200ms
- Room operations <1s
- State sync <100ms between clients
- 10+ concurrent rooms support

### ✅ Principle 5: Incremental Feature Delivery
**Compliance**: PASS - Testing module structured incrementally:
- Phase 1: Unit tests for individual components
- Phase 2: Integration tests for multi-client flows
- Phase 3: E2E tests for complete scenarios
- Each phase independently validates functionality

## Project Structure

### Documentation (this feature)

```text
specs/002-online-multiplayer/
├── plan.md              # This file - implementation plan for testing module
├── research.md          # Phase 0 - Socket.IO testing patterns, multi-client test strategies
├── data-model.md        # Phase 1 - Test scenario data models, mock data structures
├── quickstart.md        # Phase 1 - Guide to running and writing multiplayer tests
├── contracts/           # Phase 1 - Test API contracts for socket events
│   ├── socket-events.yaml
│   └── test-scenarios.yaml
└── tasks.md             # Phase 2 - NOT created by this command
```

### Source Code (repository root)

```text
src/
├── lib/
│   └── multiplayer/              # Existing multiplayer implementation
│       ├── socketClient.ts       # Client-side Socket.IO wrapper
│       ├── socketServer.ts       # Server-side (unused, logic in server.js)
│       ├── roomManager.ts        # Room management utilities
│       └── sessionUtils.ts       # Session/storage utilities
│
└── test/
    ├── unit/                     # Existing unit tests
    ├── properties/               # Existing property tests
    ├── integration/              # NEW: Multi-client integration tests
    │   ├── room-lifecycle.test.ts
    │   ├── game-synchronization.test.ts
    │   ├── hero-selection-multiplayer.test.ts
    │   └── reconnection.test.ts
    │
    └── e2e/                      # NEW: End-to-end Playwright tests
        ├── fixtures/             # Test fixtures and helpers
        │   ├── multiplayer-context.ts
        │   └── game-helpers.ts
        ├── create-and-join-room.spec.ts
        ├── real-time-gameplay.spec.ts
        ├── hero-selection-flow.spec.ts
        ├── disconnection-recovery.spec.ts
        └── concurrent-games.spec.ts

server.js                         # Existing custom server with Socket.IO
tests/
└── server/                       # NEW: Server-side unit tests
    ├── room-manager.test.ts
    ├── socket-events.test.ts
    └── game-state-sync.test.ts
```

**Structure Decision**: This is a web application with separated frontend (Next.js) and backend (custom Node.js + Socket.IO). Testing structure follows the existing pattern:
- Unit tests in `src/test/unit/` for client-side logic
- New integration tests in `src/test/integration/` for multi-client scenarios
- New E2E tests in `src/test/e2e/` for full user journeys
- New server tests in `tests/server/` for Socket.IO event handlers

## Complexity Tracking

> **No violations - all constitution principles are satisfied.**

This testing module enhances the project's quality without adding architectural complexity. All tests follow existing patterns (Vitest, Playwright, TypeScript) and strengthen the TDD principle.
