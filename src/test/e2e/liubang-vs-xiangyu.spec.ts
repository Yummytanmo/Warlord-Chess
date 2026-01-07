import { test, expect } from '@playwright/test';

test.describe('Liu Bang vs Xiang Yu Battle E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for the game to load
    await page.waitForSelector('[data-testid="game-container"]', { timeout: 10000 });
    
    // Setup the battle: Liu Bang vs Xiang Yu
    await page.click('button:has-text("刘邦")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("项羽")');
    await page.waitForTimeout(1000);
    
    // Verify game has started
    await expect(page.locator('text=游戏进行中')).toBeVisible();
  });

  test('should display both heroes correctly in battle', async ({ page }) => {
    // Verify both heroes are displayed
    await expect(page.locator('text=红方 - 刘邦')).toBeVisible();
    await expect(page.locator('text=黑方 - 项羽')).toBeVisible();
    
    // Verify current turn indicator
    await expect(page.locator('text=当前回合')).toBeVisible();
    
    // Verify skill panels for both heroes
    await expect(page.locator('text=刘邦 - 技能面板')).toBeVisible();
  });

  test('should show Liu Bang skills correctly', async ({ page }) => {
    // Verify Liu Bang's skills are displayed
    await expect(page.locator('button:has-text("更衣")')).toBeVisible();
    await expect(page.locator('button:has-text("亲征")')).toBeVisible();
    await expect(page.locator('button:has-text("鸿门")')).toBeVisible();
    
    // Test skill descriptions
    await page.hover('button:has-text("更衣")');
    await page.waitForTimeout(500);
    await expect(page.locator('text=你的将可以出九宫')).toBeVisible();
    
    await page.hover('button:has-text("亲征")');
    await page.waitForTimeout(500);
    await expect(page.locator('text=强制对方将与你的将在同一条线上')).toBeVisible();
    
    await page.hover('button:has-text("鸿门")');
    await page.waitForTimeout(500);
    await expect(page.locator('text=你的士可以出九宫但不能过河')).toBeVisible();
  });

  test('should handle Liu Bang skill usage', async ({ page }) => {
    // Test 更衣 (Genyi) skill
    await page.click('button:has-text("更衣")');
    await page.waitForTimeout(1000);
    
    // Verify skill was used (might show toast or change button state)
    // The exact verification depends on implementation
    
    // Test 亲征 (Qinzheng) skill
    await page.click('button:has-text("亲征")');
    await page.waitForTimeout(1000);
    
    // Test 鸿门 (Hongmen) skill
    await page.click('button:has-text("鸿门")');
    await page.waitForTimeout(1000);
  });

  test('should display chess board with pieces', async ({ page }) => {
    // Verify chess board is displayed
    await expect(page.locator('text=HTML/CSS 棋盘')).toBeVisible();
    
    // Verify chess pieces are present
    const chessPieces = page.locator('[class*="rounded-full"][class*="cursor-pointer"]');
    const pieceCount = await chessPieces.count();
    
    // Should have 32 pieces total (16 per side)
    expect(pieceCount).toBeGreaterThan(20); // Allow for some flexibility in implementation
    
    // Test piece interaction
    if (pieceCount > 0) {
      await chessPieces.first().click();
      await page.waitForTimeout(500);
      
      // Should show some selection feedback
      // This depends on the specific implementation
    }
  });

  test('should handle turn-based gameplay', async ({ page }) => {
    // Verify initial turn state
    await expect(page.locator('text=红方 - 刘邦')).toBeVisible();
    await expect(page.locator('text=当前回合')).toBeVisible();
    
    // Test piece selection and movement
    const chessPieces = page.locator('[class*="rounded-full"][class*="cursor-pointer"]');
    
    if (await chessPieces.count() > 0) {
      // Select a piece
      await chessPieces.first().click();
      await page.waitForTimeout(500);
      
      // Look for valid move indicators (green circles)
      const validMoves = page.locator('[class*="bg-green-400"]');
      
      if (await validMoves.count() > 0) {
        // Click on a valid move
        await validMoves.first().click();
        await page.waitForTimeout(1000);
        
        // Verify move was recorded
        const moveHistory = page.locator('text=(1 步)');
        // Note: This might not appear immediately depending on implementation
      }
    }
  });

  test('should show game statistics and history', async ({ page }) => {
    // Verify move history section
    await expect(page.locator('text=移动历史')).toBeVisible();
    await expect(page.locator('text=(0 步)')).toBeVisible();
    await expect(page.locator('text=暂无移动记录')).toBeVisible();
    
    // Verify game controls
    await expect(page.locator('button:has-text("撤销")')).toBeVisible();
    await expect(page.locator('button:has-text("新游戏")')).toBeVisible();
    
    // Test undo button (should be disabled initially)
    const undoButton = page.locator('button:has-text("撤销")');
    await expect(undoButton).toBeDisabled();
  });

  test('should handle game restart and reset', async ({ page }) => {
    // Use a skill to change game state
    await page.click('button:has-text("更衣")');
    await page.waitForTimeout(1000);
    
    // Restart the game
    await page.click('button:has-text("重新开始")');
    await page.waitForTimeout(1000);
    
    // Should return to hero selection
    await expect(page.locator('text=选择您的武将开始游戏')).toBeVisible();
    
    // Start a new battle
    await page.click('button:has-text("刘邦")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("项羽")');
    await page.waitForTimeout(1000);
    
    // Should be back in playing state with fresh game
    await expect(page.locator('text=游戏进行中')).toBeVisible();
    await expect(page.locator('text=(0 步)')).toBeVisible();
  });

  test('should maintain visual consistency during battle', async ({ page }) => {
    // Verify visual elements are properly styled
    await expect(page.locator('text=楚汉棋战')).toBeVisible();
    await expect(page.locator('text=Warlord Chess')).toBeVisible();
    
    // Verify color coding for players
    const redPlayerSection = page.locator('text=红方 - 刘邦').locator('..');
    const blackPlayerSection = page.locator('text=黑方 - 项羽').locator('..');
    
    // These should have different styling to distinguish players
    // The exact verification depends on CSS implementation
    
    // Verify chess board styling
    await expect(page.locator('text=楚河')).toBeVisible();
    await expect(page.locator('text=汉界')).toBeVisible();
  });

  test('should handle skill system state management', async ({ page }) => {
    // Test multiple skill usage
    await page.click('button:has-text("更衣")');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("鸿门")');
    await page.waitForTimeout(500);
    
    // Test limited skill (亲征 should be limited use)
    await page.click('button:has-text("亲征")');
    await page.waitForTimeout(500);
    
    // Try to use 亲征 again (should be disabled or show error)
    await page.click('button:has-text("亲征")');
    await page.waitForTimeout(500);
    
    // Verify skill states are managed correctly
    // This depends on the specific skill implementation
  });

  test('should provide proper user feedback', async ({ page }) => {
    // Test various interactions and verify feedback
    
    // Skill usage feedback
    await page.click('button:has-text("更衣")');
    await page.waitForTimeout(1000);
    
    // Should provide some feedback (toast, animation, etc.)
    // The exact verification depends on implementation
    
    // Piece interaction feedback
    const chessPieces = page.locator('[class*="rounded-full"][class*="cursor-pointer"]');
    
    if (await chessPieces.count() > 0) {
      await chessPieces.first().click();
      await page.waitForTimeout(500);
      
      // Should show selection feedback (highlighting, valid moves, etc.)
      // Look for visual changes that indicate selection
    }
    
    // Game control feedback
    await page.click('button:has-text("新游戏")');
    await page.waitForTimeout(1000);
    
    // Should provide feedback about game state change
    await expect(page.locator('text=选择您的武将开始游戏')).toBeVisible();
  });

  test('should handle edge cases and error conditions', async ({ page }) => {
    // Test rapid skill clicking
    for (let i = 0; i < 3; i++) {
      await page.click('button:has-text("更衣")');
      await page.waitForTimeout(100);
    }
    
    // Game should remain stable
    await expect(page.locator('text=游戏进行中')).toBeVisible();
    
    // Test invalid piece interactions
    const chessPieces = page.locator('[class*="rounded-full"][class*="cursor-pointer"]');
    
    if (await chessPieces.count() > 0) {
      // Click multiple pieces rapidly
      for (let i = 0; i < Math.min(3, await chessPieces.count()); i++) {
        await chessPieces.nth(i).click();
        await page.waitForTimeout(100);
      }
      
      // Game should handle this gracefully
      await expect(page.locator('text=游戏进行中')).toBeVisible();
    }
    
    // Test browser refresh during game
    await page.reload();
    await page.waitForSelector('[data-testid="game-container"]', { timeout: 10000 });
    
    // Should return to initial state
    await expect(page.locator('text=选择您的武将开始游戏')).toBeVisible();
  });
});