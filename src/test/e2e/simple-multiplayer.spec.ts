/**
 * Simple E2E test for multiplayer room creation
 * Tests basic room creation flow
 */

import { test, expect } from '@playwright/test';

test.describe('E2E: Simple Multiplayer Flow', () => {
  test('should create room via Chinese button', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');

    // Wait for game container to load
    await page.waitForSelector('[data-testid="game-container"]', { timeout: 10000 });

    // Verify the Chinese button exists and is visible
    const createButton = page.locator('button:has-text("创建多人房间")');
    await expect(createButton).toBeVisible();

    // Click the button
    await createButton.click();

    // Should navigate to room page
    await page.waitForURL(/\/room\/[^/]+/, { timeout: 15000 });

    // Verify we're on the room page
    await expect(page.locator('text=多人游戏房间')).toBeVisible();

    // Verify URL contains room ID
    const url = page.url();
    expect(url).toMatch(/\/room\//);
  });

  test('should display room information after creation', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');

    // Wait for page to load
    await page.waitForSelector('[data-testid="game-container"]', { timeout: 10000 });

    // Click create room button
    await page.click('button:has-text("创建多人房间")');

    // Wait for navigation to room page
    await page.waitForURL(/\/room\/[^/]+/, { timeout: 15000 });

    // Wait for room page to load
    await page.waitForSelector('text=多人游戏房间', { timeout: 10000 });

    // Verify room page elements (use first matching element)
    await expect(page.locator('text=房间ID').first()).toBeVisible();
    await expect(page.locator('text=玩家:')).toBeVisible();
    await expect(page.locator('text=等待玩家加入')).toBeVisible();

    // Verify share URL section exists
    await expect(page.locator('text=分享此链接邀请好友加入')).toBeVisible();
  });

  test('should have copy URL button', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');

    // Wait for page to load
    await page.waitForSelector('[data-testid="game-container"]', { timeout: 10000 });

    // Click create room button
    await page.click('button:has-text("创建多人房间")');

    // Wait for room page
    await page.waitForSelector('text=多人游戏房间', { timeout: 10000 });

    // Verify copy button exists
    const copyButton = page.locator('button:has-text("复制链接")');
    await expect(copyButton).toBeVisible();
  });
});
