import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Resize an image to specified dimensions using canvas
 * @param {string} dataUrl - Image data URL
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @param {boolean} centerCrop - If true, center-crop to fill dimensions
 * @returns {Promise<Blob>} - Resized image as PNG blob
 */
async function resizeImage(dataUrl, width, height, centerCrop = false) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (centerCrop) {
                // Center crop to fill the target dimensions
                const imgAspect = img.width / img.height;
                const targetAspect = width / height;

                let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;

                if (imgAspect > targetAspect) {
                    // Image is wider - crop sides
                    srcW = img.height * targetAspect;
                    srcX = (img.width - srcW) / 2;
                } else {
                    // Image is taller - crop top/bottom
                    srcH = img.width / targetAspect;
                    srcY = (img.height - srcH) / 2;
                }

                ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, width, height);
            } else {
                // Scale to fit within dimensions, maintaining aspect ratio
                const scale = Math.min(width / img.width, height / img.height);
                const scaledW = img.width * scale;
                const scaledH = img.height * scale;
                const offsetX = (width - scaledW) / 2;
                const offsetY = (height - scaledH) / 2;

                // Clear with transparent background
                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
            }

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to create blob'));
                }
            }, 'image/png');
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
    });
}

/**
 * Export images as LINE sticker package ZIP
 * @param {Array} images - Array of image objects with data property
 * @param {Object} mainImage - Main image object
 * @param {Object} tabImage - Tab image object
 */
export async function exportZip(images, mainImage, tabImage) {
    const zip = new JSZip();

    // Process sticker images (370x320px)
    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const blob = await resizeImage(image.data, 370, 320, false);
        const fileName = String(i + 1).padStart(2, '0') + '.png';
        zip.file(fileName, blob);
    }

    // Process main image (240x240px, fit)
    const mainBlob = await resizeImage(mainImage.data, 240, 240, false);
    zip.file('main.png', mainBlob);

    // Process tab image (96x74px, fit)
    const tabBlob = await resizeImage(tabImage.data, 96, 74, false);
    zip.file('tab.png', tabBlob);

    // Generate and download ZIP
    const content = await zip.generateAsync({ type: 'blob' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    saveAs(content, `sticker-package-${timestamp}.zip`);
}
