#!/usr/bin/env python3

import tempfile
import os
from pathlib import Path
from PIL import Image
import image_utils
import background_utils


def create_test_image(width=100, height=100, color=(255, 255, 255)):
    """Create a simple test image."""
    img = Image.new('RGB', (width, height), color)
    temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
    img.save(temp_file.name)
    temp_file.close()
    return temp_file.name


def test_get_border_color():
    """Test border color detection."""
    test_file = create_test_image(color=(255, 0, 0))  # Red image
    try:
        color = image_utils.get_border_color(test_file)
        assert color is not None
        assert color[0] > 200  # Should detect red
    finally:
        os.unlink(test_file)


def test_count_holes():
    """Test hole counting."""
    # Create RGBA image with transparency
    img = Image.new('RGBA', (100, 100), (255, 255, 255, 255))
    # Make center transparent
    for x in range(40, 60):
        for y in range(40, 60):
            img.putpixel((x, y), (0, 0, 0, 0))
    
    temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
    img.save(temp_file.name)
    temp_file.close()
    
    try:
        holes = image_utils.count_holes(temp_file.name)
        assert holes >= 1  # Should find at least one hole
    finally:
        os.unlink(temp_file.name)


def test_remove_background():
    """Test background removal."""
    test_file = create_test_image()
    try:
        success = background_utils.remove_background(Path(test_file), (255, 255, 255))
        # Should return True or False, not crash
        assert isinstance(success, bool)
    finally:
        os.unlink(test_file)
        # Clean up output file if created
        output_file = test_file.replace('.png', '-nobg.png')
        if os.path.exists(output_file):
            os.unlink(output_file)


def test_invalid_file():
    """Test handling of invalid files."""
    color = image_utils.get_border_color("nonexistent.png")
    assert color is None
    
    holes = image_utils.count_holes("nonexistent.png")
    assert holes == 0


def test_main_script():
    """Test main script functionality."""
    import remove_bg
    
    # Test with no arguments
    result = remove_bg.main.__code__.co_varnames
    assert 'image_files' in result  # Basic structure check


if __name__ == "__main__":
    test_get_border_color()
    test_count_holes()
    test_remove_background()
    test_invalid_file()
    test_main_script()
    print("All tests passed!")
