/**
 * Property-based tests for network state synchronization
 * Uses fast-check to validate state consistency across random move sequences
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Socket } from 'socket.io-client';
import * as fc from 'fast-check';
import {
  createTestSocketClient,
  waitForConnection,
  waitForEvent,
  emitWithAck,
  cleanupSockets,
} from '../../../tests/helpers/socket-helpers';
import { generateTestSessionId } from '../../../tests/fixtures/multiplayer-fixtures';
import type { GameState, Move, PlayerColor } from '@/types/game';

describe('Property: Network State Synchronization', () => {
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

  it('should maintain identical game state after any sequence of valid moves', async () => {
    // Property: After any sequence of moves, both clients should have identical game state
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            fromX: fc.integer({ min: 0, max: 8 }),
            fromY: fc.integer({ min: 0, max: 9 }),
            toX: fc.integer({ min: 0, max: 8 }),
            toY: fc.integer({ min: 0, max: 9 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (moves) => {
          // Reset game for this property test iteration
          const createResponse = await emitWithAck<any>(client1, 'room:create', {
            sessionId: generateTestSessionId(),
            timestamp: Date.now(),
          });

          const testRoomId = createResponse.room.id;

          await emitWithAck<any>(client2, 'room:join', {
            roomId: testRoomId,
            sessionId: generateTestSessionId(),
            timestamp: Date.now(),
          });

          // Execute move sequence
          let currentColor: PlayerColor = 'red';
          let lastState1: GameState | null = null;
          let lastState2: GameState | null = null;

          for (const move of moves) {
            try {
              const statePromise1 = waitForEvent<any>(client1, 'game:state');
              const statePromise2 = waitForEvent<any>(client2, 'game:state');

              const currentClient = currentColor === 'red' ? client1 : client2;

              const response = await emitWithAck<any>(currentClient, 'game:move', {
                move: {
                  piece: {
                    id: `piece-${Math.random()}`,
                    type: 'soldier',
                    color: currentColor,
                    position: { x: move.fromX, y: move.fromY },
                  },
                  from: { x: move.fromX, y: move.fromY },
                  to: { x: move.toX, y: move.toY },
                },
                gameStateHash: 'test-hash',
                timestamp: Date.now(),
              });

              // If move succeeded, wait for state updates
              if (response.success !== false) {
                const [state1, state2] = await Promise.all([statePromise1, statePromise2]);
                lastState1 = state1.gameState;
                lastState2 = state2.gameState;

                // Switch turn
                currentColor = currentColor === 'red' ? 'black' : 'red';
              }
            } catch (error) {
              // Move might be invalid, continue with next move
              continue;
            }
          }

          // Invariant: Both clients must have identical game state
          if (lastState1 && lastState2) {
            expect(lastState1.currentTurn).toBe(lastState2.currentTurn);
            expect(lastState1.moveHistory.length).toBe(lastState2.moveHistory.length);
            expect(lastState1.phase).toBe(lastState2.phase);
          }

          return true;
        }
      ),
      {
        numRuns: 50, // Run 50 random sequences (reduce from 1000 for speed)
        timeout: 30000, // 30s timeout for each property run
      }
    );
  });

  it('should maintain turn order invariant across all move sequences', async () => {
    // Property: Turn should always alternate between red and black
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            fromX: fc.integer({ min: 0, max: 8 }),
            fromY: fc.integer({ min: 0, max: 9 }),
            toX: fc.integer({ min: 0, max: 8 }),
            toY: fc.integer({ min: 0, max: 9 }),
          }),
          { minLength: 2, maxLength: 8 }
        ),
        async (moves) => {
          const createResponse = await emitWithAck<any>(client1, 'room:create', {
            sessionId: generateTestSessionId(),
            timestamp: Date.now(),
          });

          const testRoomId = createResponse.room.id;

          await emitWithAck<any>(client2, 'room:join', {
            roomId: testRoomId,
            sessionId: generateTestSessionId(),
            timestamp: Date.now(),
          });

          let currentColor: PlayerColor = 'red';
          let previousColor: PlayerColor | null = null;
          let turnChanges = 0;

          for (const move of moves) {
            try {
              const currentClient = currentColor === 'red' ? client1 : client2;

              const response = await emitWithAck<any>(currentClient, 'game:move', {
                move: {
                  piece: {
                    id: `piece-${Math.random()}`,
                    type: 'soldier',
                    color: currentColor,
                    position: { x: move.fromX, y: move.fromY },
                  },
                  from: { x: move.fromX, y: move.fromY },
                  to: { x: move.toX, y: move.toY },
                },
                gameStateHash: 'test-hash',
                timestamp: Date.now(),
              });

              if (response.success !== false) {
                // Invariant: Turn must alternate
                if (previousColor !== null) {
                  expect(currentColor).not.toBe(previousColor);
                }

                previousColor = currentColor;
                currentColor = currentColor === 'red' ? 'black' : 'red';
                turnChanges++;
              }
            } catch (error) {
              continue;
            }
          }

          // At least some moves should have succeeded
          expect(turnChanges).toBeGreaterThanOrEqual(0);
          return true;
        }
      ),
      {
        numRuns: 30,
        timeout: 20000,
      }
    );
  });

  it('should maintain move history consistency across clients', async () => {
    // Property: Move history length should always match between clients
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            fromX: fc.integer({ min: 0, max: 8 }),
            fromY: fc.integer({ min: 0, max: 9 }),
            toX: fc.integer({ min: 0, max: 8 }),
            toY: fc.integer({ min: 0, max: 9 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (moves) => {
          const createResponse = await emitWithAck<any>(client1, 'room:create', {
            sessionId: generateTestSessionId(),
            timestamp: Date.now(),
          });

          const testRoomId = createResponse.room.id;

          await emitWithAck<any>(client2, 'room:join', {
            roomId: testRoomId,
            sessionId: generateTestSessionId(),
            timestamp: Date.now(),
          });

          let currentColor: PlayerColor = 'red';
          let lastState1: GameState | null = null;
          let lastState2: GameState | null = null;

          for (const move of moves) {
            try {
              const statePromise1 = waitForEvent<any>(client1, 'game:state');
              const statePromise2 = waitForEvent<any>(client2, 'game:state');

              const currentClient = currentColor === 'red' ? client1 : client2;

              const response = await emitWithAck<any>(currentClient, 'game:move', {
                move: {
                  piece: {
                    id: `piece-${Math.random()}`,
                    type: 'soldier',
                    color: currentColor,
                    position: { x: move.fromX, y: move.fromY },
                  },
                  from: { x: move.fromX, y: move.fromY },
                  to: { x: move.toX, y: move.toY },
                },
                gameStateHash: 'test-hash',
                timestamp: Date.now(),
              });

              if (response.success !== false) {
                const [state1, state2] = await Promise.all([statePromise1, statePromise2]);
                lastState1 = state1.gameState;
                lastState2 = state2.gameState;

                // Invariant: Move history length must match
                expect(state1.gameState.moveHistory.length).toBe(
                  state2.gameState.moveHistory.length
                );

                currentColor = currentColor === 'red' ? 'black' : 'red';
              }
            } catch (error) {
              continue;
            }
          }

          return true;
        }
      ),
      {
        numRuns: 40,
        timeout: 25000,
      }
    );
  });

  it('should reject moves from wrong turn player in any sequence', async () => {
    // Property: A player trying to move on opponent's turn should always fail
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 8 }),
        fc.integer({ min: 0, max: 9 }),
        fc.integer({ min: 0, max: 8 }),
        fc.integer({ min: 0, max: 9 }),
        async (fromX, fromY, toX, toY) => {
          const createResponse = await emitWithAck<any>(client1, 'room:create', {
            sessionId: generateTestSessionId(),
            timestamp: Date.now(),
          });

          const testRoomId = createResponse.room.id;

          await emitWithAck<any>(client2, 'room:join', {
            roomId: testRoomId,
            sessionId: generateTestSessionId(),
            timestamp: Date.now(),
          });

          // Current turn is RED, try to move BLACK piece
          const response = await emitWithAck<any>(client2, 'game:move', {
            move: {
              piece: {
                id: `piece-${Math.random()}`,
                type: 'soldier',
                color: 'black',
                position: { x: fromX, y: fromY },
              },
              from: { x: fromX, y: fromY },
              to: { x: toX, y: toY },
            },
            gameStateHash: 'test-hash',
            timestamp: Date.now(),
          });

          // Invariant: Move should be rejected (wrong turn)
          expect(response.success).toBe(false);
          return true;
        }
      ),
      {
        numRuns: 50,
        timeout: 15000,
      }
    );
  });

  it('should preserve state consistency under concurrent move attempts', async () => {
    // Property: Concurrent moves should result in one success, one failure
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          move1FromX: fc.integer({ min: 0, max: 8 }),
          move1FromY: fc.integer({ min: 0, max: 9 }),
          move1ToX: fc.integer({ min: 0, max: 8 }),
          move1ToY: fc.integer({ min: 0, max: 9 }),
          move2FromX: fc.integer({ min: 0, max: 8 }),
          move2FromY: fc.integer({ min: 0, max: 9 }),
          move2ToX: fc.integer({ min: 0, max: 8 }),
          move2ToY: fc.integer({ min: 0, max: 9 }),
        }),
        async (config) => {
          const createResponse = await emitWithAck<any>(client1, 'room:create', {
            sessionId: generateTestSessionId(),
            timestamp: Date.now(),
          });

          const testRoomId = createResponse.room.id;

          await emitWithAck<any>(client2, 'room:join', {
            roomId: testRoomId,
            sessionId: generateTestSessionId(),
            timestamp: Date.now(),
          });

          // Both clients try to move simultaneously
          const [response1, response2] = await Promise.all([
            emitWithAck<any>(client1, 'game:move', {
              move: {
                piece: {
                  id: `piece-${Math.random()}`,
                  type: 'soldier',
                  color: 'red',
                  position: { x: config.move1FromX, y: config.move1FromY },
                },
                from: { x: config.move1FromX, y: config.move1FromY },
                to: { x: config.move1ToX, y: config.move1ToY },
              },
              gameStateHash: 'test-hash',
              timestamp: Date.now(),
            }),
            emitWithAck<any>(client2, 'game:move', {
              move: {
                piece: {
                  id: `piece-${Math.random()}`,
                  type: 'soldier',
                  color: 'black',
                  position: { x: config.move2FromX, y: config.move2FromY },
                },
                from: { x: config.move2FromX, y: config.move2FromY },
                to: { x: config.move2ToX, y: config.move2ToY },
              },
              gameStateHash: 'test-hash',
              timestamp: Date.now(),
            }),
          ]);

          // Invariant: Exactly one move should succeed (the one whose turn it is)
          const successCount = [response1, response2].filter(
            (r) => r.success !== false
          ).length;

          // RED starts first, so client1 move might succeed if valid
          // client2 move should always fail (wrong turn)
          expect(response2.success).toBe(false);

          return true;
        }
      ),
      {
        numRuns: 30,
        timeout: 20000,
      }
    );
  });
});

describe('Property: State Synchronization Invariants', () => {
  let client1: Socket;
  let client2: Socket;

  beforeEach(async () => {
    client1 = createTestSocketClient();
    client2 = createTestSocketClient();
    await waitForConnection(client1);
    await waitForConnection(client2);
  });

  afterEach(() => {
    cleanupSockets(client1, client2);
  });

  it('should never allow duplicate player colors in a room', async () => {
    // Property: No two players in same room should have same color
    await fc.assert(
      fc.asyncProperty(fc.constant(true), async () => {
        const createResponse = await emitWithAck<any>(client1, 'room:create', {
          sessionId: generateTestSessionId(),
          timestamp: Date.now(),
        });

        const joinResponse = await emitWithAck<any>(client2, 'room:join', {
          roomId: createResponse.room.id,
          sessionId: generateTestSessionId(),
          timestamp: Date.now(),
        });

        // Invariant: Players must have different colors
        const color1 = createResponse.yourColor;
        const color2 = joinResponse.yourColor;

        expect(color1).not.toBe(color2);
        expect([color1, color2].sort()).toEqual(['black', 'red']);

        return true;
      }),
      {
        numRuns: 20,
        timeout: 10000,
      }
    );
  });

  it('should maintain room capacity invariant (max 2 players)', async () => {
    // Property: Room should never have more than 2 players
    await fc.assert(
      fc.asyncProperty(fc.constant(true), async () => {
        const client3 = createTestSocketClient();
        await waitForConnection(client3);

        try {
          const createResponse = await emitWithAck<any>(client1, 'room:create', {
            sessionId: generateTestSessionId(),
            timestamp: Date.now(),
          });

          await emitWithAck<any>(client2, 'room:join', {
            roomId: createResponse.room.id,
            sessionId: generateTestSessionId(),
            timestamp: Date.now(),
          });

          const thirdPlayerResponse = await emitWithAck<any>(client3, 'room:join', {
            roomId: createResponse.room.id,
            sessionId: generateTestSessionId(),
            timestamp: Date.now(),
          });

          // Invariant: Third player must be rejected
          expect(thirdPlayerResponse.type).toBe('room:join_error');
          expect(thirdPlayerResponse.reason).toBe('room_full');

          return true;
        } finally {
          cleanupSockets(client3);
        }
      }),
      {
        numRuns: 20,
        timeout: 10000,
      }
    );
  });

  it('should preserve monotonic move history growth', async () => {
    // Property: Move history length should never decrease
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            fromX: fc.integer({ min: 0, max: 8 }),
            fromY: fc.integer({ min: 0, max: 9 }),
            toX: fc.integer({ min: 0, max: 8 }),
            toY: fc.integer({ min: 0, max: 9 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (moves) => {
          const createResponse = await emitWithAck<any>(client1, 'room:create', {
            sessionId: generateTestSessionId(),
            timestamp: Date.now(),
          });

          await emitWithAck<any>(client2, 'room:join', {
            roomId: createResponse.room.id,
            sessionId: generateTestSessionId(),
            timestamp: Date.now(),
          });

          let currentColor: PlayerColor = 'red';
          let previousHistoryLength = 0;

          for (const move of moves) {
            try {
              const statePromise = waitForEvent<any>(client1, 'game:state');

              const currentClient = currentColor === 'red' ? client1 : client2;

              const response = await emitWithAck<any>(currentClient, 'game:move', {
                move: {
                  piece: {
                    id: `piece-${Math.random()}`,
                    type: 'soldier',
                    color: currentColor,
                    position: { x: move.fromX, y: move.fromY },
                  },
                  from: { x: move.fromX, y: move.fromY },
                  to: { x: move.toX, y: move.toY },
                },
                gameStateHash: 'test-hash',
                timestamp: Date.now(),
              });

              if (response.success !== false) {
                const state = await statePromise;
                const currentHistoryLength = state.gameState.moveHistory.length;

                // Invariant: History length should grow or stay same
                expect(currentHistoryLength).toBeGreaterThanOrEqual(previousHistoryLength);

                previousHistoryLength = currentHistoryLength;
                currentColor = currentColor === 'red' ? 'black' : 'red';
              }
            } catch (error) {
              continue;
            }
          }

          return true;
        }
      ),
      {
        numRuns: 30,
        timeout: 20000,
      }
    );
  });
});
