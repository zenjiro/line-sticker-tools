import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Split an image into a grid of smaller images
 * @param {string} dataUrl - Image data URL
 * @param {string} filename - Original filename
 * @param {number} cols - Number of columns
 * @param {number} rows - Number of rows
 * @param {JSZip} zip - Zip instance to add files to
 */
async function splitAndAddToZip(dataUrl, filename, cols, rows, zip) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const cellW = img.width / cols;
            const cellH = img.height / rows;

            const baseName = filename.replace(/\.[^/.]+$/, ""); // remove extension

            let processingCount = 0;
            const totalCells = cols * rows;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    // Set canvas size to cell size (floored to avoid gaps/anti-aliasing issues? actually better to ceil for safety or exact float)
                    // ImageMagick might handle pixels differently. Here we use exact float coords for drawImage, but canvas size must be int.
                    // We'll use floor for canvas size, which might trim the last pixel row/col if division isn't exact.
                    // Alternatively, use ceil.
                    // Let's us round.
                    const w = Math.floor(cellW);
                    const h = Math.floor(cellH);

                    canvas.width = w;
                    canvas.height = h;
                    ctx.clearRect(0, 0, w, h);

                    // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
                    ctx.drawImage(img,
                        c * cellW, r * cellH, cellW, cellH,
                        0, 0, w, h
                    );

                    const index = r * cols + c;
                    const cellFilename = `${baseName}-${index}.png`;

                    canvas.toBlob((blob) => {
                        if (blob) {
                            zip.file(cellFilename, blob);
                        }
                        processingCount++;
                        if (processingCount === totalCells) {
                            resolve();
                        }
                    }, 'image/png');
                }
            }
        };
        img.onerror = () => reject(new Error(`Failed to load image: ${filename}`));
        img.src = dataUrl;
    });
}

/**
 * Export processed images as ZIP
 * @param {Array} images - Array of image objects { data, name, cols, rows }
 */
export async function exportZip(images) {
    const zip = new JSZip();

    for (const image of images) {
        await splitAndAddToZip(image.data, image.name, image.cols, image.rows, zip);
    }

    // Generate and download ZIP
    const content = await zip.generateAsync({ type: 'blob' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    saveAs(content, `divide-crop-${timestamp}.zip`);
}
