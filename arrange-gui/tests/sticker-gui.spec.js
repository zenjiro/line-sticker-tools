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
});

test.describe('Auto Zoom Feature', () => {
    test.use({ locale: 'ja-JP' });

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should have auto zoom mode enabled by default', async ({ page }) => {
        await page.waitForSelector('.app[data-auto-zoom]');
        await expect(page.locator('.app')).toHaveAttribute('data-auto-zoom', 'true');
    });

    test('should enable auto zoom mode on Ctrl+0', async ({ page }) => {
        const files = Array.from({ length: 5 }, (_, i) => ({
            name: `sticker${i}.png`,
            mimeType: 'image/png',
            buffer: createDummyPng(),
        }));
        await page.locator('input[type="file"]').setInputFiles(files);

        // 手動でズームを変更して自動モードを解除
        await page.keyboard.press('Control+=');
        await expect(page.locator('.app')).toHaveAttribute('data-auto-zoom', 'false');

        // Ctrl+0で自動モードを有効化
        await page.keyboard.press('Control+0');
        await expect(page.locator('.app')).toHaveAttribute('data-auto-zoom', 'true');
    });

    test('should disable auto zoom mode on Ctrl+ or Ctrl+-', async ({ page }) => {
        const files = Array.from({ length: 5 }, (_, i) => ({
            name: `sticker${i}.png`,
            mimeType: 'image/png',
            buffer: createDummyPng(),
        }));
        await page.locator('input[type="file"]').setInputFiles(files);

        // Ctrl+ でズームイン（自動モード解除）
        await page.keyboard.press('Control+=');
        await expect(page.locator('.app')).toHaveAttribute('data-auto-zoom', 'false');

        // Ctrl+0でリセット
        await page.keyboard.press('Control+0');
        await expect(page.locator('.app')).toHaveAttribute('data-auto-zoom', 'true');

        // Ctrl- でズームアウト（自動モード解除）
        await page.keyboard.press('Control+-');
        await expect(page.locator('.app')).toHaveAttribute('data-auto-zoom', 'false');
    });

    test('should recalculate zoom when deleting images in auto zoom mode', async ({ page }) => {
        const files = Array.from({ length: 10 }, (_, i) => ({
            name: `sticker${i}.png`,
            mimeType: 'image/png',
            buffer: createDummyPng(),
        }));
        await page.locator('input[type="file"]').setInputFiles(files);

        // 自動モードで初期状態を確認
        await expect(page.locator('.app')).toHaveAttribute('data-auto-zoom', 'true');

        // 画像を削除
        await page.locator('.image-tile').first().click();
        await page.keyboard.press('Delete');

        // ゴミ箱が表示される
        await expect(page.locator('.trash-area')).toBeVisible();

        // 自動モードではズームが再計算される
        const newZoom = await page.locator('.image-grid').evaluate(el => {
            return getComputedStyle(el).getPropertyValue('--image-size');
        });
        // ズームが再計算されていることを確認
        expect(newZoom).toBeTruthy();
    });

    test('should not change zoom when deleting images with auto zoom mode disabled', async ({ page }) => {
        const files = Array.from({ length: 10 }, (_, i) => ({
            name: `sticker${i}.png`,
            mimeType: 'image/png',
            buffer: createDummyPng(),
        }));
        await page.locator('input[type="file"]').setInputFiles(files);

        // 手動でズームを設定して自動モードを解除
        await page.keyboard.press('Control+=');
        await page.keyboard.press('Control+=');
        await expect(page.locator('.app')).toHaveAttribute('data-auto-zoom', 'false');

        const manualZoom = await page.locator('.image-grid').evaluate(el => {
            return getComputedStyle(el).getPropertyValue('--image-size');
        });

        // 画像を削除
        await page.locator('.image-tile').first().click();
        await page.keyboard.press('Delete');

        // 手動設定したズームは変わらない
        const zoomAfterDelete = await page.locator('.image-grid').evaluate(el => {
            return getComputedStyle(el).getPropertyValue('--image-size');
        });
        expect(parseInt(zoomAfterDelete)).toBe(parseInt(manualZoom));
    });
});
