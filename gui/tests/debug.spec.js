import { test, expect } from '@playwright/test';

test('Debug Remove BG load', async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));

    await page.goto('remove-bg/');
    await page.waitForTimeout(2000);
    const content = await page.content();
    console.log('PAGE CONTENT:', content);

    // Check if root has anything
    const rootHtml = await page.innerHTML('#root');
    console.log('ROOT HTML:', rootHtml);
});
