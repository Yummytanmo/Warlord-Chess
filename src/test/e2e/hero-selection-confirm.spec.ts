import { test, expect } from '@playwright/test';

test.describe('Hero Selection Flow', () => {
    test('should allow confirming hero selection', async ({ browser }) => {
        // Create two contexts for two players
        const context1 = await browser.newContext();
        const context2 = await browser.newContext();
        const page1 = await context1.newPage();
        const page2 = await context2.newPage();

        // 1. Join room
        await page1.goto('http://localhost:3000');
        await page1.click('text=创建房间');
        const roomUrl = page1.url();

        await page2.goto(roomUrl);
        await page2.fill('input[placeholder="请输入您的昵称"]', 'Player 2');
        await page2.click('text=加入房间');

        // 2. Wait for game to start (hero selection phase)
        await expect(page1.locator('text=选择您的武将')).toBeVisible();
        await expect(page2.locator('text=选择您的武将')).toBeVisible();

        // 3. Player 1 selects a hero (preview)
        await page1.click('text=关羽');
        await expect(page1.locator('text=确认选择')).toBeVisible();

        // 4. Player 1 confirms selection
        await page1.click('text=确认选择');
        await expect(page1.locator('text=等待对手选择...')).toBeVisible();

        // 5. Player 2 selects the SAME hero (should be allowed)
        await page2.click('text=关羽');
        await expect(page2.locator('text=确认选择')).toBeVisible();
        await page2.click('text=确认选择');

        // 6. Game starts
        await expect(page1.locator('text=游戏进行中')).toBeVisible();
        await expect(page2.locator('text=游戏进行中')).toBeVisible();
    });
});
