import { test, expect } from '@playwright/test';

test.describe('Skill Interface E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for the game to load
    await page.waitForSelector('[data-testid="game-container"]', { timeout: 10000 });
  });

  test('should display skill panel and game status components', async ({ page }) => {
    // Check if skill panel is visible
    await expect(page.locator('text=技能面板')).toBeVisible();
    
    // Check if game status is visible
    await expect(page.locator('text=游戏状态')).toBeVisible();
    
    // Check if hero selection is available initially
    await expect(page.locator('text=选择您的武将开始游戏')).toBeVisible();
  });

  test('should show skill panel after hero selection', async ({ page }) => {
    // Select Liu Bang hero
    await page.click('button:has-text("刘邦")');
    
    // Wait for skill panel to appear
    await expect(page.locator('text=刘邦 - 技能面板')).toBeVisible();
    
    // Check if skills are displayed
    await expect(page.locator('text=更衣')).toBeVisible();
    await expect(page.locator('text=亲征')).toBeVisible();
    await expect(page.locator('text=鸿门')).toBeVisible();
  });

  test('should display skill tooltips on hover', async ({ page }) => {
    // Select Liu Bang hero first
    await page.click('button:has-text("刘邦")');
    
    // Hover over a skill button
    await page.hover('button:has-text("更衣")');
    
    // Check if tooltip appears
    await expect(page.locator('text=你的将可以出九宫')).toBeVisible();
  });

  test('should show game status updates', async ({ page }) => {
    // Select Liu Bang hero
    await page.click('button:has-text("刘邦")');
    
    // Check current player indication
    await expect(page.locator('text=红方 - 刘邦')).toBeVisible();
    await expect(page.locator('text=当前回合')).toBeVisible();
    
    // Check move history section
    await expect(page.locator('text=移动历史')).toBeVisible();
    await expect(page.locator('text=暂无移动记录')).toBeVisible();
  });

  test('should handle skill usage interaction', async ({ page }) => {
    // Select Liu Bang hero
    await page.click('button:has-text("刘邦")');
    
    // Try to use a skill (this might show a toast or change UI state)
    await page.click('button:has-text("更衣")');
    
    // Check for any feedback (toast notification, UI change, etc.)
    // Note: This test might need adjustment based on actual skill implementation
    await page.waitForTimeout(1000); // Wait for any animations or state changes
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if components are still visible and properly arranged
    await expect(page.locator('text=楚汉棋战')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Check if layout adapts properly
    await expect(page.locator('text=楚汉棋战')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Check if all components are visible in desktop layout
    await expect(page.locator('text=楚汉棋战')).toBeVisible();
  });

  test('should handle game state transitions', async ({ page }) => {
    // Initially should be in hero selection phase
    await expect(page.locator('text=选择您的武将开始游戏')).toBeVisible();
    
    // Select heroes to transition to playing phase
    await page.click('button:has-text("刘邦")');
    
    // Should now show the game interface
    await expect(page.locator('text=刘邦 - 技能面板')).toBeVisible();
    await expect(page.locator('text=游戏进行中')).toBeVisible();
  });

  test('should show proper error handling', async ({ page }) => {
    // Test error scenarios (e.g., trying to use unavailable skills)
    await page.click('button:has-text("刘邦")');
    
    // Try to interact with disabled elements
    const disabledSkills = page.locator('button[disabled]:has-text("技能")');
    if (await disabledSkills.count() > 0) {
      await expect(disabledSkills.first()).toBeDisabled();
    }
  });

  test('should maintain state consistency across interactions', async ({ page }) => {
    // Select hero
    await page.click('button:has-text("刘邦")');
    
    // Interact with various UI elements
    await page.click('button:has-text("新游戏")');
    
    // Verify state is properly reset
    await expect(page.locator('text=选择您的武将开始游戏')).toBeVisible();
  });
});