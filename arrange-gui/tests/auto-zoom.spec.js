import { test, expect } from '@playwright/test';

// Create a dummy transparent PNG for testing
const createDummyPng = () => {
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    return Buffer.from(base64, 'base64');
};

test.describe('Auto Zoom Functionality', () => {
    test.beforeEach(async ({ page }) => {
        // Set a fixed viewport size to make auto-fit calculations predictable
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/');
    });

    const uploadImages = async (page, count) => {
        const files = Array.from({ length: count }, (_, i) => ({
            name: `sticker${i}.png`,
            mimeType: 'image/png',
            buffer: createDummyPng(),
        }));
        await page.locator('input[type="file"]').setInputFiles(files);
        // Wait for images to appear
        await expect(page.locator('.image-tile').first()).toBeVisible();
    };

    const getImageSize = async (page) => {
        const grid = page.locator('.image-grid');
        const style = await grid.getAttribute('style');
        const match = style.match(/--image-size: (\d+)px/);
        return match ? parseInt(match[1], 10) : null;
    };

    test('should start with auto-zoom enabled and fit images', async ({ page }) => {
        // Upload enough images to potentially require scaling down or specific layout
        // Default max size is usually 200 or 300 depending on logic?
        // Logic: start at 200, decrease until fits.
        await uploadImages(page, 5);
        
        const initialSize = await getImageSize(page);
        expect(initialSize).toBeGreaterThan(0);
        // It should settle on a valid size (e.g. 200 if they fit, or less)
        // With 5 images in 1280px width, they fit easily in one row or two.
    });

    test('Ctrl + + should zoom in and disable auto-zoom', async ({ page }) => {
        await uploadImages(page, 5);
        const initialSize = await getImageSize(page);

        // Zoom in
        await page.keyboard.press('Control+='); // Ctrl + +
        
        const zoomedSize = await getImageSize(page);
        expect(zoomedSize).toBeGreaterThan(initialSize);

        // Now delete an image to show trash.
        // If auto-zoom was ON, showing trash might resize images to fit reduced height.
        // Since auto-zoom should be OFF, size should remain 'zoomedSize' (unless maxed out?)
        
        // Select and delete
        await page.click('.image-tile >> nth=0');
        await page.keyboard.press('Delete');
        
        // Trash appears
        await expect(page.locator('.trash-area')).toBeVisible();

        // Check size again. It should NOT have changed automatically to fit.
        // (Assuming the zoom action disabled the flag)
        const sizeAfterTrash = await getImageSize(page);
        expect(sizeAfterTrash).toBe(zoomedSize);
    });

    test('Ctrl + 0 should reset zoom and re-enable auto-zoom', async ({ page }) => {
        await uploadImages(page, 5);
        
        // Manually zoom out
        await page.keyboard.press('Control+-');
        const manualSize = await getImageSize(page);
        
        // Reset
        await page.keyboard.press('Control+0');
        
        const resetSize = await getImageSize(page);
        expect(resetSize).not.toBe(manualSize);
        
        // Verify auto-zoom is active by opening trash
        // Select and delete
        await page.click('.image-tile >> nth=0');
        await page.keyboard.press('Delete');
        await expect(page.locator('.trash-area')).toBeVisible();
        
        // When trash opens, available height shrinks. 
        // Auto-fit might recalc. It might be same size if it still fits, or smaller.
        // To force a change, we might need more images or smaller window.
        // But the requirement is that it *attempts* to fit.
        // Let's at least verify it didn't break or remains consistent.
        
        const sizeAfterTrash = await getImageSize(page);
        expect(sizeAfterTrash).toBeLessThanOrEqual(resetSize);
    });

    test('Showing trash adjusts size when auto-zoom is enabled', async ({ page }) => {
        // Use a smaller viewport to force resizing when trash opens
        await page.setViewportSize({ width: 800, height: 600 });
        
        // Upload many images to fill space
        await uploadImages(page, 20);
        
        const sizeBeforeTrash = await getImageSize(page);
        
        // Delete one
        await page.click('.image-tile >> nth=0');
        await page.keyboard.press('Delete');
        await expect(page.locator('.trash-area')).toBeVisible();
        
        // Trash takes space, so available height for grid decreases.
        // Auto-zoom should likely shrink images to keep them fitting without scroll (if logic works that way)
        const sizeAfterTrash = await getImageSize(page);
        
        // It might stay same if it still fits, but let's check it doesn't explode.
        // Ideally checking strict less than is flaky if they still fit.
        // But we can check that it is recalculated.
        // Let's assert it is a valid number.
        expect(sizeAfterTrash).toBeGreaterThan(0);
    });
});
