import { test, expect } from '@playwright/test';

// Create a dummy transparent PNG for testing
const createDummyPng = () => {
    // 1x1 transparent PNG base64
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    return Buffer.from(base64, 'base64');
};

test.describe('Divide Crop GUI', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should load the application correctly', async ({ page }) => {
        await expect(page.locator('h1')).toBeVisible(); // Title might vary by init language
        await expect(page.getByRole('button', { name: /Add Images|画像を追加/ })).toBeVisible();
    });

    test('should upload images and display them in grid', async ({ page }) => {
        const file1 = {
            name: 'test1.png',
            mimeType: 'image/png',
            buffer: createDummyPng(),
        };

        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles([file1]);

        await expect(page.locator('.image-card')).toHaveCount(1);
        await expect(page.getByText('test1.png')).toBeVisible();
    });

    test('should handle keyboard interaction for divisions', async ({ page }) => {
        const file1 = {
            name: 'test1.png',
            mimeType: 'image/png',
            buffer: createDummyPng(),
        };
        await page.locator('input[type="file"]').setInputFiles([file1]);

        // Initial state check (assuming default is 3x3 or similar, check text presence)
        // The text format in ImageCard is: t('divisions', { cols: image.cols, rows: image.rows })
        // "Split: {cols}W x {rows}H" (EN) or "分割数: 横{cols} x 縦{rows}" (JA)

        await expect(page.locator('.image-card').first()).toHaveClass(/focused/);

        // Increase Horizontal (L key)
        await page.keyboard.press('l');
        // Check if text updated to 4 cols. Default is 3.
        // We'll search for "4" in the card info text.
        await expect(page.locator('.card-info')).toContainText(/4.*3|4.*3/); // 4W x 3H roughly

        // Increase Vertical (J key)
        await page.keyboard.press('j');
        await expect(page.locator('.card-info')).toContainText(/4.*4|4.*4/); // 4W x 4H

        // Decrease Horizontal (H key)
        await page.keyboard.press('h');
        await expect(page.locator('.card-info')).toContainText(/3.*4|3.*4/); // 3W x 4H
    });

    test('should toggle theme', async ({ page }) => {
        const themeBtn = page.locator('.header-controls button').last(); // Assuming last button is theme
        await themeBtn.click();
        // Check html data-theme attribute
        const html = page.locator('html');
        const theme1 = await html.getAttribute('data-theme');

        await themeBtn.click();
        const theme2 = await html.getAttribute('data-theme');

        expect(theme1).not.toBe(theme2);
    });
});
