# Research: Multiplayer Testing Strategies

**Feature**: Online Multiplayer Testing Module
**Date**: 2026-01-08
**Status**: Complete

## Overview

This research document captures the investigation into best practices for testing real-time multiplayer functionality using Socket.IO, including multi-client scenarios, state synchronization, and network condition simulation.

## Decision 1: Socket.IO Testing Approach

### Decision
Use a combination of:
1. **Unit tests** with mock Socket.IO clients for individual event handlers
2. **Integration tests** with real Socket.IO connections for multi-client scenarios
3. **E2E tests** with Playwright for full browser-based user journeys

### Rationale
- **Mock approach** allows fast, isolated unit tests for socket event logic
- **Real connections** are necessary to validate actual WebSocket behavior and timing
- **Browser-based E2E** validates the complete user experience including UI interactions

### Alternatives Considered
1. **Mock-only testing**: Rejected because it doesn't catch real WebSocket timing issues, connection problems, or browser-specific behaviors
2. **E2E-only testing**: Rejected because it's too slow for comprehensive test coverage and harder to debug
3. **Custom test server**: Rejected because Socket.IO has proven testing patterns we can leverage

### Implementation Pattern
```typescript
// Unit test with mocked socket
import { io as ioClient } from 'socket.io-client';

describe('Room Creation', () => {
  it('should create room with unique ID', (done) => {
    const mockSocket = ioClient('http://localhost:3000');
    mockSocket.emit('room:create', { sessionId: '123', displayName: 'Test' }, (response) => {
      expect(response.success).toBe(true);
      expect(response.room.id).toBeDefined();
      done();
    });
  });
});
```

## Decision 2: Multi-Client Test Strategy

### Decision
Use Vitest's concurrent test execution with multiple Socket.IO client instances to simulate multiple players in the same test suite.

### Rationale
- Vitest supports async/concurrent tests natively
- Multiple Socket.IO clients can connect to the same server in a single test
- This approach validates actual multi-client race conditions and synchronization

### Alternatives Considered
1. **Sequential tests with cleanup**: Rejected because it doesn't test concurrent scenarios
2. **Separate test processes**: Rejected because it's harder to coordinate and assert across processes
3. **Docker-based multi-instance**: Rejected as overkill for development testing

### Implementation Pattern
```typescript
import { io as ioClient, Socket } from 'socket.io-client';

describe('Multi-Client Scenarios', () => {
  let client1: Socket, client2: Socket;

  beforeEach(() => {
    client1 = ioClient('http://localhost:3000');
    client2 = ioClient('http://localhost:3000');
  });

  it('should sync game state between two clients', async () => {
    // Client 1 creates room
    const { room } = await new Promise(resolve => {
      client1.emit('room:create', payload, resolve);
    });

    // Client 2 joins room
    await new Promise(resolve => {
      client2.emit('room:join', { roomId: room.id }, resolve);
    });

    // Assert both clients see the same game state
  });
});
```

## Decision 3: State Synchronization Testing

### Decision
Use property-based testing (fast-check) to validate that game state remains consistent across clients under various move sequences.

### Rationale
- Property testing generates hundreds of random move sequences automatically
- Validates that state sync works for edge cases we wouldn't think to test manually
- Aligns with project's constitution requirement for property testing on game logic

### Alternatives Considered
1. **Manual test cases only**: Rejected because multiplayer has exponentially more state combinations
2. **Snapshot testing**: Rejected because game state changes legitimately, making snapshots brittle
3. **Model-based testing**: Considered but deemed too complex for current scope

### Implementation Pattern
```typescript
import fc from 'fast-check';

describe('Game State Synchronization', () => {
  it('should maintain consistent state across clients for any move sequence', () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(fc.tuple(fc.position(), fc.position()), { minLength: 1, maxLength: 20 }),
        async (moves) => {
          // Create two clients
          // Execute move sequence
          // Assert both clients have identical final game state
        }
      )
    );
  });
});
```

## Decision 4: Network Condition Simulation

### Decision
Use Playwright's built-in network throttling and offline simulation for E2E tests. For integration tests, implement manual delay/timeout simulation.

### Rationale
- Playwright provides realistic browser-level network simulation
- Manual delays in integration tests allow controlled testing of specific scenarios
- Validates that the app handles poor network conditions gracefully

### Alternatives Considered
1. **Proxy-based throttling (Toxiproxy)**: Rejected as too complex to set up for every test run
2. **OS-level network shaping**: Rejected because it affects the entire system
3. **Mock delays only**: Rejected because it doesn't test actual network stack behavior

### Implementation Pattern
```typescript
// E2E with Playwright
test('should handle slow network', async ({ page, context }) => {
  await context.route('**/*', route => {
    // Add 500ms delay to all requests
    setTimeout(() => route.continue(), 500);
  });

  // Test reconnection logic
});

// Integration test with manual delay
it('should handle delayed move acknowledgment', async () => {
  const client = ioClient('http://localhost:3000');

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Assert UI shows appropriate loading state
});
```

## Decision 5: Test Data Management

### Decision
Create reusable test fixtures for common scenarios (empty room, room with 2 players, game in progress) using factory functions.

### Rationale
- Reduces test setup boilerplate
- Ensures consistent test data across test suites
- Makes tests more readable by hiding setup complexity

### Alternatives Considered
1. **Inline test data**: Rejected because it creates duplication and inconsistency
2. **Database seeding**: Not applicable (in-memory storage)
3. **Shared mutable state**: Rejected because it creates test interdependencies

### Implementation Pattern
```typescript
// test/fixtures/multiplayer-fixtures.ts
export const createTestRoom = (overrides = {}) => ({
  id: '00000000-0000-0000-0000-000000000000',
  status: 'waiting',
  players: [],
  gameState: null,
  createdAt: Date.now(),
  ...overrides
});

export const createTestPlayer = (color: 'red' | 'black', overrides = {}) => ({
  sessionId: `session-${color}`,
  socketId: `socket-${color}`,
  color,
  displayName: `Player ${color}`,
  joinedAt: Date.now(),
  isConnected: true,
  ...overrides
});
```

## Decision 6: E2E Test Scope

### Decision
Focus E2E tests on 5 critical user journeys:
1. Create and join room
2. Complete game from start to finish
3. Hero selection synchronization
4. Disconnection and reconnection
5. Concurrent games in separate rooms

### Rationale
- E2E tests are slow and brittle, so we focus on high-value paths
- These 5 scenarios cover the most common user flows
- Lower-level tests provide detailed coverage for edge cases

### Alternatives Considered
1. **Comprehensive E2E coverage**: Rejected because it would be too slow
2. **No E2E tests**: Rejected because integration tests don't catch UI-level issues
3. **Visual regression only**: Rejected because multiplayer behavior is more important than appearance

### Test Matrix
| Journey | Primary Goal | Secondary Validations |
|---------|-------------|---------------------|
| Create & Join | Room lifecycle | URL sharing, player assignment |
| Complete Game | Full gameplay | Turn management, win detection |
| Hero Selection | State sync | Both players see choices, game starts after selection |
| Disconnection | Recovery | Reconnect to same game, opponent notification |
| Concurrent Games | Isolation | Multiple rooms don't interfere |

## Decision 7: Test Environment Setup

### Decision
Run tests against the actual development server (server.js) rather than mocking the entire server.

### Rationale
- Tests validate the real server implementation
- No need to maintain separate test server code
- Catches integration issues between Next.js and Socket.IO

### Alternatives Considered
1. **Mock server**: Rejected because it doesn't test the real implementation
2. **Separate test server**: Rejected because it creates maintenance burden
3. **Docker-based testing**: Deferred to CI/CD phase

### Setup Pattern
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globalSetup: './test/setup/global-setup.ts',
    environment: 'jsdom',
    setupFiles: ['./test/setup/test-setup.ts']
  }
});

// test/setup/global-setup.ts
export async function setup() {
  // Start development server on test port
  const server = exec('PORT=3001 node server.js');

  // Wait for server to be ready
  await waitForServer('http://localhost:3001');

  return () => {
    server.kill();
  };
}
```

## Testing Tools & Libraries

### Core Testing Stack
- **Vitest 1.1.3**: Test runner (fast, TypeScript-native)
- **@testing-library/react 14.1.2**: React component testing utilities
- **fast-check 3.15.1**: Property-based testing for state synchronization
- **Playwright 1.40.1**: E2E testing with multi-browser support

### Socket.IO Testing
- **socket.io-client 4.7.4**: Real Socket.IO client for integration tests
- Native Socket.IO mock capabilities for unit tests

### Test Utilities
- **@testing-library/jest-dom 6.2.0**: DOM assertion matchers
- **jsdom 23.2.0**: DOM environment for component tests

## Performance Targets

| Test Type | Target Duration | Acceptable Max |
|-----------|----------------|----------------|
| Unit test suite | <5s | 10s |
| Integration test suite | <15s | 30s |
| Single E2E test | <30s | 60s |
| Full E2E suite | <3min | 5min |
| Complete test run | <5min | 10min |

## Best Practices Identified

1. **Test Isolation**: Each test must clean up socket connections and server state
2. **Deterministic IDs**: Use fixed UUIDs in tests for reproducibility
3. **Explicit Waits**: Always wait for async operations (socket events, state updates)
4. **Error Recovery**: Test error scenarios as thoroughly as happy paths
5. **Parallel Execution**: Run unit/integration tests in parallel, E2E sequentially
6. **Clear Assertions**: Use descriptive test names and assertion messages
7. **Setup/Teardown**: Proper lifecycle management for socket connections

## Open Questions (None Remaining)

All initial research questions have been resolved:
- ✅ How to test Socket.IO with multiple clients
- ✅ Best approach for state synchronization validation
- ✅ Network condition simulation strategy
- ✅ Test data management patterns
- ✅ E2E test scope and focus
- ✅ Test environment setup

## References

- [Socket.IO Testing Guide](https://socket.io/docs/v4/testing/)
- [Vitest Multi-Client Testing](https://vitest.dev/guide/features.html#concurrent)
- [Playwright Network Conditions](https://playwright.dev/docs/network)
- [fast-check Property Testing](https://github.com/dubzzz/fast-check)
- Project Constitution - Test-Driven Development principle
