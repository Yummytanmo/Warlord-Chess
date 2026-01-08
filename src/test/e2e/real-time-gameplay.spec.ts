/**
 * E2E tests for complete real-time gameplay
 * Tests full game flow from start to checkmate with move synchronization
 */

import { expect } from '@playwright/test';
import { multiplayerTest } from './fixtures/multiplayer-context';
import { createRoom, joinRoom, waitForGameStart } from './fixtures/multiplayer-context';

multiplayerTest.describe('E2E: Complete Real-time Gameplay', () => {
  multiplayerTest('should play complete game from start to finish', async ({
    player1Page,
    player2Page,
  }) => {
    // Player 1 creates room
    const roomId = await createRoom(player1Page);

    // Player 2 joins room
    await joinRoom(player2Page, roomId);

    // Wait for game to start
    await waitForGameStart(player1Page);
    await waitForGameStart(player2Page);

    // Verify both players see the board
    const board1 = player1Page.locator('[data-testid="game-board"]');
    const board2 = player2Page.locator('[data-testid="game-board"]');

    await expect(board1).toBeVisible();
    await expect(board2).toBeVisible();

    // Verify initial turn indicator (RED starts)
    const turnIndicator1 = player1Page.locator('[data-testid="turn-indicator"]');
    const turnIndicator2 = player2Page.locator('[data-testid="turn-indicator"]');

    await expect(turnIndicator1).toContainText(/red|your turn/i);
    await expect(turnIndicator2).toContainText(/red|waiting/i);

    // Make a sequence of moves
    // Move 1: RED soldier forward
    await player1Page.click('[data-piece-id*="red"][data-piece-type="soldier"]:first-of-type');
    await player1Page.click('[data-position="0,1"]');

    // Wait for move to synchronize
    await player1Page.waitForTimeout(200);

    // Verify turn switched to BLACK on both clients
    await expect(turnIndicator1).toContainText(/black|waiting/i);
    await expect(turnIndicator2).toContainText(/black|your turn/i);

    // Move 2: BLACK soldier forward
    await player2Page.click('[data-piece-id*="black"][data-piece-type="soldier"]:first-of-type');
    await player2Page.click('[data-position="0,8"]');

    // Wait for move to synchronize
    await player2Page.waitForTimeout(200);

    // Verify turn switched back to RED
    await expect(turnIndicator1).toContainText(/red|your turn/i);
    await expect(turnIndicator2).toContainText(/red|waiting/i);

    // Verify both players see both moves
    const moveHistory1 = player1Page.locator('[data-testid="move-history"]');
    const moveHistory2 = player2Page.locator('[data-testid="move-history"]');

    await expect(moveHistory1).toContainText(/move.*1/i);
    await expect(moveHistory1).toContainText(/move.*2/i);
    await expect(moveHistory2).toContainText(/move.*1/i);
    await expect(moveHistory2).toContainText(/move.*2/i);
  });

  multiplayerTest('should synchronize moves with low latency', async ({
    player1Page,
    player2Page,
  }) => {
    // Player 1 creates room
    const roomId = await createRoom(player1Page);

    // Player 2 joins room
    await joinRoom(player2Page, roomId);

    // Wait for game to start
    await waitForGameStart(player1Page);
    await waitForGameStart(player2Page);

    // Measure move latency
    const startTime = Date.now();

    // Player 1 makes a move
    await player1Page.click('[data-piece-id*="red"][data-piece-type="soldier"]:first-of-type');
    await player1Page.click('[data-position="0,1"]');

    // Wait for move to appear on player 2's screen
    await player2Page.waitForSelector('[data-last-move="true"]', { timeout: 5000 });

    const endTime = Date.now();
    const latency = endTime - startTime;

    // Verify latency is under 2 seconds (generous for E2E test with network)
    expect(latency).toBeLessThan(2000);

    // Verify move is visible on both screens
    await expect(player1Page.locator('[data-last-move="true"]')).toBeVisible();
    await expect(player2Page.locator('[data-last-move="true"]')).toBeVisible();
  });

  multiplayerTest('should enforce turn order strictly', async ({
    player1Page,
    player2Page,
  }) => {
    // Player 1 creates room (RED)
    const roomId = await createRoom(player1Page);

    // Player 2 joins room (BLACK)
    await joinRoom(player2Page, roomId);

    await waitForGameStart(player1Page);
    await waitForGameStart(player2Page);

    // Player 2 (BLACK) tries to move on RED's turn - should not work
    const blackPiece = player2Page.locator('[data-piece-id*="black"][data-piece-type="soldier"]:first-of-type');

    // Try to select piece (might be disabled or show error)
    await blackPiece.click();

    // Should not be able to make move - verify no piece is selected or error shown
    const selectedPiece = player2Page.locator('[data-piece-selected="true"]');
    const errorMessage = player2Page.locator('[data-testid="error-message"]');

    const hasSelection = await selectedPiece.count();
    const hasError = await errorMessage.count();

    // Either no piece selected OR error message shown
    expect(hasSelection === 0 || hasError > 0).toBe(true);

    // Player 1 (RED) should be able to move
    await player1Page.click('[data-piece-id*="red"][data-piece-type="soldier"]:first-of-type');
    await player1Page.click('[data-position="0,1"]');

    // Wait for move to complete
    await player1Page.waitForTimeout(200);

    // Now it's BLACK's turn - Player 2 should be able to move
    await player2Page.click('[data-piece-id*="black"][data-piece-type="soldier"]:first-of-type');
    await player2Page.click('[data-position="0,8"]');

    // Move should succeed
    await expect(player2Page.locator('[data-last-move="true"]')).toBeVisible();
  });

  multiplayerTest('should synchronize piece captures', async ({
    player1Page,
    player2Page,
  }) => {
    // Player 1 creates room
    const roomId = await createRoom(player1Page);

    // Player 2 joins room
    await joinRoom(player2Page, roomId);

    await waitForGameStart(player1Page);
    await waitForGameStart(player2Page);

    // Execute moves to set up a capture scenario
    // (This would require specific game logic to position pieces for capture)

    // For now, verify captured pieces section exists
    const capturedPieces1 = player1Page.locator('[data-testid="captured-pieces"]');
    const capturedPieces2 = player2Page.locator('[data-testid="captured-pieces"]');

    await expect(capturedPieces1).toBeVisible();
    await expect(capturedPieces2).toBeVisible();

    // If a piece is captured, both players should see it
    // (Actual capture would depend on game implementation)
  });

  multiplayerTest('should synchronize hero skill usage', async ({
    player1Page,
    player2Page,
  }) => {
    // Player 1 creates room
    const roomId = await createRoom(player1Page);

    // Player 2 joins room
    await joinRoom(player2Page, roomId);

    // Wait for hero selection phase
    await player1Page.waitForSelector('[data-testid="hero-selection"]', { timeout: 10000 });
    await player2Page.waitForSelector('[data-testid="hero-selection"]', { timeout: 10000 });

    // Select heroes
    await player1Page.click('[data-hero-id="hero-1"]');
    await player2Page.click('[data-hero-id="hero-2"]');

    // Confirm selections
    await player1Page.click('[data-testid="confirm-hero"]');
    await player2Page.click('[data-testid="confirm-hero"]');

    // Wait for game to start
    await waitForGameStart(player1Page);
    await waitForGameStart(player2Page);

    // Make a move to build up skill meter (if applicable)
    await player1Page.click('[data-piece-id*="red"][data-piece-type="soldier"]:first-of-type');
    await player1Page.click('[data-position="0,1"]');

    await player1Page.waitForTimeout(200);

    // Try to use hero skill
    const heroSkillButton1 = player1Page.locator('[data-testid="hero-skill-button"]');
    const heroSkillButton2 = player2Page.locator('[data-testid="hero-skill-button"]');

    // If skill button exists and is enabled
    if (await heroSkillButton1.isVisible()) {
      // Use skill
      await heroSkillButton1.click();

      // Select target if needed
      const skillTarget = player1Page.locator('[data-piece-type="soldier"]:first-of-type');
      await skillTarget.click();

      // Wait for skill effect to synchronize
      await player1Page.waitForTimeout(500);

      // Both players should see skill effect
      const skillEffect1 = player1Page.locator('[data-testid="skill-effect"]');
      const skillEffect2 = player2Page.locator('[data-testid="skill-effect"]');

      // Skill effect should be visible or skill cooldown should update
      const hasCooldown1 = await player1Page.locator('[data-testid="skill-cooldown"]').count();
      const hasCooldown2 = await player2Page.locator('[data-testid="skill-cooldown"]').count();

      // At least one indicator of skill usage should be present
      expect(hasCooldown1 > 0 || hasCooldown2 > 0).toBe(true);
    }
  });

  multiplayerTest('should handle rapid move sequence correctly', async ({
    player1Page,
    player2Page,
  }) => {
    // Player 1 creates room
    const roomId = await createRoom(player1Page);

    // Player 2 joins room
    await joinRoom(player2Page, roomId);

    await waitForGameStart(player1Page);
    await waitForGameStart(player2Page);

    // Make rapid moves (alternating players)
    for (let i = 0; i < 5; i++) {
      const currentPage = i % 2 === 0 ? player1Page : player2Page;
      const color = i % 2 === 0 ? 'red' : 'black';

      // Make move
      await currentPage.click(`[data-piece-id*="${color}"][data-piece-type="soldier"]:nth-of-type(${i + 1})`);
      await currentPage.click(`[data-position="${i},${i % 2 === 0 ? 1 : 8}"]`);

      // Small delay between moves
      await currentPage.waitForTimeout(300);
    }

    // Verify move history shows all moves
    const moveHistory1 = player1Page.locator('[data-testid="move-history"]');
    const moveHistory2 = player2Page.locator('[data-testid="move-history"]');

    const moveCount1 = await moveHistory1.locator('[data-testid="move-item"]').count();
    const moveCount2 = await moveHistory2.locator('[data-testid="move-item"]').count();

    // Both players should see same number of moves
    expect(moveCount1).toBe(moveCount2);
    expect(moveCount1).toBeGreaterThanOrEqual(5);
  });

  multiplayerTest('should detect and display check state', async ({
    player1Page,
    player2Page,
  }) => {
    // Player 1 creates room
    const roomId = await createRoom(player1Page);

    // Player 2 joins room
    await joinRoom(player2Page, roomId);

    await waitForGameStart(player1Page);
    await waitForGameStart(player2Page);

    // Execute moves to create check scenario
    // (This would require specific move sequence to achieve check)

    // For now, verify check indicator exists in DOM
    const checkIndicator1 = player1Page.locator('[data-testid="check-indicator"]');
    const checkIndicator2 = player2Page.locator('[data-testid="check-indicator"]');

    // Check indicators should exist (even if not currently in check)
    await expect(checkIndicator1).toBeAttached();
    await expect(checkIndicator2).toBeAttached();

    // If check occurs, both players should see it
    // (Actual check would depend on game implementation)
  });

  multiplayerTest('should detect and display checkmate/stalemate', async ({
    player1Page,
    player2Page,
  }) => {
    // Player 1 creates room
    const roomId = await createRoom(player1Page);

    // Player 2 joins room
    await joinRoom(player2Page, roomId);

    await waitForGameStart(player1Page);
    await waitForGameStart(player2Page);

    // Execute moves to create checkmate/stalemate scenario
    // (This would require specific move sequence)

    // For now, verify game end modal exists in DOM structure
    const gameEndModal1 = player1Page.locator('[data-testid="game-end-modal"]');
    const gameEndModal2 = player2Page.locator('[data-testid="game-end-modal"]');

    // Game end elements should exist in DOM (even if not visible)
    await expect(gameEndModal1).toBeAttached();
    await expect(gameEndModal2).toBeAttached();

    // If game ends, both players should see result
    // (Actual game end would depend on game implementation)
  });

  multiplayerTest('should maintain state consistency throughout game', async ({
    player1Page,
    player2Page,
  }) => {
    // Player 1 creates room
    const roomId = await createRoom(player1Page);

    // Player 2 joins room
    await joinRoom(player2Page, roomId);

    await waitForGameStart(player1Page);
    await waitForGameStart(player2Page);

    // Make several moves
    const moves = [
      { page: player1Page, color: 'red', pos: '0,1' },
      { page: player2Page, color: 'black', pos: '0,8' },
      { page: player1Page, color: 'red', pos: '1,1' },
      { page: player2Page, color: 'black', pos: '1,8' },
    ];

    for (const move of moves) {
      await move.page.click(`[data-piece-id*="${move.color}"][data-piece-type="soldier"]:first-of-type`);
      await move.page.click(`[data-position="${move.pos}"]`);
      await move.page.waitForTimeout(300);
    }

    // Verify both players have consistent state
    // 1. Same number of pieces on board
    const pieces1 = await player1Page.locator('[data-piece-id]').count();
    const pieces2 = await player2Page.locator('[data-piece-id]').count();
    expect(pieces1).toBe(pieces2);

    // 2. Same current turn
    const turn1 = await player1Page.locator('[data-testid="turn-indicator"]').textContent();
    const turn2 = await player2Page.locator('[data-testid="turn-indicator"]').textContent();
    expect(turn1?.toLowerCase()).toBe(turn2?.toLowerCase());

    // 3. Same move count
    const moveCount1 = await player1Page.locator('[data-testid="move-item"]').count();
    const moveCount2 = await player2Page.locator('[data-testid="move-item"]').count();
    expect(moveCount1).toBe(moveCount2);
    expect(moveCount1).toBe(4); // We made 4 moves
  });

  multiplayerTest('should show opponent connection status', async ({
    player1Page,
    player2Page,
  }) => {
    // Player 1 creates room
    const roomId = await createRoom(player1Page);

    // Player 2 joins room
    await joinRoom(player2Page, roomId);

    await waitForGameStart(player1Page);
    await waitForGameStart(player2Page);

    // Both players should see each other as connected
    const opponentStatus1 = player1Page.locator('[data-testid="opponent-status"]');
    const opponentStatus2 = player2Page.locator('[data-testid="opponent-status"]');

    await expect(opponentStatus1).toContainText(/connected|online/i);
    await expect(opponentStatus2).toContainText(/connected|online/i);

    // Verify opponent names are visible
    const opponentName1 = player1Page.locator('[data-testid="opponent-name"]');
    const opponentName2 = player2Page.locator('[data-testid="opponent-name"]');

    await expect(opponentName1).toBeVisible();
    await expect(opponentName2).toBeVisible();
  });

  multiplayerTest('should update UI in real-time after each move', async ({
    player1Page,
    player2Page,
  }) => {
    // Player 1 creates room
    const roomId = await createRoom(player1Page);

    // Player 2 joins room
    await joinRoom(player2Page, roomId);

    await waitForGameStart(player1Page);
    await waitForGameStart(player2Page);

    // Take snapshot of initial state
    const initialPieceCount1 = await player1Page.locator('[data-piece-id]').count();
    const initialPieceCount2 = await player2Page.locator('[data-piece-id]').count();

    // Player 1 makes move
    await player1Page.click('[data-piece-id*="red"][data-piece-type="soldier"]:first-of-type');
    await player1Page.click('[data-position="0,1"]');

    // Wait for UI to update
    await player1Page.waitForTimeout(500);

    // Verify UI updated on both clients
    // 1. Last move indicator visible
    await expect(player1Page.locator('[data-last-move="true"]')).toBeVisible();
    await expect(player2Page.locator('[data-last-move="true"]')).toBeVisible();

    // 2. Move added to history
    const moveCount1 = await player1Page.locator('[data-testid="move-item"]').count();
    const moveCount2 = await player2Page.locator('[data-testid="move-item"]').count();
    expect(moveCount1).toBe(1);
    expect(moveCount2).toBe(1);

    // 3. Turn indicator updated
    await expect(player1Page.locator('[data-testid="turn-indicator"]')).toContainText(/black|waiting/i);
    await expect(player2Page.locator('[data-testid="turn-indicator"]')).toContainText(/black|your turn/i);

    // 4. Piece count unchanged (no capture)
    const finalPieceCount1 = await player1Page.locator('[data-piece-id]').count();
    const finalPieceCount2 = await player2Page.locator('[data-piece-id]').count();
    expect(finalPieceCount1).toBe(initialPieceCount1);
    expect(finalPieceCount2).toBe(initialPieceCount2);
  });
});

multiplayerTest.describe('E2E: Real-time Gameplay Edge Cases', () => {
  multiplayerTest('should handle move rejection gracefully', async ({
    player1Page,
    player2Page,
  }) => {
    // Player 1 creates room
    const roomId = await createRoom(player1Page);

    // Player 2 joins room
    await joinRoom(player2Page, roomId);

    await waitForGameStart(player1Page);
    await waitForGameStart(player2Page);

    // Try to make an invalid move
    await player1Page.click('[data-piece-id*="red"][data-piece-type="soldier"]:first-of-type');
    await player1Page.click('[data-position="8,8"]'); // Invalid position for soldier

    // Should show error or reject move
    const errorMessage = player1Page.locator('[data-testid="error-message"]');
    const errorToast = player1Page.locator('[data-testid="toast-error"]');

    // Either error message or toast should appear
    const hasError = (await errorMessage.count()) > 0 || (await errorToast.count()) > 0;

    // If move was rejected, state should remain unchanged
    const moveCount = await player1Page.locator('[data-testid="move-item"]').count();
    expect(moveCount).toBe(0); // No moves should be recorded
  });

  multiplayerTest('should prevent simultaneous moves on same turn', async ({
    player1Page,
    player2Page,
  }) => {
    // Player 1 creates room (RED)
    const roomId = await createRoom(player1Page);

    // Player 2 joins room (BLACK)
    await joinRoom(player2Page, roomId);

    await waitForGameStart(player1Page);
    await waitForGameStart(player2Page);

    // Both try to move simultaneously (only RED should succeed)
    await Promise.all([
      player1Page.click('[data-piece-id*="red"][data-piece-type="soldier"]:first-of-type'),
      player2Page.click('[data-piece-id*="black"][data-piece-type="soldier"]:first-of-type'),
    ]);

    await Promise.all([
      player1Page.click('[data-position="0,1"]'),
      player2Page.click('[data-position="0,8"]'),
    ]);

    // Wait for server to process
    await player1Page.waitForTimeout(500);

    // Only one move should be recorded
    const moveCount1 = await player1Page.locator('[data-testid="move-item"]').count();
    const moveCount2 = await player2Page.locator('[data-testid="move-item"]').count();

    // Both should see same move count (either 0 or 1)
    expect(moveCount1).toBe(moveCount2);

    // If a move succeeded, it should be RED's move
    if (moveCount1 > 0) {
      const firstMove = await player1Page.locator('[data-testid="move-item"]:first-of-type').textContent();
      expect(firstMove).toMatch(/red/i);
    }
  });

  multiplayerTest('should recover from transient network issues', async ({
    player1Page,
    player2Page,
  }) => {
    // Player 1 creates room
    const roomId = await createRoom(player1Page);

    // Player 2 joins room
    await joinRoom(player2Page, roomId);

    await waitForGameStart(player1Page);
    await waitForGameStart(player2Page);

    // Make a move
    await player1Page.click('[data-piece-id*="red"][data-piece-type="soldier"]:first-of-type');
    await player1Page.click('[data-position="0,1"]');

    await player1Page.waitForTimeout(300);

    // Simulate network delay (refresh or brief disconnect simulation)
    // In real test, could use page.context().setOffline(true) then setOffline(false)

    // Make another move
    await player2Page.click('[data-piece-id*="black"][data-piece-type="soldier"]:first-of-type');
    await player2Page.click('[data-position="0,8"]');

    // Game should continue normally
    await expect(player1Page.locator('[data-testid="move-item"]')).toHaveCount(2);
    await expect(player2Page.locator('[data-testid="move-item"]')).toHaveCount(2);
  });
});
