import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Create a dummy transparent PNG for testing
const createDummyPng = () => {
    // 1x1 transparent PNG base64
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    return Buffer.from(base64, 'base64');
};

test.describe('Sticker GUI', () => {
    test.beforeEach(async ({ page }) => {
        // Go to the app
        await page.goto('/');
    });

    test('should load the application correctly', async ({ page }) => {
        await expect(page.locator('h1')).toHaveText('LINE Sticker Arranger');
        await expect(page.getByRole('button', { name: '画像を追加' })).toBeVisible();
        await expect(page.getByText('ゴミ箱（空）')).not.toBeVisible();
    });

    test('should upload images and display them in grid', async ({ page }) => {
        // Create dummy files
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

        // Upload files
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles([file1, file2]);

        // Verify images appear
        // +1 for dummy tile
        await expect(page.locator('.image-tile')).toHaveCount(3);
        await expect(page.locator('.image-count')).toContainText('2枚');
    });

    test('should support keyboard navigation and selection', async ({ page }) => {
        // Upload 3 images
        const files = Array.from({ length: 3 }, (_, i) => ({
            name: `sticker${i}.png`,
            mimeType: 'image/png',
            buffer: createDummyPng(),
        }));
        await page.locator('input[type="file"]').setInputFiles(files);

        // Initial focus on first image
        const tiles = page.locator('.image-tile');
        // Click to ensure window focus
        await tiles.nth(0).click();

        await expect(tiles.nth(0)).toHaveClass(/focused/);

        // Move right -> Focus second
        await page.keyboard.press('ArrowRight');
        await expect(tiles.nth(1)).toHaveClass(/focused/);

        // Shift + Right -> Select second and third (if we started at 1)
        // Logic: Focus is at 1. Shift+ArrowRight moves focus to 2.
        // Anchor set at 1. Range 1-2 selected.
        await page.keyboard.press('Shift+ArrowRight');
        await expect(tiles.nth(2)).toHaveClass(/focused/);
        await expect(tiles.nth(1)).toHaveClass(/selected/);
        await expect(tiles.nth(2)).toHaveClass(/selected/);
    });

    test('should move images with Alt+Arrow', async ({ page }) => {
        // Upload 3 images
        const files = Array.from({ length: 3 }, (_, i) => ({
            name: `sticker${i}.png`,
            mimeType: 'image/png',
            buffer: createDummyPng(),
        }));
        await page.locator('input[type="file"]').setInputFiles(files);

        // Select first image
        await page.focus('.image-tile'); // Ensure focus is on grid (or rely on initial)
        // Wait, focusIndex defaults to 0. But we need to ensure keyboard events go to window?
        // useKeyboardNavigation attaches to window.

        // Ensure tiles are visible
        const tiles = page.locator('.image-tile');
        await expect(tiles.nth(0)).toBeVisible();

        await page.keyboard.press('Space'); // Select 0
        await expect(tiles.nth(0)).toHaveClass(/selected/); // Verify selection

        // Move right
        await page.keyboard.press('Alt+ArrowRight');

        // Check for error message if any
        // const msg = await page.locator('.status-message').textContent();
        // console.log('Status:', msg);

        // Now the first image (sticker0) should be at index 1
        // Verify order change
        const movedTiles = page.locator('.image-tile');
        await expect(movedTiles.nth(1).locator('img')).toHaveAttribute('alt', 'sticker0.png');
        await expect(movedTiles.nth(0).locator('img')).toHaveAttribute('alt', 'sticker1.png');

        // And focus should follow it
        await expect(movedTiles.nth(1)).toHaveClass(/focused/);
    });

    test('should support main/tab image assignment', async ({ page }) => {
        const files = Array.from({ length: 2 }, (_, i) => ({
            name: `sticker${i}.png`,
            mimeType: 'image/png',
            buffer: createDummyPng(),
        }));
        await page.locator('input[type="file"]').setInputFiles(files);
        await expect(page.locator('.image-tile')).toHaveCount(3);

        // Click to ensure focus
        await page.locator('.image-tile').first().click();

        // Set first as Main (M key)
        await page.keyboard.press('m');
        await expect(page.locator('.badge.main')).toBeVisible();
        await expect(page.getByText('メイン✓')).toBeVisible();

        // Move to second and set as Tab (T key)
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('t');
        await expect(page.locator('.badge.tab')).toBeVisible();
        await expect(page.getByText('タブ✓')).toBeVisible();
    });

    test('should support trash operations', async ({ page }) => {
        const files = [{
            name: 'sticker1.png',
            mimeType: 'image/png',
            buffer: createDummyPng(),
        }];
        await page.locator('input[type="file"]').setInputFiles(files);

        // Ensure focus
        await page.locator('.image-tile').first().click();

        // Delete
        await page.keyboard.press('Delete');

        // Check main area empty (except dummy?) - actually logic says:
        // If focusIndex >= images.length (dummy), return.
        // If we delete the only image, images.length becomes 0.
        // ImageGrid renders dummy tile if length > 0? No, checking code:
        // ImageGrid always renders dummy tile at end.
        // App renders ImageGrid only if images.length > 0 OR dropzone?
        // <main className="main-area"> {images.length === 0 ? <drop-zone> : <ImageGrid> }

        // So if we delete the last image, it goes back to drop zone
        await expect(page.locator('.drop-zone')).toBeVisible();

        // Check trash area
        await expect(page.locator('.trash-tile')).toHaveCount(1);

        // Navigate to trash
        await page.keyboard.press('ArrowDown'); // Focus on trash

        // Restore
        await page.keyboard.press('Delete'); // Restore

        // +1 for dummy tile
        await expect(page.locator('.image-tile')).toHaveCount(2);
        await expect(page.locator('.trash-tile')).toHaveCount(0);
    });
});
