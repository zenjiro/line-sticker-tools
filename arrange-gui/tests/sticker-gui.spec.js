import { test, expect } from '@playwright/test';

// Create a dummy transparent PNG for testing
const createDummyPng = () => {
    // 1x1 transparent PNG base64
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    return Buffer.from(base64, 'base64');
};

test.describe('Sticker GUI (Japanese)', () => {
    test.use({ locale: 'ja-JP' });

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should load the application correctly', async ({ page }) => {
        await expect(page.locator('h1')).toHaveText('LINE Sticker Arranger');
        await expect(page.getByRole('button', { name: '画像を追加' })).toBeVisible();
        await expect(page.getByText('ゴミ箱（空）')).not.toBeVisible();
    });

    test('should upload images and display them in grid', async ({ page }) => {
        const file1 = {
            name: 'sticker1.png',
            mimeType: 'image/png',
            buffer: createDummyPng(),
        };
        const file2 = {
            name: 'sticker2.png',
            mimeType: 'image/png',
            buffer: createDummyPng(),
        };

        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles([file1, file2]);

        await expect(page.locator('.image-tile')).toHaveCount(3);
        await expect(page.locator('.image-count')).toContainText('2枚');
    });

    test('should support main/tab image assignment', async ({ page }) => {
        const files = Array.from({ length: 2 }, (_, i) => ({
            name: `sticker${i}.png`,
            mimeType: 'image/png',
            buffer: createDummyPng(),
        }));
        await page.locator('input[type="file"]').setInputFiles(files);
        await expect(page.locator('.image-tile')).toHaveCount(3);

        await page.locator('.image-tile').first().click();

        await page.keyboard.press('m');
        await expect(page.locator('.badge.main')).toBeVisible();
        // Assuming the badge text or status text shows this
        await expect(page.getByText('メイン✓')).toBeVisible();

        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('t');
        await expect(page.locator('.badge.tab')).toBeVisible();
        await expect(page.getByText('タブ✓')).toBeVisible();
    });

    test('should hide trash area initially and show when images are deleted', async ({ page }) => {
        const files = Array.from({ length: 2 }, (_, i) => ({
            name: `sticker${i}.png`,
            mimeType: 'image/png',
            buffer: createDummyPng(),
        }));
        await page.locator('input[type="file"]').setInputFiles(files);

        // Initially trash should not be visible
        await expect(page.locator('.trash-area')).not.toBeVisible();

        // Delete first image
        await page.keyboard.press('Delete');

        // Trash should now be visible
        await expect(page.locator('.trash-area')).toBeVisible();
    });

    test('should reset zoom with Ctrl+0 and enable auto-zoom mode', async ({ page }) => {
        const files = Array.from({ length: 2 }, (_, i) => ({
            name: `sticker${i}.png`,
            mimeType: 'image/png',
            buffer: createDummyPng(),
        }));
        await page.locator('input[type="file"]').setInputFiles(files);

        // First zoom in manually
        await page.keyboard.press('Control+;');

        // Get current size
        const tile = page.locator('.image-tile').first();
        const sizeBefore = await tile.evaluate(el => el.style.width);

        // Press Ctrl+0 to reset
        await page.keyboard.press('Control+0');

        // Size should change (auto-fit)
        await page.waitForTimeout(100);
        const sizeAfter = await tile.evaluate(el => el.style.width);
        expect(sizeAfter).not.toBe(sizeBefore);
    });

    test('should disable auto-zoom mode when zooming manually', async ({ page }) => {
        const files = Array.from({ length: 2 }, (_, i) => ({
            name: `sticker${i}.png`,
            mimeType: 'image/png',
            buffer: createDummyPng(),
        }));
        await page.locator('input[type="file"]').setInputFiles(files);

        // Get initial size
        const tile = page.locator('.image-tile').first();
        const initialSize = await tile.evaluate(el => el.style.width);

        // Zoom in manually with Ctrl+;
        await page.keyboard.press('Control+;');
        await page.waitForTimeout(100);
        const sizeAfterZoomIn = await tile.evaluate(el => el.style.width);

        // Size should have increased
        expect(parseInt(sizeAfterZoomIn)).toBeGreaterThan(parseInt(initialSize));

        // Delete an image to trigger trash visibility
        await page.keyboard.press('Delete');

        // Wait for trash to appear
        await expect(page.locator('.trash-area')).toBeVisible();

        // Since auto-zoom is disabled, size should NOT change after trash appears
        await page.waitForTimeout(100);
        const sizeAfterTrash = await tile.evaluate(el => el.style.width);
        expect(sizeAfterTrash).toBe(sizeAfterZoomIn);
    });
});

test.describe('Sticker GUI (English)', () => {
    test.use({ locale: 'en-US' });

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should load in English by default', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Add Images' })).toBeVisible();
    });

    test('should toggle language', async ({ page }) => {
        // Initial state English
        await expect(page.getByRole('button', { name: 'Add Images' })).toBeVisible();

        // Toggle to Japanese
        await page.click('button.lang-toggle');
        await expect(page.getByRole('button', { name: '画像を追加' })).toBeVisible();

        // Toggle back to English
        await page.click('button.lang-toggle');
        await expect(page.getByRole('button', { name: 'Add Images' })).toBeVisible();
    });
});
