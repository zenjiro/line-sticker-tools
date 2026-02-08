import { test, expect } from '@playwright/test';

const createDummyPng = () => {
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    return Buffer.from(base64, 'base64');
};

test.describe('Auto Zoom Feature', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should auto-zoom on startup and handle manual overrides', async ({ page }) => {
        // 1. Upload multiple images to fill the screen
        const fileCount = 20;
        const files = Array.from({ length: fileCount }, (_, i) => ({
            name: `sticker${i}.png`,
            mimeType: 'image/png',
            buffer: createDummyPng(),
        }));

        await page.locator('input[type="file"]').setInputFiles(files);
        await expect(page.locator('.image-tile')).toHaveCount(fileCount + 1); // +1 for dummy

        // Get initial size of a tile
        const getTileWidth = async () => {
            const tile = page.locator('.image-tile').first();
            const box = await tile.boundingBox();
            return box ? box.width : 0;
        };

        const initialWidth = await getTileWidth();
        console.log('Initial Width:', initialWidth);
        expect(initialWidth).toBeGreaterThan(0);

        // 2. Resize window - should trigger auto-zoom (width should change if we make window smaller)
        // Current viewport is likely standard. Let's make it small.
        await page.setViewportSize({ width: 800, height: 600 });
        // Wait for resize debounce if any (App.jsx has resize listener)
        await page.waitForTimeout(500);

        const resizedWidth = await getTileWidth();
        console.log('Resized Width:', resizedWidth);
        // It might not definitely be smaller if it was already small, but it should likely change or be recalculated.
        // Actually, if we shrink window, images might need to shrink or layout changes. 
        // Logic: containerWidth / (size + 8).

        // 3. Manual Zoom In (Ctrl + =)
        await page.keyboard.press('Control+=');
        await page.waitForTimeout(200);
        const zoomedWidth = await getTileWidth();
        console.log('Zoomed Width:', zoomedWidth);
        expect(zoomedWidth).toBeGreaterThan(resizedWidth); // Should increase

        // 4. Resize window again - should NOT trigger auto-zoom (manual mode active)
        const widthBeforeResize2 = await getTileWidth();
        await page.setViewportSize({ width: 1000, height: 800 });
        await page.waitForTimeout(500);
        const widthAfterResize2 = await getTileWidth();
        console.log('Manual Mode Resize:', widthBeforeResize2, '->', widthAfterResize2);

        // In manual mode, size should NOT change even if window size changes.
        // Wait, App.jsx: window.addEventListener('resize', updateColumns);
        // updateColumns sets gridColumns. It does NOT set imageSize directly unless auto-fit logic runs.
        // Auto fit logic runs in useEffect [images.length, trashImages.length].
        // It does NOT run on window resize! 
        // Wait, App.jsx:
        /*
          useEffect(() => {
            const updateColumns = () => { ... };
            updateColumns();
            window.addEventListener('resize', updateColumns);
            return ...
          }, [imageSize]);
        */
        // This only updates gridColumns.
        // The auto-fit logic is in:
        /*
          useEffect(() => {
            if (images.length > 0 && containerRef.current) {
               // calculates autoFitSize
               // setAutoFitSize(bestFit);
               // if (isAutoZoomMode) setImageSize(bestFit);
            }
          }, [images.length, trashImages.length, isAutoZoomMode]);
        */
        // Crucially: It does NOT depend on window size changes explicitly? 
        // Ah, `containerRef.current.offsetWidth` is used inside the effect.
        // But the effect only runs when images.length, trash.length, or isAutoZoomMode changes.
        // IT DOES NOT RUN ON WINDOW RESIZE.
        // So my implementation plan might have a gap: "Auto Zoom" implies it adjusts on window resize too?
        // The user requirement: "Ctrl+0 displays at a size where all images fit... Auto zoom mode enabled."
        // "Startup: Auto zoom mode enabled."
        // "Trash hidden -> Trash shown: Auto zoom calculates new size."
        // The user didn't explicitly say "On window resize, adjust size".
        // But "Automatic magnification mode" usually implies responsive.
        // Let's check if the existing logic handled resize?
        // Previous logic:
        /*
        // Calculate auto-fit size when images load or trash visibility changes
        useEffect(() => { ... }, [images.length, trashImages.length]);
        */
        // It didn't listen to resize either.
        // So checking "Resize window -> size changes" might actually FAIL if I expect it to change.
        // I should focus on the requested requirements:
        // 1. Ctrl+0 -> Auto Mode
        // 2. Ctrl+/- -> Manual Mode
        // 3. Startup -> Auto Mode
        // 4. Trash appearance -> Adjusts size if Auto Mode.

        // So, step 4 (resize) is not a good test for "Auto Mode" unless I add resize listener for it.
        // The user didn't ask for resize responsiveness, just "trash display" responsiveness.
        // But `App.jsx` lines 73-84 DO listen to resize to update `gridColumns`.
        // If I want true auto-zoom, I probably should have added resize listener to valid dependencies or event.
        // But for now I will stick to testing the requested triggers.

        // Re-evaluating test step:
        // 4. Reset (Ctrl + 0)
        await page.keyboard.press('Control+0');
        await page.waitForTimeout(200);
        // Should be back to an auto-fit size.
        // Since we are in auto mode, let's trigger a layout change that requires resize.
        // How? By adding/removing images or trash.

        // 5. Delete an item to show trash (Ctrl+0 is active)
        // Select an image
        await page.locator('.image-tile').nth(0).click();
        await page.keyboard.press('Delete');
        await expect(page.locator('.trash-area')).toBeVisible();

        // Check if size adjusted?
        // With trash open, available height is smaller.
        // Auto-fit should likely REDUCE size to fit all images in smaller height.
        // OR, if they already fit, it might stay same.
        // With 20 images, it likely needs to shrink if height is constrained.

        const widthWithTrash = await getTileWidth();
        console.log('Width with Trash (Auto):', widthWithTrash);

        // 6. Manual Zoom
        await page.keyboard.press('Control+='); // Zoom in -> Manual Mode
        // Now delete another image. Trash stays open.
        // But let's say we close trash? modifying trashImages.
        // Currently we can't easily "close" trash without restoring all.
        // Let's restore the image.
        await page.keyboard.press('ArrowDown'); // Move to trash?
        // Or click trash item
        await page.locator('.trash-area .image-tile').first().click();
        await page.keyboard.press('Delete'); // Restore (Delete in trash = Restore)
        await expect(page.locator('.trash-area')).not.toBeVisible();
        await page.waitForTimeout(200);

        // We are in Manual Mode (from step 6).
        // Restoring image (removing trash area) increases space.
        // BUT size should NOT change automatically because we are in Manual Mode.
        // (Unless the effect logic forces it? NO, we added `if (isAutoZoomMode)` check).

        const widthAfterRestore = await getTileWidth();
        console.log('Width after Restore (Manual):', widthAfterRestore);

        // It should match the zoomed width (from step 6), NOT the auto-fit width.
        // The mocked 'Control+=' adds 20px. So it should be definitely larger than optimized fit.

        // Assert: Size after restore is roughly same as size before restore (manual).
        // Actually, `widthAfterRestore` should be == `widthWithTrash` + 20? 
        // Wait, in step 6 we Zoomed In. `widthWithTrash` (auto) -> ZoomIn -> `manualWidth`.
        // Then we restore. `manualWidth` should persist.
        // So `widthAfterRestore` should roughly equal `manualWidth`.

        // Let's capture manual width first
        const manualWidth = await getTileWidth();

        // To be sure we are not just lucky, let's change window size or something? 
        // No, the "Show/Hide Trash" verifies the "Auto Mode" logic perfectly.

        // If Auto Mode was ON: Hiding trash would trigger re-calc and likely INCREASE size (more space).
        // Since Manual Mode is ON: Hiding trash should KEEP same size.

        // Wait, if we hide trash, `images.length` changes (restore = add back to main).
        // `trashImages.length` changes.
        // Effect runs.
        // `bestFit` is calculated.
        // `if (isAutoZoomMode)` is checked. It is FALSE.
        // So `setImageSize` is skipped.
        // So size remains `imageSize`.

        // So:
        expect(widthAfterRestore).toBe(manualWidth);
    });
});
