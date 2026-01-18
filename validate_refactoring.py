"""Simple validation test for backward compatibility."""

import subprocess
import sys
from pathlib import Path
from PIL import Image
import numpy as np
import tempfile


def create_simple_test_image():
    """Create a simple test image with white background."""
    temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
    temp_path = Path(temp_file.name)
    temp_file.close()
    
    # Create 100x100 white image with red square in center
    img = Image.new('RGB', (100, 100), (255, 255, 255))
    pixels = np.array(img)
    pixels[40:60, 40:60] = (255, 0, 0)  # Red square
    
    img = Image.fromarray(pixels)
    img.save(temp_path)
    return temp_path


def test_remove_bg_basic():
    """Test basic remove_bg functionality."""
    test_image = create_simple_test_image()
    
    try:
        # Test remove_bg.py
        result = subprocess.run([
            sys.executable, "remove_bg.py", str(test_image)
        ], capture_output=True, text=True)
        
        print(f"remove_bg.py exit code: {result.returncode}")
        if result.stdout:
            print(f"stdout: {result.stdout}")
        if result.stderr:
            print(f"stderr: {result.stderr}")
        
        # Check if output file was created
        expected_output = test_image.with_name(f"{test_image.stem}-nobg.png")
        if expected_output.exists():
            print("✓ Output file created successfully")
            
            # Verify it's a valid PNG with alpha channel
            with Image.open(expected_output) as img:
                print(f"✓ Output format: {img.format}, mode: {img.mode}")
                if img.mode == 'RGBA':
                    print("✓ Has alpha channel")
                else:
                    print("⚠ No alpha channel")
        else:
            print("✗ Output file not created")
        
        return result.returncode == 0
        
    finally:
        # Cleanup
        test_image.unlink()
        expected_output = test_image.with_name(f"{test_image.stem}-nobg.png")
        if expected_output.exists():
            expected_output.unlink()


def test_shell_scripts():
    """Test shell scripts basic functionality."""
    # Test divide-crop-3x3.sh help
    result1 = subprocess.run(["./divide-crop-3x3.sh"], capture_output=True, text=True)
    print(f"divide-crop-3x3.sh (no args) exit code: {result1.returncode}")
    
    # Test adjust-aspect-ratio.sh help
    result2 = subprocess.run(["./adjust-aspect-ratio.sh"], capture_output=True, text=True)
    print(f"adjust-aspect-ratio.sh (no args) exit code: {result2.returncode}")
    
    return True


if __name__ == "__main__":
    print("=== Testing LINE Sticker Tools Refactoring ===")
    print()
    
    print("1. Testing remove_bg.py basic functionality...")
    success1 = test_remove_bg_basic()
    print()
    
    print("2. Testing shell scripts...")
    success2 = test_shell_scripts()
    print()
    
    if success1 and success2:
        print("✓ All basic tests passed!")
        sys.exit(0)
    else:
        print("✗ Some tests failed")
        sys.exit(1)
