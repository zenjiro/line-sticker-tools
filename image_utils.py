#!/usr/bin/env python3

import statistics
import numpy as np
from PIL import Image
from scipy import ndimage


def get_border_color(image_path):
    """Get average color of image border."""
    try:
        with Image.open(image_path) as img:
            img = img.convert("RGB")
            width, height = img.size
            border_width = 10
            
            pixels = []
            
            # Sample borders
            for x in range(width):
                for y in range(border_width):
                    pixels.append(img.getpixel((x, y)))
                for y in range(height - border_width, height):
                    pixels.append(img.getpixel((x, y)))
                    
            for y in range(border_width, height - border_width):
                for x in range(border_width):
                    pixels.append(img.getpixel((x, y)))
                for x in range(width - border_width, width):
                    pixels.append(img.getpixel((x, y)))
            
            if not pixels:
                return None

            avg_r = statistics.mean(p[0] for p in pixels)
            avg_g = statistics.mean(p[1] for p in pixels)
            avg_b = statistics.mean(p[2] for p in pixels)
            
            return (int(avg_r), int(avg_g), int(avg_b))
            
    except Exception:
        return None


def count_holes(image_path):
    """Count transparent regions in image."""
    try:
        with Image.open(image_path) as img:
            img_rgba = img.convert("RGBA")
            alpha = np.array(img_rgba.split()[-1])
            
            transparent_mask = (alpha == 0).astype(int)
            labeled, num_holes = ndimage.label(transparent_mask)
            
            return num_holes
            
    except Exception:
        return 0
