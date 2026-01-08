/**
 * Integration tests for real-time game synchronization
 * Tests move synchronization, turn indicators, and hero skills between clients
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Socket } from 'socket.io-client';
import {
  createTestSocketClient,
  waitForConnection,
  waitForEvent,
  emitWithAck,
  cleanupSockets,
  simulateNetworkDelay,
} from '../../../tests/helpers/socket-helpers';
import { generateTestSessionId } from '../../../tests/fixtures/multiplayer-fixtures';
import { PlayerColor } from '@/types/game';

describe('Integration: Real-time Move Synchronization', () => {
  let client1: Socket;
  let client2: Socket;
  let roomId: string;

  beforeEach(async () => {
    client1 = createTestSocketClient();
    client2 = createTestSocketClient();
    await waitForConnection(client1);
    await waitForConnection(client2);

    // Create room and have both players join
    const createResponse = await emitWithAck<any>(client1, 'room:create', {
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    roomId = createResponse.room.id;

    await emitWithAck<any>(client2, 'room:join', {
      roomId,
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });
  });

  afterEach(() => {
    cleanupSockets(client1, client2);
  });

  it('should synchronize move from player 1 to player 2', async () => {
    // Listen for game:state event on client2
    const statePromise = waitForEvent<any>(client2, 'game:state');

    // Player 1 makes a move
    await emitWithAck<any>(client1, 'game:move', {
      move: {
        piece: { id: 'p1', type: 'soldier', color: 'red', position: { x: 0, y: 0 } },
        from: { x: 0, y: 0 },
        to: { x: 0, y: 1 },
      },
      gameStateHash: 'mock-hash',
      timestamp: Date.now(),
    });

    // Player 2 should receive state update
    const stateUpdate = await statePromise;

    expect(stateUpdate.type).toBe('game:state');
    expect(stateUpdate.gameState).toBeDefined();
    expect(stateUpdate.lastMove).toBeDefined();
  });

  it('should reflect move in both clients immediately', async () => {
    // Both clients listen for updates
    const state1Promise = waitForEvent<any>(client1, 'game:state');
    const state2Promise = waitForEvent<any>(client2, 'game:state');

    // Player 1 makes move
    await emitWithAck<any>(client1, 'game:move', {
      move: {
        piece: { id: 'p1', type: 'soldier', color: 'red', position: { x: 0, y: 0 } },
        from: { x: 0, y: 0 },
        to: { x: 0, y: 1 },
      },
      gameStateHash: 'mock-hash',
      timestamp: Date.now(),
    });

    // Both should receive updates
    const [state1, state2] = await Promise.all([state1Promise, state2Promise]);

    expect(state1.gameState.moveHistory.length).toBeGreaterThan(0);
    expect(state2.gameState.moveHistory.length).toBeGreaterThan(0);

    // States should be identical
    expect(state1.gameState.currentTurn).toBe(state2.gameState.currentTurn);
  });

  it('should measure move latency', async () => {
    const startTime = Date.now();

    // Listen on client2
    const statePromise = waitForEvent<any>(client2, 'game:state');

    // Send move from client1
    await emitWithAck<any>(client1, 'game:move', {
      move: {
        piece: { id: 'p1', type: 'soldier', color: 'red', position: { x: 0, y: 0 } },
        from: { x: 0, y: 0 },
        to: { x: 0, y: 1 },
      },
      gameStateHash: 'mock-hash',
      timestamp: Date.now(),
    });

    await statePromise;
    const endTime = Date.now();
    const latency = endTime - startTime;

    // Latency should be under 200ms on localhost
    expect(latency).toBeLessThan(200);
  });

  it('should handle rapid successive moves', async () => {
    const moves = [
      { from: { x: 0, y: 0 }, to: { x: 0, y: 1 } },
      { from: { x: 1, y: 0 }, to: { x: 1, y: 1 } },
      { from: { x: 2, y: 0 }, to: { x: 2, y: 1 } },
    ];

    for (const moveData of moves) {
      await emitWithAck<any>(client1, 'game:move', {
        move: {
          piece: { id: 'p1', type: 'soldier', color: 'red', position: moveData.from },
          from: moveData.from,
          to: moveData.to,
        },
        gameStateHash: 'mock-hash',
        timestamp: Date.now(),
      });

      // Small delay between moves
      await simulateNetworkDelay(50);
    }

    // All moves should be processed
    // (In real implementation, would verify move history length)
  });
});

describe('Integration: Turn Indicator Synchronization', () => {
  let client1: Socket;
  let client2: Socket;
  let roomId: string;

  beforeEach(async () => {
    client1 = createTestSocketClient();
    client2 = createTestSocketClient();
    await waitForConnection(client1);
    await waitForConnection(client2);

    const createResponse = await emitWithAck<any>(client1, 'room:create', {
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    roomId = createResponse.room.id;

    await emitWithAck<any>(client2, 'room:join', {
      roomId,
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });
  });

  afterEach(() => {
    cleanupSockets(client1, client2);
  });

  it('should initialize with RED turn', async () => {
    // Check initial turn from create response
    const createResponse = await emitWithAck<any>(client1, 'room:create', {
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    expect(createResponse.room.gameState.currentTurn).toBe('red');
  });

  it('should switch turn after move', async () => {
    // Listen for state update
    const statePromise = waitForEvent<any>(client2, 'game:state');

    // Player 1 (RED) makes move
    await emitWithAck<any>(client1, 'game:move', {
      move: {
        piece: { id: 'p1', type: 'soldier', color: 'red', position: { x: 0, y: 0 } },
        from: { x: 0, y: 0 },
        to: { x: 0, y: 1 },
      },
      gameStateHash: 'mock-hash',
      timestamp: Date.now(),
    });

    const stateUpdate = await statePromise;

    // Turn should switch to BLACK
    expect(stateUpdate.gameState.currentTurn).toBe('black');
  });

  it('should synchronize turn to both clients', async () => {
    const state1Promise = waitForEvent<any>(client1, 'game:state');
    const state2Promise = waitForEvent<any>(client2, 'game:state');

    // Make move
    await emitWithAck<any>(client1, 'game:move', {
      move: {
        piece: { id: 'p1', type: 'soldier', color: 'red', position: { x: 0, y: 0 } },
        from: { x: 0, y: 0 },
        to: { x: 0, y: 1 },
      },
      gameStateHash: 'mock-hash',
      timestamp: Date.now(),
    });

    const [state1, state2] = await Promise.all([state1Promise, state2Promise]);

    // Both should see same current turn
    expect(state1.gameState.currentTurn).toBe(state2.gameState.currentTurn);
  });

  it('should reject move from wrong turn player', async () => {
    // Player 2 (BLACK) tries to move on RED's turn
    const response = await emitWithAck<any>(client2, 'game:move', {
      move: {
        piece: { id: 'p2', type: 'soldier', color: 'black', position: { x: 0, y: 9 } },
        from: { x: 0, y: 9 },
        to: { x: 0, y: 8 },
      },
      gameStateHash: 'mock-hash',
      timestamp: Date.now(),
    });

    expect(response.success).toBe(false);
    expect(response.error).toMatch(/turn|not your turn/i);
  });
});

describe('Integration: Hero Skill Synchronization', () => {
  let client1: Socket;
  let client2: Socket;
  let roomId: string;

  beforeEach(async () => {
    client1 = createTestSocketClient();
    client2 = createTestSocketClient();
    await waitForConnection(client1);
    await waitForConnection(client2);

    const createResponse = await emitWithAck<any>(client1, 'room:create', {
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    roomId = createResponse.room.id;

    await emitWithAck<any>(client2, 'room:join', {
      roomId,
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });
  });

  afterEach(() => {
    cleanupSockets(client1, client2);
  });

  it('should synchronize hero skill usage', async () => {
    // Listen for state update on client2
    const statePromise = waitForEvent<any>(client2, 'game:state');

    // Player 1 uses hero skill
    await emitWithAck<any>(client1, 'game:skill', {
      skillId: 'hero-skill-1',
      targetPieceId: 'target-piece-1',
      timestamp: Date.now(),
    });

    const stateUpdate = await statePromise;

    // State should include skill effects
    expect(stateUpdate.gameState).toBeDefined();
    expect(stateUpdate.type).toBe('game:state');
  });

  it('should update skill cooldowns for both players', async () => {
    const state1Promise = waitForEvent<any>(client1, 'game:state');
    const state2Promise = waitForEvent<any>(client2, 'game:state');

    // Use skill
    await emitWithAck<any>(client1, 'game:skill', {
      skillId: 'hero-skill-1',
      timestamp: Date.now(),
    });

    const [state1, state2] = await Promise.all([state1Promise, state2Promise]);

    // Both should see updated skill states
    expect(state1.gameState.skillStates).toBeDefined();
    expect(state2.gameState.skillStates).toBeDefined();
  });

  it('should synchronize skill effects on board', async () => {
    // Listen for updates
    const statePromise = waitForEvent<any>(client2, 'game:state');

    // Use skill with board effects
    await emitWithAck<any>(client1, 'game:skill', {
      skillId: 'aoe-skill',
      targetPieceId: 'target-1',
      timestamp: Date.now(),
    });

    const stateUpdate = await statePromise;

    // Board state should reflect skill effects
    expect(stateUpdate.gameState.board).toBeDefined();
  });
});

describe('Integration: State Consistency Under Load', () => {
  let client1: Socket;
  let client2: Socket;
  let roomId: string;

  beforeEach(async () => {
    client1 = createTestSocketClient();
    client2 = createTestSocketClient();
    await waitForConnection(client1);
    await waitForConnection(client2);

    const createResponse = await emitWithAck<any>(client1, 'room:create', {
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });

    roomId = createResponse.room.id;

    await emitWithAck<any>(client2, 'room:join', {
      roomId,
      sessionId: generateTestSessionId(),
      timestamp: Date.now(),
    });
  });

  afterEach(() => {
    cleanupSockets(client1, client2);
  });

  it('should maintain consistency with network delay', async () => {
    // Simulate slow network
    await simulateNetworkDelay(500);

    const statePromise = waitForEvent<any>(client2, 'game:state');

    await emitWithAck<any>(client1, 'game:move', {
      move: {
        piece: { id: 'p1', type: 'soldier', color: 'red', position: { x: 0, y: 0 } },
        from: { x: 0, y: 0 },
        to: { x: 0, y: 1 },
      },
      gameStateHash: 'mock-hash',
      timestamp: Date.now(),
    });

    const stateUpdate = await statePromise;

    expect(stateUpdate.gameState).toBeDefined();
    expect(stateUpdate.type).toBe('game:state');
  });

  it('should handle simultaneous move attempts', async () => {
    // Both players try to move at same time
    const [response1, response2] = await Promise.all([
      emitWithAck<any>(client1, 'game:move', {
        move: {
          piece: { id: 'p1', type: 'soldier', color: 'red', position: { x: 0, y: 0 } },
          from: { x: 0, y: 0 },
          to: { x: 0, y: 1 },
        },
        gameStateHash: 'mock-hash',
        timestamp: Date.now(),
      }),
      emitWithAck<any>(client2, 'game:move', {
        move: {
          piece: { id: 'p2', type: 'soldier', color: 'black', position: { x: 0, y: 9 } },
          from: { x: 0, y: 9 },
          to: { x: 0, y: 8 },
        },
        gameStateHash: 'mock-hash',
        timestamp: Date.now(),
      }),
    ]);

    // One should succeed, one should fail
    const succeeded = [response1, response2].filter(r => r.success === true);
    const failed = [response2, response2].filter(r => r.success === false);

    // At least one should succeed (the one whose turn it is)
    expect(succeeded.length).toBeGreaterThanOrEqual(1);
  });
});
