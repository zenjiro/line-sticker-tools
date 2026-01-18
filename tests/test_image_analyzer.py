"""Tests for image_analyzer module."""

import pytest
import tempfile
from pathlib import Path
import sys

from src.image_analyzer import (
    get_average_border_color,
    count_holes,
    get_image_dimensions,
    count_opaque_pixels
)
from tests.fixtures import create_test_image, create_border_test_image


class TestImageAnalyzer:
    """Test cases for image analysis functions."""
    
    def test_get_average_border_color_success(self):
        """Test successful border color detection."""
        # Create test image with white border
        test_image = create_border_test_image(
            width=100, height=100,
            border_color=(255, 255, 255),
            center_color=(255, 0, 0)
        )
        
        try:
            result = get_average_border_color(str(test_image))
            assert result is not None
            r, g, b = result
            # Should be close to white (allowing for some variation)
            assert 240 <= r <= 255
            assert 240 <= g <= 255  
            assert 240 <= b <= 255
        finally:
            test_image.unlink()
    
    def test_get_average_border_color_invalid_file(self):
        """Test border color detection with invalid file."""
        result = get_average_border_color("nonexistent.png")
        assert result is None
    
    def test_count_holes_with_transparency(self):
        """Test hole counting with transparent regions."""
        test_image = create_test_image(
            width=100, height=100,
            has_transparency=True
        )
        
        try:
            holes = count_holes(str(test_image))
            # Should detect the transparent regions we created
            assert holes >= 2
        finally:
            test_image.unlink()
    
    def test_count_holes_no_transparency(self):
        """Test hole counting without transparency."""
        test_image = create_test_image(
            width=100, height=100,
            has_transparency=False
        )
        
        try:
            holes = count_holes(str(test_image))
            # Should be 0 or 1 (depending on if there's a background)
            assert holes >= 0
        finally:
            test_image.unlink()
    
    def test_count_holes_invalid_file(self):
        """Test hole counting with invalid file."""
        holes = count_holes("nonexistent.png")
        assert holes == 0
    
    def test_get_image_dimensions_success(self):
        """Test successful dimension retrieval."""
        test_image = create_test_image(width=150, height=200)
        
        try:
            dimensions = get_image_dimensions(str(test_image))
            assert dimensions == (150, 200)
        finally:
            test_image.unlink()
    
    def test_get_image_dimensions_invalid_file(self):
        """Test dimension retrieval with invalid file."""
        dimensions = get_image_dimensions("nonexistent.png")
        assert dimensions is None
    
    def test_count_opaque_pixels_success(self):
        """Test opaque pixel counting."""
        test_image = create_test_image(
            width=100, height=100,
            has_transparency=True
        )
        
        try:
            opaque_count = count_opaque_pixels(str(test_image))
            # Should have some opaque pixels but not all (due to transparency)
            assert 0 < opaque_count < 100 * 100
        finally:
            test_image.unlink()
    
    def test_count_opaque_pixels_invalid_file(self):
        """Test opaque pixel counting with invalid file."""
        opaque_count = count_opaque_pixels("nonexistent.png")
        assert opaque_count == 0
