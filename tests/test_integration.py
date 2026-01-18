"""Integration tests for the complete LINE sticker processing workflow."""

import pytest
import tempfile
import subprocess
import shutil
from pathlib import Path
import sys
from PIL import Image
import numpy as np

from tests.fixtures import create_test_image, create_border_test_image


class TestBackwardCompatibility:
    """Test backward compatibility of the refactored tools."""
    
    def test_remove_bg_command_line_interface(self):
        """Test that remove_bg.py maintains the same command line interface."""
        # Create a test image
        test_image = create_border_test_image(
            width=100, height=100,
            border_color=(255, 255, 255),
            center_color=(255, 0, 0)
        )
        
        try:
            # Test the original command line interface
            result = subprocess.run([
                sys.executable, "remove_bg.py", str(test_image)
            ], capture_output=True, text=True, cwd=Path(__file__).parent.parent)
            
            # Should succeed (exit code 0)
            assert result.returncode == 0, f"Command failed: {result.stderr}"
            
            # Check that output file was created
            expected_output = test_image.with_name(f"{test_image.stem}-nobg.png")
            assert expected_output.exists(), "Output file was not created"
            
            # Verify output is a valid PNG
            with Image.open(expected_output) as img:
                assert img.format == 'PNG'
                assert img.mode == 'RGBA'  # Should have alpha channel
            
        finally:
            # Cleanup
            test_image.unlink()
            expected_output = test_image.with_name(f"{test_image.stem}-nobg.png")
            if expected_output.exists():
                expected_output.unlink()
    
    def test_remove_bg_multiple_files(self):
        """Test processing multiple files maintains backward compatibility."""
        # Create multiple test images
        test_images = []
        for i in range(3):
            img = create_border_test_image(
                width=50, height=50,
                border_color=(255, 255, 255),
                center_color=(0, 255, 0)
            )
            # Rename to avoid conflicts
            new_name = img.with_name(f"test_{i}.png")
            img.rename(new_name)
            test_images.append(new_name)
        
        try:
            # Test multiple file processing
            cmd = [sys.executable, "remove_bg.py"] + [str(img) for img in test_images]
            result = subprocess.run(cmd, capture_output=True, text=True, 
                                  cwd=Path(__file__).parent.parent)
            
            assert result.returncode == 0, f"Command failed: {result.stderr}"
            
            # Check all output files were created
            for test_image in test_images:
                expected_output = test_image.with_name(f"{test_image.stem}-nobg.png")
                assert expected_output.exists(), f"Output file not created for {test_image}"
            
        finally:
            # Cleanup
            for test_image in test_images:
                test_image.unlink()
                expected_output = test_image.with_name(f"{test_image.stem}-nobg.png")
                if expected_output.exists():
                    expected_output.unlink()
    
    def test_divide_crop_script_compatibility(self):
        """Test that divide-crop-3x3.sh maintains backward compatibility."""
        # Create a test image with transparent background
        test_image = create_test_image(width=300, height=300, has_transparency=True)
        
        try:
            # Test the shell script
            result = subprocess.run([
                "./divide-crop-3x3.sh", str(test_image)
            ], capture_output=True, text=True, cwd=Path(__file__).parent.parent)
            
            # Should succeed
            assert result.returncode == 0, f"Script failed: {result.stderr}"
            
            # Check that 9 output files were created (0-8)
            for i in range(9):
                expected_file = test_image.with_name(f"{test_image.stem}-{i}.png")
                assert expected_file.exists(), f"Output file {i} was not created"
                
                # Verify it's a valid image
                with Image.open(expected_file) as img:
                    assert img.format == 'PNG'
            
        finally:
            # Cleanup
            test_image.unlink()
            for i in range(9):
                output_file = test_image.with_name(f"{test_image.stem}-{i}.png")
                if output_file.exists():
                    output_file.unlink()
    
    def test_adjust_aspect_ratio_script_compatibility(self):
        """Test that adjust-aspect-ratio.sh maintains backward compatibility."""
        # Create a temporary directory with test images
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Create test images in the directory
            for i in range(2):
                img = create_test_image(width=100, height=150)
                img_path = temp_path / f"test_{i}.png"
                shutil.move(img, img_path)
            
            # Test the shell script
            result = subprocess.run([
                "./adjust-aspect-ratio.sh", str(temp_path)
            ], capture_output=True, text=True, cwd=Path(__file__).parent.parent)
            
            # Should succeed
            assert result.returncode == 0, f"Script failed: {result.stderr}"
            
            # Check output directory was created
            output_dir = Path(f"{temp_path}-216x185")
            assert output_dir.exists(), "Output directory was not created"
            
            # Check that images were processed
            output_images = list(output_dir.glob("*.png"))
            assert len(output_images) == 2, "Not all images were processed"
            
            # Verify aspect ratios
            for img_path in output_images:
                with Image.open(img_path) as img:
                    width, height = img.size
                    aspect_ratio = width / height
                    expected_ratio = 216 / 185
                    # Allow small tolerance for rounding
                    assert abs(aspect_ratio - expected_ratio) < 0.01, \
                        f"Incorrect aspect ratio: {aspect_ratio} vs {expected_ratio}"


class TestEndToEndWorkflow:
    """Test the complete end-to-end workflow."""
    
    @pytest.mark.integration
    def test_complete_sticker_workflow(self):
        """Test the complete workflow from original image to final stickers."""
        # Create a test image that simulates a 3x3 sticker sheet
        test_image = self._create_sticker_sheet()
        
        try:
            # Step 1: Remove background
            result1 = subprocess.run([
                sys.executable, "remove_bg.py", str(test_image)
            ], capture_output=True, text=True, cwd=Path(__file__).parent.parent)
            
            assert result1.returncode == 0, f"Background removal failed: {result1.stderr}"
            
            nobg_image = test_image.with_name(f"{test_image.stem}-nobg.png")
            assert nobg_image.exists(), "Background removed image not created"
            
            # Step 2: Divide into 3x3 grid
            result2 = subprocess.run([
                "./divide-crop-3x3.sh", str(nobg_image)
            ], capture_output=True, text=True, cwd=Path(__file__).parent.parent)
            
            assert result2.returncode == 0, f"Image division failed: {result2.stderr}"
            
            # Verify 9 pieces were created
            pieces = []
            for i in range(9):
                piece = nobg_image.with_name(f"{nobg_image.stem}-{i}.png")
                assert piece.exists(), f"Piece {i} was not created"
                pieces.append(piece)
            
            # Step 3: Create directory and adjust aspect ratios
            pieces_dir = nobg_image.parent / "pieces"
            pieces_dir.mkdir(exist_ok=True)
            
            # Move pieces to directory
            for piece in pieces:
                shutil.move(piece, pieces_dir / piece.name)
            
            # Adjust aspect ratios
            result3 = subprocess.run([
                "./adjust-aspect-ratio.sh", str(pieces_dir)
            ], capture_output=True, text=True, cwd=Path(__file__).parent.parent)
            
            assert result3.returncode == 0, f"Aspect ratio adjustment failed: {result3.stderr}"
            
            # Verify final output
            final_dir = Path(f"{pieces_dir}-216x185")
            assert final_dir.exists(), "Final output directory not created"
            
            final_images = list(final_dir.glob("*.png"))
            assert len(final_images) == 9, "Not all final images were created"
            
            # Verify final images have correct aspect ratio
            for img_path in final_images:
                with Image.open(img_path) as img:
                    width, height = img.size
                    aspect_ratio = width / height
                    expected_ratio = 216 / 185
                    assert abs(aspect_ratio - expected_ratio) < 0.01, \
                        f"Final image has incorrect aspect ratio: {aspect_ratio}"
            
        finally:
            # Cleanup
            test_image.unlink()
            
            # Clean up all generated files and directories
            cleanup_patterns = [
                f"{test_image.stem}-nobg.png",
                f"{test_image.stem}-nobg-*.png",
                "pieces",
                "pieces-216x185"
            ]
            
            for pattern in cleanup_patterns:
                if pattern.endswith('/') or not '.' in pattern:
                    # Directory
                    dir_path = test_image.parent / pattern
                    if dir_path.exists():
                        shutil.rmtree(dir_path)
                else:
                    # File pattern
                    for file_path in test_image.parent.glob(pattern):
                        if file_path.exists():
                            file_path.unlink()
    
    def _create_sticker_sheet(self) -> Path:
        """Create a test image that simulates a 3x3 sticker sheet."""
        temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
        temp_path = Path(temp_file.name)
        temp_file.close()
        
        # Create a 300x300 image with white background
        img = Image.new('RGB', (300, 300), (255, 255, 255))
        pixels = np.array(img)
        
        # Add 9 colored squares in a 3x3 grid
        colors = [
            (255, 0, 0), (0, 255, 0), (0, 0, 255),
            (255, 255, 0), (255, 0, 255), (0, 255, 255),
            (128, 0, 0), (0, 128, 0), (0, 0, 128)
        ]
        
        for i in range(3):
            for j in range(3):
                color_idx = i * 3 + j
                start_x = j * 100 + 20
                end_x = j * 100 + 80
                start_y = i * 100 + 20
                end_y = i * 100 + 80
                
                pixels[start_y:end_y, start_x:end_x] = colors[color_idx]
        
        img = Image.fromarray(pixels)
        img.save(temp_path)
        return temp_path


class TestErrorHandling:
    """Test error handling and edge cases."""
    
    def test_remove_bg_nonexistent_file(self):
        """Test remove_bg.py with nonexistent file."""
        result = subprocess.run([
            sys.executable, "remove_bg.py", "nonexistent.png"
        ], capture_output=True, text=True, cwd=Path(__file__).parent.parent)
        
        # Should fail gracefully
        assert result.returncode != 0
        assert "not found" in result.stderr.lower() or "error" in result.stderr.lower()
    
    def test_divide_crop_nonexistent_file(self):
        """Test divide-crop-3x3.sh with nonexistent file."""
        result = subprocess.run([
            "./divide-crop-3x3.sh", "nonexistent.png"
        ], capture_output=True, text=True, cwd=Path(__file__).parent.parent)
        
        # Should fail gracefully
        assert result.returncode != 0
    
    def test_adjust_aspect_ratio_nonexistent_dir(self):
        """Test adjust-aspect-ratio.sh with nonexistent directory."""
        result = subprocess.run([
            "./adjust-aspect-ratio.sh", "nonexistent_dir"
        ], capture_output=True, text=True, cwd=Path(__file__).parent.parent)
        
        # Should fail gracefully
        assert result.returncode != 0
