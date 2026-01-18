"""Tests for background_remover module."""

import pytest
import tempfile
from pathlib import Path
import sys
from unittest.mock import patch, MagicMock

from src.background_remover import (
    CropResult,
    analyze_crops,
    process_fuzz_value,
    remove_background
)
from tests.fixtures import create_test_image


class TestCropResult:
    """Test CropResult class."""
    
    def test_crop_result_creation(self):
        """Test CropResult initialization."""
        result = CropResult(
            fuzz=25,
            width=100,
            height=150,
            filepath=Path("test.png"),
            opaque_count=5000,
            holes=2
        )
        
        assert result.fuzz == 25
        assert result.width == 100
        assert result.height == 150
        assert result.filepath == Path("test.png")
        assert result.opaque_count == 5000
        assert result.holes == 2


class TestAnalyzeCrops:
    """Test crop analysis logic."""
    
    def test_analyze_crops_empty_list(self):
        """Test analysis with empty crop list."""
        result = analyze_crops([])
        assert result is None
    
    def test_analyze_crops_invalid_dimensions(self):
        """Test analysis with invalid crop dimensions."""
        crops = [
            CropResult(10, 0, 0, Path("test1.png"), 0, 0),
            CropResult(20, -1, 50, Path("test2.png"), 100, 1)
        ]
        result = analyze_crops(crops)
        assert result is None
    
    def test_analyze_crops_single_valid(self):
        """Test analysis with single valid crop."""
        crops = [
            CropResult(15, 100, 100, Path("test.png"), 5000, 2)
        ]
        result = analyze_crops(crops)
        assert result is not None
        assert result.fuzz == 15
    
    def test_analyze_crops_hole_surge_detection(self):
        """Test hole surge detection logic."""
        crops = [
            CropResult(10, 100, 100, Path("test1.png"), 5000, 5),
            CropResult(20, 100, 100, Path("test2.png"), 4800, 6),
            CropResult(30, 100, 100, Path("test3.png"), 4500, 150)  # Surge
        ]
        result = analyze_crops(crops)
        assert result is not None
        # Should stop before the surge
        assert result.fuzz == 20


class TestBackgroundRemover:
    """Test background removal functions."""
    
    @patch('src.background_remover.subprocess.run')
    @patch('src.background_remover.image_analyzer.get_image_dimensions')
    @patch('src.background_remover.image_analyzer.count_opaque_pixels')
    @patch('src.background_remover.image_analyzer.count_holes')
    def test_process_fuzz_value_success(self, mock_holes, mock_opaque, 
                                       mock_dimensions, mock_subprocess):
        """Test successful fuzz value processing."""
        # Setup mocks
        mock_subprocess.return_value = MagicMock()
        mock_dimensions.return_value = (100, 100)
        mock_opaque.return_value = 5000
        mock_holes.return_value = 3
        
        test_image = create_test_image()
        temp_dir = Path(tempfile.mkdtemp())
        
        try:
            result = process_fuzz_value(
                test_image, 25, (255, 255, 255), temp_dir
            )
            
            assert result is not None
            assert result.fuzz == 25
            assert result.width == 100
            assert result.height == 100
            assert result.opaque_count == 5000
            assert result.holes == 3
            
        finally:
            test_image.unlink()
            # Cleanup temp dir
            import shutil
            shutil.rmtree(temp_dir)
    
    @patch('src.background_remover.subprocess.run')
    def test_process_fuzz_value_subprocess_error(self, mock_subprocess):
        """Test fuzz processing with subprocess error."""
        from subprocess import CalledProcessError
        mock_subprocess.side_effect = CalledProcessError(1, 'convert')
        
        test_image = create_test_image()
        temp_dir = Path(tempfile.mkdtemp())
        
        try:
            result = process_fuzz_value(
                test_image, 25, (255, 255, 255), temp_dir
            )
            assert result is None
            
        finally:
            test_image.unlink()
            import shutil
            shutil.rmtree(temp_dir)
    
    @patch('src.background_remover.process_fuzz_value')
    @patch('src.background_remover.analyze_crops')
    def test_remove_background_success(self, mock_analyze, mock_process):
        """Test successful background removal."""
        # Setup mocks
        test_result = CropResult(25, 100, 100, Path("temp.png"), 5000, 3)
        mock_process.return_value = test_result
        mock_analyze.return_value = test_result
        
        test_image = create_test_image()
        
        # Create a temporary file to simulate the processed result
        temp_processed = Path(tempfile.mktemp(suffix='.png'))
        test_image_copy = create_test_image()
        import shutil
        shutil.copy(test_image_copy, temp_processed)
        test_result.filepath = temp_processed
        
        try:
            success = remove_background(test_image, (255, 255, 255))
            assert success is True
            
            # Check output file was created
            expected_output = test_image.with_name(f"{test_image.stem}-nobg.png")
            assert expected_output.exists()
            
        finally:
            test_image.unlink()
            test_image_copy.unlink()
            if temp_processed.exists():
                temp_processed.unlink()
            expected_output = test_image.with_name(f"{test_image.stem}-nobg.png")
            if expected_output.exists():
                expected_output.unlink()
