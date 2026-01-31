import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
    test('Home Page should load', async ({ page }) => {
        await page.goto('./');
        await expect(page).toHaveTitle('LINE Sticker Tools');
        await expect(page.locator('h1').first()).toHaveText('LINE Sticker Tools');
        await expect(page.locator('.card-grid')).toBeVisible();
    });

    test('Remove BG GUI should load', async ({ page }) => {
        await page.goto('remove-bg/');
        await expect(page).toHaveTitle('Remove Background GUI');
        await expect(page.locator('h1').first()).toHaveText('Remove Background GUI');
        await expect(page.getByText('Add Images').first()).toBeVisible();
    });

    test('Divide & Crop GUI should load', async ({ page }) => {
        await page.goto('divide-crop/');
        await expect(page).toHaveTitle('Divide & Crop GUI');
        await expect(page.locator('h1').first()).toHaveText('Divide & Crop GUI');
        await expect(page.getByText('Add Images').first()).toBeVisible();
    });

    test('Arrange GUI should load', async ({ page }) => {
        await page.goto('arrange/');
        await expect(page).toHaveTitle('Arrange GUI');
        await expect(page.locator('h1').first()).toHaveText('LINE Sticker Arranger');
        await expect(page.getByText('Add Images').first()).toBeVisible();
    });
});
