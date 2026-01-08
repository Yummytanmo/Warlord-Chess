/**
 * E2E test helpers for multiplayer testing with Playwright
 * Provides utilities for multi-browser context management and game interactions
 */

import { test as base, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Extended test fixture with two browser contexts for multiplayer testing
 */
export const multiplayerTest = base.extend<{
  player1Context: BrowserContext;
  player2Context: BrowserContext;
  player1Page: Page;
  player2Page: Page;
}>({
  player1Context: async ({ browser }, use) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      storageState: undefined, // Ensure separate storage
    });
    await use(context);
    await context.close();
  },

  player2Context: async ({ browser }, use) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      storageState: undefined, // Ensure separate storage
    });
    await use(context);
    await context.close();
  },

  player1Page: async ({ player1Context }, use) => {
    const page = await player1Context.newPage();
    await use(page);
    await page.close();
  },

  player2Page: async ({ player2Context }, use) => {
    const page = await player2Context.newPage();
    await use(page);
    await page.close();
  },
});

/**
 * Wait for Socket.IO connection on page
 */
export async function waitForSocketConnection(page: Page, timeout: number = 10000): Promise<void> {
  await page.waitForFunction(
    () => {
      return (window as any).socket?.connected === true;
    },
    { timeout }
  );
}

/**
 * Create a room and return the room ID
 */
export async function createRoom(page: Page): Promise<string> {
  // Navigate to home page
  await page.goto('/');

  // Click "创建多人房间" button (Create Multiplayer Room button)
  await page.click('button:has-text("创建多人房间")');

  // Wait for navigation to room page
  await page.waitForURL(/\/room\/[^/]+/, { timeout: 15000 });

  // Extract room ID from URL
  const url = page.url();
  const match = url.match(/\/room\/([^/]+)/);

  if (!match) {
    throw new Error('Failed to extract room ID from URL');
  }

  return match[1];
}

/**
 * Join a room by navigating to room URL
 */
export async function joinRoom(page: Page, roomId: string): Promise<void> {
  await page.goto(`/room/${roomId}`);

  // Wait for room page to load - look for "多人游戏房间" text
  await page.waitForSelector('text=多人游戏房间', { timeout: 15000 });

  // Wait a bit for socket connection
  await page.waitForTimeout(1000);
}

/**
 * Wait for game to start (both players joined)
 */
export async function waitForGameStart(page: Page, timeout: number = 20000): Promise<void> {
  // Wait for game to be active - look for "游戏进行中" or GameBoard
  await page.waitForSelector('text=游戏进行中', { timeout });
}

/**
 * Get room status text from page
 */
export async function getRoomStatus(page: Page): Promise<string> {
  const statusElement = await page.locator('[data-testid="room-status"]').first();
  return await statusElement.textContent() || '';
}

/**
 * Get player color from page
 */
export async function getPlayerColor(page: Page): Promise<string> {
  const colorElement = await page.locator('[data-testid="player-color"]').first();
  return await colorElement.textContent() || '';
}

/**
 * Make a move on the board
 */
export async function makeMove(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number }
): Promise<void> {
  // Click source square
  await page.click(`[data-position="${from.x},${from.y}"]`);

  // Wait for piece selection
  await page.waitForTimeout(200);

  // Click destination square
  await page.click(`[data-position="${to.x},${to.y}"]`);

  // Wait for move animation
  await page.waitForTimeout(500);
}

/**
 * Select a hero in hero selection phase
 */
export async function selectHero(page: Page, heroName: string): Promise<void> {
  await page.click(`[data-testid="hero-${heroName}"]`);

  // Wait for selection confirmation
  await page.waitForTimeout(300);
}

/**
 * Wait for opponent move to appear
 */
export async function waitForOpponentMove(page: Page, timeout: number = 10000): Promise<void> {
  // Wait for turn indicator to change
  await page.waitForFunction(
    () => {
      const turnElement = document.querySelector('[data-testid="turn-indicator"]');
      return turnElement?.textContent?.includes('Your Turn');
    },
    { timeout }
  );
}

/**
 * Assert game state matches expected state
 */
export async function assertGameState(
  page: Page,
  expected: {
    currentTurn?: string;
    playerCount?: number;
    roomStatus?: string;
  }
): Promise<void> {
  if (expected.currentTurn) {
    const turnText = await page.locator('[data-testid="turn-indicator"]').textContent();
    expect(turnText).toContain(expected.currentTurn);
  }

  if (expected.playerCount !== undefined) {
    const playersText = await page.locator('[data-testid="player-count"]').textContent();
    expect(playersText).toContain(expected.playerCount.toString());
  }

  if (expected.roomStatus) {
    const statusText = await getRoomStatus(page);
    expect(statusText).toContain(expected.roomStatus);
  }
}

/**
 * Simulate network disconnection
 */
export async function simulateDisconnection(page: Page): Promise<void> {
  await page.context().setOffline(true);
}

/**
 * Restore network connection
 */
export async function restoreConnection(page: Page): Promise<void> {
  await page.context().setOffline(false);
}

/**
 * Get connection status from page
 */
export async function getConnectionStatus(page: Page): Promise<string> {
  const statusElement = await page.locator('[data-testid="connection-status"]').first();
  return await statusElement.textContent() || '';
}

/**
 * Copy room URL from share button
 */
export async function copyRoomUrl(page: Page): Promise<string> {
  // Click copy button
  await page.click('[data-testid="copy-room-url"]');

  // Get URL from clipboard or extract from page
  const urlElement = await page.locator('[data-testid="room-url"]').first();
  return await urlElement.textContent() || '';
}

/**
 * Wait for toast notification with specific message
 */
export async function waitForToast(
  page: Page,
  message: string,
  timeout: number = 5000
): Promise<void> {
  await page.waitForSelector(`[data-testid="toast"]:has-text("${message}")`, { timeout });
}

/**
 * Screenshot helper for debugging
 */
export async function takeDebugScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: `./test-results/debug-${name}-${Date.now()}.png`,
    fullPage: true,
  });
}
