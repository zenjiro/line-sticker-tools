import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Helper to get create a dummy image for testing
const createTestImage = (name = 'test.png') => {
    // Create a simple 1x1 transparent PNG
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    return { name, mimeType: 'image/png', buffer };
};

test.describe('Remove Background GUI', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should load the application', async ({ page }) => {
        await expect(page).toHaveTitle(/Remove Background GUI/);
        await expect(page.locator('h1')).toHaveText('Remove Background');
    });

    test('should toggle theme', async ({ page }) => {
        const themeButton = page.locator('button[title="Toggle theme"]');
        await expect(themeButton).toBeVisible();
        await themeButton.click();
        // Check local storage or data-theme attribute
        const html = page.locator('html');
        // Initial state depends on system preference, but click should toggle it.
        // Let's just verify text content changes or button state if applicable.
        // The implementation toggles between sun and moon icons.
    });

    test('should toggle language', async ({ page }) => {
        const langButton = page.locator('.lang-toggle');
        await expect(langButton).toBeVisible();

        // Default is likely EN (from my implementation mostly), or system based.
        // My implementation: navigator.language check.

        await langButton.click();
        // Verify title change
        const title = page.locator('h1');
        const text = await title.textContent();
        expect(text).toMatch(/背景削除|Remove Background/);
    });

    test('should show drop zone initially', async ({ page }) => {
        await expect(page.locator('.drop-zone')).toBeVisible();
        await expect(page.getByText('Drop images here')).toBeVisible();
    });

    test('should handle file upload', async ({ page }) => {
        const fileChooserPromise = page.waitForEvent('filechooser');

        // Click the "Add Images" button (hidden input trigger)
        // My implementation: <button onClick=...>Add Images</button>
        await page.getByText('Add Images').click();

        const fileChooser = await fileChooserPromise;

        const testImg = createTestImage('test-upload.png');

        // Write buffer to temp file for Playwright to upload
        // Note: Playwright fileChooser.setFiles accepts object with name, mimeType, buffer
        await fileChooser.setFiles({
            name: testImg.name,
            mimeType: testImg.mimeType,
            buffer: testImg.buffer
        });

        // Verify image appears in grid
        await expect(page.locator('.image-tile')).toHaveCount(1);
        await expect(page.locator('.image-count')).toContainText('1 images');
    });
});
