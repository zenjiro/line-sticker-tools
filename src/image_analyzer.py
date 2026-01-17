"""Image analysis utilities for LINE sticker processing.

This module provides functions for analyzing images to support background removal
and other image processing tasks. It includes utilities for color detection,
hole counting, and basic image property extraction.

Example:
    Basic usage for analyzing an image:
    
    >>> from image_analyzer import get_average_border_color, count_holes
    >>> border_color = get_average_border_color("image.png")
    >>> holes = count_holes("processed_image.png")
"""

import statistics
import numpy as np
from PIL import Image
from scipy import ndimage
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)


def get_average_border_color(image_path: str, border_width: int = 10) -> Optional[Tuple[int, int, int]]:
    """Calculate the average color of the outer border of an image.
    
    This function samples pixels from the outer border of an image to determine
    the predominant background color. This is useful for automatic background
    color detection in images that need background removal.
    
    Args:
        image_path: Path to the image file to analyze
        border_width: Width of border region to sample in pixels (default: 10)
        
    Returns:
        RGB tuple (r, g, b) of average border color with values 0-255,
        or None if the image cannot be processed
        
    Raises:
        No exceptions are raised; errors are logged and None is returned
        
    Example:
        >>> color = get_average_border_color("image.png", border_width=15)
        >>> if color:
        ...     print(f"Border color: RGB{color}")
        Border color: RGB(255, 255, 255)
    """
    try:
        with Image.open(image_path) as img:
            img = img.convert("RGB")
            width, height = img.size
            
            pixels = []
            
            # Sample top and bottom borders
            for x in range(width):
                for y in range(border_width):
                    pixels.append(img.getpixel((x, y)))
                for y in range(height - border_width, height):
                    pixels.append(img.getpixel((x, y)))
                    
            # Sample left and right borders (excluding corners already covered)
            for y in range(border_width, height - border_width):
                for x in range(border_width):
                    pixels.append(img.getpixel((x, y)))
                for x in range(width - border_width, width):
                    pixels.append(img.getpixel((x, y)))
            
            if not pixels:
                logger.warning(f"No border pixels found for {image_path}")
                return None

            avg_r = statistics.mean(p[0] for p in pixels)
            avg_g = statistics.mean(p[1] for p in pixels)
            avg_b = statistics.mean(p[2] for p in pixels)
            
            return (int(avg_r), int(avg_g), int(avg_b))
            
    except Exception as e:
        logger.error(f"Error analyzing image border for {image_path}: {e}")
        return None


def count_holes(image_path: str) -> int:
    """Count the number of separate transparent regions (holes) in an image.
    
    This function analyzes the alpha channel of an image to identify and count
    distinct transparent regions. This is useful for detecting over-processing
    in background removal operations where too aggressive settings create
    unwanted holes in the subject.
    
    Args:
        image_path: Path to the image file to analyze
        
    Returns:
        Number of separate transparent regions found (0 or positive integer)
        
    Note:
        Images without alpha channels are converted to RGBA format.
        Connected transparent pixels are counted as a single hole.
        
    Example:
        >>> holes = count_holes("processed_image.png")
        >>> print(f"Found {holes} transparent regions")
        Found 3 transparent regions
    """
    try:
        with Image.open(image_path) as img:
            img_rgba = img.convert("RGBA")
            alpha = np.array(img_rgba.split()[-1])
            
            # Create binary mask: 1 = transparent, 0 = opaque
            transparent_mask = (alpha == 0).astype(int)
            
            # Label connected components of transparent regions
            labeled, num_holes = ndimage.label(transparent_mask)
            
            return num_holes
            
    except Exception as e:
        logger.error(f"Error counting holes in {image_path}: {e}")
        return 0


def get_image_dimensions(image_path: str) -> Optional[Tuple[int, int]]:
    """Get image dimensions safely with error handling.
    
    Args:
        image_path: Path to the image file
        
    Returns:
        (width, height) tuple in pixels, or None if the image cannot be read
        
    Example:
        >>> dimensions = get_image_dimensions("image.png")
        >>> if dimensions:
        ...     width, height = dimensions
        ...     print(f"Image size: {width}x{height}")
        Image size: 800x600
    """
    try:
        with Image.open(image_path) as img:
            return img.size
    except Exception as e:
        logger.error(f"Error getting dimensions for {image_path}: {e}")
        return None


def count_opaque_pixels(image_path: str) -> int:
    """Count opaque (non-transparent) pixels in an image.
    
    This function counts pixels with alpha values greater than 0, which
    represents the amount of visible content in the image. This is useful
    for comparing different processing results to select the best one.
    
    Args:
        image_path: Path to the image file to analyze
        
    Returns:
        Number of opaque pixels (0 or positive integer)
        
    Note:
        Images without alpha channels are treated as fully opaque.
        
    Example:
        >>> opaque_count = count_opaque_pixels("image.png")
        >>> total_pixels = 800 * 600  # width * height
        >>> transparency_ratio = 1 - (opaque_count / total_pixels)
        >>> print(f"Image is {transparency_ratio:.1%} transparent")
        Image is 25.3% transparent
    """
    try:
        with Image.open(image_path) as img:
            img_rgba = img.convert("RGBA")
            alpha_array = np.array(img_rgba.split()[-1])
            return int(np.sum(alpha_array > 0))
    except Exception as e:
        logger.error(f"Error counting opaque pixels in {image_path}: {e}")
        return 0
