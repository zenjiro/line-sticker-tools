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

    test('should support auto-zoom mode', async ({ page }) => {
        // Upload multiple images
        const files = Array.from({ length: 8 }, (_, i) => ({
            name: `sticker${i}.png`,
            mimeType: 'image/png',
            buffer: createDummyPng(),
        }));
        await page.locator('input[type="file"]').setInputFiles(files);
        await expect(page.locator('.image-tile')).toHaveCount(9); // 8 images + 1 dummy

        // Get initial image size (auto-zoom mode is enabled by default)
        const initialSize = await page.locator('.image-tile').first().evaluate(el => el.offsetWidth);

        // Manual zoom in (Ctrl++) - should disable auto-zoom mode
        await page.keyboard.press('Control++');
        const manualSize = await page.locator('.image-tile').first().evaluate(el => el.offsetWidth);
        expect(manualSize).toBeGreaterThan(initialSize);

        // Add more images - size should NOT change significantly (auto-zoom mode is disabled)
        const moreFiles = Array.from({ length: 2 }, (_, i) => ({
            name: `sticker${i + 8}.png`,
            mimeType: 'image/png',
            buffer: createDummyPng(),
        }));
        await page.locator('input[type="file"]').setInputFiles(moreFiles);
        await expect(page.locator('.image-tile')).toHaveCount(11); // 10 images + 1 dummy
        const sizeAfterAdd = await page.locator('.image-tile').first().evaluate(el => el.offsetWidth);
        // Size should be close to manual size (within 10px tolerance for grid adjustments)
        expect(Math.abs(sizeAfterAdd - manualSize)).toBeLessThan(10);

        // Reset zoom (Ctrl+0) - should re-enable auto-zoom mode
        await page.keyboard.press('Control+0');
        const resetSize = await page.locator('.image-tile').first().evaluate(el => el.offsetWidth);
        // After reset, size should be recalculated to fit all images
        expect(resetSize).toBeLessThan(manualSize); // Should be smaller to fit more images
    });
});
