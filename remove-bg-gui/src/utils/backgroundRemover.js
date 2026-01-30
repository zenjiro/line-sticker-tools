/**
 * Background removal utilities for web-based image processing.
 * Implements color detection and transparency removal similar to ImageMagick.
 */

/**
 * Get the average color of the outer border of an image.
 * @param {ImageData} imageData - Canvas ImageData object
 * @param {number} borderWidth - Width of border to sample (default: 10)
 * @returns {{r: number, g: number, b: number}} Average RGB color
 */
export function getAverageBorderColor(imageData, borderWidth = 10) {
    const { data, width, height } = imageData;
    let r = 0, g = 0, b = 0, count = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Check if pixel is in border region
            const isInBorder =
                y < borderWidth ||
                y >= height - borderWidth ||
                x < borderWidth ||
                x >= width - borderWidth;

            if (isInBorder) {
                const idx = (y * width + x) * 4;
                r += data[idx];
                g += data[idx + 1];
                b += data[idx + 2];
                count++;
            }
        }
    }

    if (count === 0) {
        return { r: 255, g: 255, b: 255 };
    }

    return {
        r: Math.round(r / count),
        g: Math.round(g / count),
        b: Math.round(b / count),
    };
}

/**
 * Calculate color distance between two colors.
 * @param {{r: number, g: number, b: number}} c1 - First color
 * @param {{r: number, g: number, b: number}} c2 - Second color
 * @returns {number} Euclidean distance (0-441.67 for RGB)
 */
export function colorDistance(c1, c2) {
    const dr = c1.r - c2.r;
    const dg = c1.g - c2.g;
    const db = c1.b - c2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Convert fuzz percentage to color distance threshold.
 * Fuzz 0% = exact match only (threshold 0)
 * Fuzz 100% = any color matches (threshold ~442)
 * @param {number} fuzz - Fuzz percentage (0-100)
 * @returns {number} Color distance threshold
 */
export function fuzzToThreshold(fuzz) {
    // Max RGB distance is sqrt(255^2 * 3) ≈ 441.67
    const maxDistance = Math.sqrt(255 * 255 * 3);
    return (fuzz / 100) * maxDistance;
}

/**
 * Remove background from image by making all matching-color pixels transparent.
 * Similar to ImageMagick's -transparent flag behavior.
 * @param {ImageData} imageData - Canvas ImageData object (will be modified)
 * @param {{r: number, g: number, b: number}} bgColor - Background color to remove
 * @param {number} fuzz - Fuzz tolerance percentage (0-100)
 * @returns {ImageData} Modified ImageData with transparent background
 */
export function removeBackground(imageData, bgColor, fuzz) {
    const { data, width, height } = imageData;
    const threshold = fuzzToThreshold(fuzz);

    // Iterate over all pixels and make matching colors transparent
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pixelIdx = (y * width + x) * 4;
            const pixelColor = {
                r: data[pixelIdx],
                g: data[pixelIdx + 1],
                b: data[pixelIdx + 2],
            };

            const distance = colorDistance(pixelColor, bgColor);

            if (distance <= threshold) {
                // Make pixel transparent
                data[pixelIdx + 3] = 0;
            }
        }
    }

    return imageData;
}

/**
 * Process an image and return the result as a data URL.
 * @param {string} imageSrc - Source image data URL
 * @param {number} fuzz - Fuzz tolerance percentage
 * @returns {Promise<{dataUrl: string, bgColor: {r: number, g: number, b: number}}>}
 */
export async function processImage(imageSrc, fuzz) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const bgColor = getAverageBorderColor(imageData);
                removeBackground(imageData, bgColor, fuzz);
                ctx.putImageData(imageData, 0, 0);

                resolve({
                    dataUrl: canvas.toDataURL('image/png'),
                    bgColor,
                });
            } catch (err) {
                reject(err);
            }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageSrc;
    });
}

/**
 * Calculate automatic fuzz value based on image analysis.
 * This tries to mimic the Python version's behavior of finding optimal fuzz.
 * @param {string} imageSrc - Source image data URL
 * @returns {Promise<number>} Recommended fuzz value (default 25)
 */
export async function calculateAutoFuzz() {
    // Default to 25% which is a reasonable starting point
    // In the Python version, it tests multiple values and picks the best one
    // For simplicity, we start with 25 and let user adjust
    return 25;
}
