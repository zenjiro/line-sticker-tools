"""Test fixtures and utilities for LINE sticker tools tests."""

import tempfile
from pathlib import Path
from PIL import Image
import numpy as np


def create_test_image(width: int = 100, height: int = 100, 
                     bg_color: tuple = (255, 255, 255),
                     has_transparency: bool = False) -> Path:
    """Create a test image with specified properties.
    
    Args:
        width: Image width in pixels
        height: Image height in pixels  
        bg_color: Background color RGB tuple
        has_transparency: Whether to add transparent regions
        
    Returns:
        Path to the created test image
    """
    # Create temporary file
    temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
    temp_path = Path(temp_file.name)
    temp_file.close()
    
    # Create image
    if has_transparency:
        img = Image.new('RGBA', (width, height), (*bg_color, 255))
        # Add some transparent holes
        pixels = np.array(img)
        pixels[20:30, 20:30] = (0, 0, 0, 0)  # Transparent square
        pixels[70:80, 70:80] = (0, 0, 0, 0)  # Another transparent square
        img = Image.fromarray(pixels)
    else:
        img = Image.new('RGB', (width, height), bg_color)
    
    # Add some content (colored rectangle)
    pixels = np.array(img.convert('RGBA'))
    pixels[40:60, 40:60] = (255, 0, 0, 255)  # Red square
    img = Image.fromarray(pixels)
    
    img.save(temp_path)
    return temp_path


def create_border_test_image(width: int = 100, height: int = 100,
                           border_color: tuple = (255, 255, 255),
                           center_color: tuple = (255, 0, 0)) -> Path:
    """Create test image with specific border color.
    
    Args:
        width: Image width
        height: Image height
        border_color: Color of the border
        center_color: Color of the center content
        
    Returns:
        Path to created test image
    """
    temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
    temp_path = Path(temp_file.name)
    temp_file.close()
    
    img = Image.new('RGB', (width, height), border_color)
    pixels = np.array(img)
    
    # Add center content
    center_start_x = width // 4
    center_end_x = 3 * width // 4
    center_start_y = height // 4  
    center_end_y = 3 * height // 4
    
    pixels[center_start_y:center_end_y, center_start_x:center_end_x] = center_color
    
    img = Image.fromarray(pixels)
    img.save(temp_path)
    return temp_path
