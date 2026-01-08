# Tasks: Multiplayer Testing Module

**Feature**: 002-online-multiplayer (Testing Infrastructure)
**Date**: 2026-01-08
**Status**: Ready for Implementation

## Task Summary

| Phase | Tasks | Story | Priority |
|-------|-------|-------|----------|
| Setup | 5 | - | P1 |
| Foundational | 4 | - | P1 |
| US1 - Create Room | 6 | US1 | P1 |
| US2 - Join Room | 6 | US2 | P1 |
| US3 - Real-time Sync | 8 | US3 | P1 |
| US4 - Session Mgmt | 7 | US4 | P2 |
| US5 - Lobby Features | 6 | US5 | P3 |
| Polish | 3 | - | P2 |
| **Total** | **45** | 5 stories | P1-P3 |

## Phase 1: Setup (Test Infrastructure)

**Goal**: Establish testing environment and configuration

- [X] [T1.1] [P1] Configure Vitest for Socket.IO testing in `vitest.config.ts` with test environment settings
- [X] [T1.2] [P1] Create test server startup script in `tests/setup/test-server.ts` to launch Socket.IO server on test port
- [X] [T1.3] [P1] Add Playwright configuration for multi-client E2E tests in `playwright.config.ts`
- [X] [T1.4] [P1] Create test environment variables file `.env.test` with test port and Socket.IO URL
- [X] [T1.5] [P1] Update `package.json` with test scripts: `test:unit`, `test:integration`, `test:e2e`, `test:all`

**Dependencies**: None
**Deliverable**: Fully configured test environment ready to run tests

---

## Phase 2: Foundational (Test Fixtures & Helpers)

**Goal**: Create reusable test utilities and mock data

- [X] [T2.1] [P1] Create test fixtures factory in `tests/fixtures/multiplayer-fixtures.ts` for Room, PlayerSession, GameState
- [X] [T2.2] [P1] Implement Socket.IO mock client helpers in `tests/helpers/socket-helpers.ts` for connection, emit, event waiting
- [X] [T2.3] [P1] Create E2E test helpers in `src/test/e2e/fixtures/multiplayer-context.ts` for multi-browser context management
- [X] [T2.4] [P1] Implement game state assertion utilities in `tests/helpers/game-assertions.ts` for state comparison and validation

**Dependencies**: Phase 1 (Setup)
**Deliverable**: Reusable test utilities and fixtures library

---

## Phase 3: US1 - Create Game Room (P1)

**User Story**: A player wants to start a new online game and share a link with their friend to play together.

### Unit Tests

- [X] [T3.1] [P1] [US1] Unit test room creation logic in `tests/server/room-manager.test.ts` - validates unique ID generation, initial state
- [X] [T3.2] [P1] [US1] Unit test room URL generation in `tests/server/room-manager.test.ts` - validates shareable URL format with room ID

### Integration Tests

- [X] [T3.3] [P1] [US1] Integration test Socket.IO `room:create` event in `src/test/integration/room-lifecycle.test.ts` - validates server response and room storage
- [X] [T3.4] [P1] [US1] Integration test room state persistence in `src/test/integration/room-lifecycle.test.ts` - validates room remains accessible after creation

### E2E Tests

- [X] [T3.5] [P1] [US1] E2E test room creation flow in `src/test/e2e/create-and-join-room.spec.ts` - validates UI button click → room creation → URL display
- [X] [T3.6] [P1] [US1] E2E test room details display in `src/test/e2e/create-and-join-room.spec.ts` - validates waiting status, room ID, player count shown

**Acceptance Criteria Validated**:
- ✅ Player clicks "Create Room" → new room created with unique ID and host assignment
- ✅ Room link contains unique room ID and is shareable
- ✅ Player sees waiting status and room details (room ID, player count)

**Dependencies**: Phase 2 (Foundational)
**Deliverable**: Fully tested room creation functionality with shareable links

---

## Phase 4: US2 - Join Game Room via Link (P1)

**User Story**: A player receives a room link from their friend and wants to join the game to start playing.

### Unit Tests

- [X] [T4.1] [P1] [US2] Unit test room join validation in `tests/server/room-manager.test.ts` - validates room capacity enforcement (max 2 players)
- [X] [T4.2] [P1] [US2] Unit test player assignment logic in `tests/server/room-manager.test.ts` - validates second player gets opposite color

### Integration Tests

- [X] [T4.3] [P1] [US2] Integration test Socket.IO `room:join` event in `src/test/integration/room-lifecycle.test.ts` - validates two clients joining same room
- [X] [T4.4] [P1] [US2] Integration test "room full" error in `src/test/integration/room-lifecycle.test.ts` - validates third player rejection

### E2E Tests

- [X] [T4.5] [P1] [US2] E2E test join room via link in `src/test/e2e/create-and-join-room.spec.ts` - validates second browser opens link → joins room
- [X] [T4.6] [P1] [US2] E2E test game auto-start on second player join in `src/test/e2e/create-and-join-room.spec.ts` - validates both players see initial board setup

**Acceptance Criteria Validated**:
- ✅ Player opens valid room link → taken to room with details visible
- ✅ Player clicks "Join Room" → added to room, both players see each other
- ✅ Second player joins → game automatically starts with initial board setup
- ✅ Player tries to join full room → sees "Room is full" message

**Dependencies**: Phase 3 (US1 - Create Room)
**Deliverable**: Fully tested room joining with automatic game start

---

## Phase 5: US3 - Real-time Game Synchronization (P1)

**User Story**: Two players in a room want to play the game with moves synchronized in real-time between both clients.

### Unit Tests

- [X] [T5.1] [P1] [US3] Unit test move validation in `tests/server/socket-events.test.ts` - validates server-side move validation before broadcast
- [X] [T5.2] [P1] [US3] Unit test turn enforcement in `tests/server/socket-events.test.ts` - validates only current player can make moves
- [X] [T5.3] [P1] [US3] Unit test game state broadcast logic in `tests/server/game-state-sync.test.ts` - validates state sent to all room members

### Integration Tests

- [X] [T5.4] [P1] [US3] Integration test move synchronization in `src/test/integration/game-synchronization.test.ts` - validates player 1 move appears on player 2 screen
- [X] [T5.5] [P1] [US3] Integration test turn indicator updates in `src/test/integration/game-synchronization.test.ts` - validates turn indicator switches between players
- [X] [T5.6] [P1] [US3] Integration test hero skill synchronization in `src/test/integration/game-synchronization.test.ts` - validates skill effects visible to both players

### Property Tests

- [X] [T5.7] [P1] [US3] Property test state consistency in `src/test/properties/network-sync.test.ts` - validates both clients have identical game state after move sequences

### E2E Tests

- [X] [T5.8] [P1] [US3] E2E test real-time gameplay in `src/test/e2e/real-time-gameplay.spec.ts` - validates complete game from start to checkmate with move sync

**Acceptance Criteria Validated**:
- ✅ Player 1 makes move → player 2 sees move update in real-time
- ✅ Player's turn begins → only that player can make moves while opponent waits
- ✅ Move is made → game state updates for both players (captured pieces, turn indicator)
- ✅ Hero skills used → skill effects synchronized and visible to both players

**Dependencies**: Phase 4 (US2 - Join Room)
**Deliverable**: Fully tested real-time game synchronization with hero skills

---

## Phase 6: US4 - Game Session Management (P2)

**User Story**: Players want reliable session handling including disconnection recovery and game state persistence.

### Unit Tests

- [ ] [T6.1] [P2] [US4] Unit test session persistence logic in `tests/server/room-manager.test.ts` - validates disconnected player tracking with timestamps
- [ ] [T6.2] [P2] [US4] Unit test timeout enforcement in `tests/server/room-manager.test.ts` - validates game ends after extended disconnection

### Integration Tests

- [ ] [T6.3] [P2] [US4] Integration test reconnection flow in `src/test/integration/reconnection.test.ts` - validates client disconnect → reconnect → state restored
- [ ] [T6.4] [P2] [US4] Integration test opponent notification in `src/test/integration/reconnection.test.ts` - validates "Player disconnected" message to opponent
- [ ] [T6.5] [P2] [US4] Integration test game state recovery in `src/test/integration/reconnection.test.ts` - validates reconnected player sees current game state

### E2E Tests

- [ ] [T6.6] [P2] [US4] E2E test disconnection recovery in `src/test/e2e/disconnection-recovery.spec.ts` - validates network offline → online → game continues
- [ ] [T6.7] [P2] [US4] E2E test page refresh reconnection in `src/test/e2e/disconnection-recovery.spec.ts` - validates browser refresh → auto-rejoin same game

**Acceptance Criteria Validated**:
- ✅ Player loses connection temporarily → can reconnect to same game and resume
- ✅ Player disconnects → opponent sees "Player disconnected, waiting..." message
- ✅ Player disconnected for extended time → game ends with forfeit, opponent notified
- ✅ Player closes browser/tab → game state preserved for reconnection

**Dependencies**: Phase 5 (US3 - Real-time Sync)
**Deliverable**: Fully tested session management with disconnection recovery

---

## Phase 7: US5 - Room Lobby Features (P3)

**User Story**: Players want additional lobby features like player names, chat, and game settings configuration.

### Unit Tests

- [ ] [T7.1] [P3] [US5] Unit test display name validation in `tests/server/room-manager.test.ts` - validates name length and character restrictions
- [ ] [T7.2] [P3] [US5] Unit test lobby chat message broadcast in `tests/server/socket-events.test.ts` - validates message sent to all room members

### Integration Tests

- [ ] [T7.3] [P3] [US5] Integration test display name updates in `src/test/integration/room-lifecycle.test.ts` - validates name changes visible to both players
- [ ] [T7.4] [P3] [US5] Integration test lobby chat in `src/test/integration/room-lifecycle.test.ts` - validates messages appear for both players

### E2E Tests

- [ ] [T7.5] [P3] [US5] E2E test lobby features in `src/test/e2e/create-and-join-room.spec.ts` - validates player can set name and send chat messages
- [ ] [T7.6] [P3] [US5] E2E test game settings in `src/test/e2e/create-and-join-room.spec.ts` - validates host changes settings → both players see updates

**Acceptance Criteria Validated**:
- ✅ Player in lobby → can set display name
- ✅ Player sends message → message appears for both players
- ✅ Host changes game settings → settings update for both players
- ✅ Players ready → host starts game → game begins with selected settings

**Dependencies**: Phase 4 (US2 - Join Room)
**Deliverable**: Fully tested lobby features with player names and chat

---

## Phase 8: Polish & Documentation

**Goal**: Performance testing, documentation, and test coverage validation

- [ ] [T8.1] [P2] Performance test move latency in `tests/performance/latency.test.ts` - validates <200ms move synchronization on localhost
- [ ] [T8.2] [P2] Performance test concurrent rooms in `tests/performance/load.test.ts` - validates 10+ concurrent rooms without degradation
- [ ] [T8.3] [P2] Update quickstart.md with test running instructions and common debugging scenarios

**Dependencies**: All user story phases
**Deliverable**: Performance validated, test documentation complete

---

## Task Organization Notes

### Parallel Opportunities

Tasks within the same phase can often be executed in parallel:

- **Phase 1 (Setup)**: T1.1, T1.3, T1.4 can run in parallel (different config files)
- **Phase 3 (US1)**: T3.1, T3.2 can run in parallel (same test file, different test cases)
- **Phase 3 (US1)**: T3.3, T3.4 can run in parallel (same test file, different test cases)
- **Phase 4 (US2)**: T4.1, T4.2 can run in parallel (same test file, different test cases)
- **Phase 5 (US3)**: T5.1, T5.2, T5.3 can run in parallel (different aspects of same feature)
- **Phase 5 (US3)**: T5.4, T5.5 can run in parallel (same test file, different test cases)

### MVP Scope Recommendation

**Minimum Viable Testing (MVT)** to validate core multiplayer functionality:

- **Phase 1** (Setup): All tasks - required infrastructure
- **Phase 2** (Foundational): All tasks - required test utilities
- **Phase 3** (US1): All tasks - validates room creation
- **Phase 4** (US2): All tasks - validates room joining
- **Phase 5** (US3): T5.1-T5.6, T5.8 - validates real-time sync (skip T5.7 property tests initially)
- **Phase 6** (US4): Skip initially (P2 priority)
- **Phase 7** (US5): Skip initially (P3 priority)
- **Phase 8** (Polish): Skip initially

**MVT Total**: 28 tasks (covers P1 user stories with basic test coverage)

### Dependencies & Blocking

- **Phase 2** blocks all user story phases
- **Phase 3** blocks Phase 4 (must create room before joining)
- **Phase 4** blocks Phase 5 (must have 2 players before testing gameplay)
- **Phase 4** blocks Phase 7 (lobby features require join functionality)
- **Phase 5** blocks Phase 6 (session management builds on active gameplay)

### Test Coverage Goals

- **Unit Tests**: 80%+ coverage of Socket.IO event handlers and room management logic
- **Integration Tests**: 100% coverage of multi-client scenarios (create → join → play → end)
- **E2E Tests**: 100% coverage of critical user journeys (5 journeys defined in research.md)
- **Property Tests**: State synchronization invariants validated across 1000+ random move sequences

---

## Success Metrics

After completing all tasks:

- ✅ All Socket.IO event handlers have unit tests
- ✅ All multi-client scenarios have integration tests
- ✅ 5 critical user journeys have E2E tests
- ✅ State synchronization validated with property-based tests
- ✅ Test suite runs in <5 minutes total
- ✅ All tests pass on CI/CD pipeline
- ✅ Test documentation complete in quickstart.md

---

**Next Steps**: Begin with Phase 1 (Setup) tasks to establish test infrastructure.
