import { test, expect } from '@playwright/test';

test.describe('Complete Game Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for the game to load
    await page.waitForSelector('[data-testid="game-container"]', { timeout: 10000 });
  });

  test('should complete a full game flow: Liu Bang vs Xiang Yu', async ({ page }) => {
    // Step 1: Initial state - should be in hero selection
    await expect(page.locator('text=选择您的武将开始游戏')).toBeVisible();
    await expect(page.locator('text=武将选择中')).toBeVisible();
    
    // Step 2: Select Liu Bang for red player
    await page.click('button:has-text("刘邦")');
    
    // Wait for hero selection to process
    await page.waitForTimeout(500);
    
    // Step 3: Select Xiang Yu for black player (simulate second player selection)
    // Note: In the current implementation, we need to select both heroes
    await page.click('button:has-text("项羽")');
    
    // Wait for game to start
    await page.waitForTimeout(1000);
    
    // Step 4: Verify game has started
    await expect(page.locator('text=游戏进行中')).toBeVisible();
    await expect(page.locator('text=红方 - 刘邦')).toBeVisible();
    await expect(page.locator('text=黑方 - 项羽')).toBeVisible();
    
    // Step 5: Verify chess board is displayed
    await expect(page.locator('text=HTML/CSS 棋盘')).toBeVisible();
    
    // Step 6: Verify skill panels are working
    await expect(page.locator('text=刘邦 - 技能面板')).toBeVisible();
    await expect(page.locator('text=更衣')).toBeVisible();
    await expect(page.locator('text=亲征')).toBeVisible();
    await expect(page.locator('text=鸿门')).toBeVisible();
    
    // Step 7: Test skill interaction
    await page.click('button:has-text("更衣")');
    
    // Wait for any skill effects
    await page.waitForTimeout(500);
    
    // Step 8: Verify game state updates
    await expect(page.locator('text=移动历史')).toBeVisible();
    
    // Step 9: Test game controls
    await page.click('button:has-text("重新开始")');
    
    // Wait for game reset
    await page.waitForTimeout(1000);
    
    // Step 10: Verify game has reset to hero selection
    await expect(page.locator('text=选择您的武将开始游戏')).toBeVisible();
  });

  test('should handle piece movement and game mechanics', async ({ page }) => {
    // Setup: Select heroes and start game
    await page.click('button:has-text("刘邦")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("项羽")');
    await page.waitForTimeout(1000);
    
    // Verify game is in playing state
    await expect(page.locator('text=游戏进行中')).toBeVisible();
    
    // Test piece interaction (click on chess pieces)
    // Note: This depends on the fallback board implementation
    const chessPieces = page.locator('[class*="rounded-full"][class*="cursor-pointer"]');
    
    if (await chessPieces.count() > 0) {
      // Click on a piece to select it
      await chessPieces.first().click();
      
      // Wait for selection feedback
      await page.waitForTimeout(500);
      
      // Verify selection state (look for visual feedback)
      // This might show as highlighted pieces or valid move indicators
    }
    
    // Test turn-based mechanics
    await expect(page.locator('text=当前回合')).toBeVisible();
  });

  test('should display proper game status and information', async ({ page }) => {
    // Setup game
    await page.click('button:has-text("刘邦")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("项羽")');
    await page.waitForTimeout(1000);
    
    // Verify game status panel
    await expect(page.locator('text=游戏状态')).toBeVisible();
    await expect(page.locator('text=游戏进行中')).toBeVisible();
    
    // Verify player information
    await expect(page.locator('text=红方 - 刘邦')).toBeVisible();
    await expect(page.locator('text=黑方 - 项羽')).toBeVisible();
    
    // Verify current turn indicator
    await expect(page.locator('text=当前回合')).toBeVisible();
    
    // Verify move history
    await expect(page.locator('text=移动历史')).toBeVisible();
    await expect(page.locator('text=(0 步)')).toBeVisible();
    await expect(page.locator('text=暂无移动记录')).toBeVisible();
    
    // Verify game controls
    await expect(page.locator('button:has-text("撤销")')).toBeVisible();
    await expect(page.locator('button:has-text("新游戏")')).toBeVisible();
    await expect(page.locator('button:has-text("重新开始")')).toBeVisible();
  });

  test('should handle skill system correctly', async ({ page }) => {
    // Setup game
    await page.click('button:has-text("刘邦")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("项羽")');
    await page.waitForTimeout(1000);
    
    // Test Liu Bang skills
    await expect(page.locator('text=刘邦 - 技能面板')).toBeVisible();
    
    // Verify all Liu Bang skills are present
    await expect(page.locator('button:has-text("更衣")')).toBeVisible();
    await expect(page.locator('button:has-text("亲征")')).toBeVisible();
    await expect(page.locator('button:has-text("鸿门")')).toBeVisible();
    
    // Test skill tooltips
    await page.hover('button:has-text("更衣")');
    await page.waitForTimeout(500);
    await expect(page.locator('text=你的将可以出九宫')).toBeVisible();
    
    await page.hover('button:has-text("亲征")');
    await page.waitForTimeout(500);
    await expect(page.locator('text=强制对方将与你的将在同一条线上')).toBeVisible();
    
    await page.hover('button:has-text("鸿门")');
    await page.waitForTimeout(500);
    await expect(page.locator('text=你的士可以出九宫但不能过河')).toBeVisible();
    
    // Test skill usage
    await page.click('button:has-text("更衣")');
    await page.waitForTimeout(1000);
    
    // Verify skill feedback (might be toast notification or UI change)
    // The exact verification depends on skill implementation
  });

  test('should handle game over scenarios', async ({ page }) => {
    // Setup game
    await page.click('button:has-text("刘邦")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("项羽")');
    await page.waitForTimeout(1000);
    
    // Test new game functionality
    await page.click('button:has-text("重新开始")');
    await page.waitForTimeout(1000);
    
    // Should return to hero selection
    await expect(page.locator('text=选择您的武将开始游戏')).toBeVisible();
    
    // Test game restart from hero selection
    await page.click('button:has-text("刘邦")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("项羽")');
    await page.waitForTimeout(1000);
    
    // Should be back in playing state
    await expect(page.locator('text=游戏进行中')).toBeVisible();
  });

  test('should be responsive and accessible', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Verify main elements are visible
      await expect(page.locator('text=楚汉棋战')).toBeVisible();
      await expect(page.locator('text=选择您的武将开始游戏')).toBeVisible();
      
      // Test hero selection works on this viewport
      await page.click('button:has-text("刘邦")');
      await page.waitForTimeout(500);
      await page.click('button:has-text("项羽")');
      await page.waitForTimeout(1000);
      
      // Verify game interface is accessible
      await expect(page.locator('text=游戏进行中')).toBeVisible();
      
      // Reset for next viewport test
      await page.click('button:has-text("重新开始")');
      await page.waitForTimeout(1000);
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test various error scenarios
    
    // 1. Test rapid clicking (should not break the game)
    for (let i = 0; i < 5; i++) {
      await page.click('button:has-text("刘邦")');
      await page.waitForTimeout(100);
    }
    
    // Game should still be functional
    await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
    
    // 2. Test navigation during game
    await page.reload();
    await page.waitForSelector('[data-testid="game-container"]', { timeout: 10000 });
    
    // Should return to initial state
    await expect(page.locator('text=选择您的武将开始游戏')).toBeVisible();
    
    // 3. Test game state consistency
    await page.click('button:has-text("刘邦")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("项羽")');
    await page.waitForTimeout(1000);
    
    // Multiple new game clicks should not break anything
    await page.click('button:has-text("重新开始")');
    await page.click('button:has-text("重新开始")');
    await page.waitForTimeout(1000);
    
    // Should still be functional
    await expect(page.locator('text=选择您的武将开始游戏')).toBeVisible();
  });

  test('should maintain performance under interaction load', async ({ page }) => {
    // Performance test: rapid interactions
    const startTime = Date.now();
    
    // Rapid hero selection and game restart
    for (let i = 0; i < 3; i++) {
      await page.click('button:has-text("刘邦")');
      await page.waitForTimeout(200);
      await page.click('button:has-text("项羽")');
      await page.waitForTimeout(500);
      await page.click('button:has-text("重新开始")');
      await page.waitForTimeout(500);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete within reasonable time (10 seconds)
    expect(duration).toBeLessThan(10000);
    
    // Game should still be functional
    await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
    await expect(page.locator('text=选择您的武将开始游戏')).toBeVisible();
  });
});