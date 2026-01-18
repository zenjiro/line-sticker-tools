# AI Agent Workflows for LINE Sticker Tools

This document provides comprehensive workflows for AI assistants working on the LINE Sticker Tools project. It includes step-by-step procedures for code refactoring, feature development, and testing validation with domain-specific context for LINE sticker processing.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Domain Knowledge](#domain-knowledge)
3. [Code Refactoring Workflows](#code-refactoring-workflows)
4. [Feature Development Workflows](#feature-development-workflows)
5. [Testing and Validation Workflows](#testing-and-validation-workflows)
6. [Documentation Workflows](#documentation-workflows)
7. [Troubleshooting Guide](#troubleshooting-guide)

## Project Overview

### Architecture
```
line-sticker-tools/
├── src/                    # Modular Python code
│   ├── image_analyzer.py   # Image analysis utilities
│   └── background_remover.py # Background removal logic
├── tests/                  # Comprehensive test suite
├── remove_bg.py           # Main CLI script
├── divide-crop-3x3.sh     # Image division script
├── adjust-aspect-ratio.sh # Aspect ratio adjustment
├── validate_refactoring.py # Backward compatibility testing
└── pyproject.toml         # Project configuration
```

### Key Technologies
- **Python 3.11+** with PIL, NumPy, SciPy
- **ImageMagick** for advanced image processing
- **Shell scripting** for batch operations
- **pytest** for testing framework
- **uv** for package management

### Related Documentation
- [README.md](README.md) - User documentation (Japanese)
- [DEVELOPMENT.md](DEVELOPMENT.md) - Developer setup guide
- [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md) - Technical improvements

## Domain Knowledge

### LINE Sticker Requirements
1. **Image Format**: PNG with transparency support
2. **Dimensions**: Flexible, but commonly 370x320px for main stickers
3. **Aspect Ratio**: 216:185 for LINE Sticker Maker app compatibility
4. **Background**: Transparent or solid color removal required
5. **Content**: 3x3 grids are common for sticker sets (9 stickers total)

### Image Processing Concepts
- **Background Removal**: Uses ImageMagick's fuzz tolerance for color matching
- **Hole Detection**: Counts transparent regions to validate background removal quality
- **Border Analysis**: Analyzes image edges to determine background color
- **Batch Processing**: Parallel processing for multiple images

### Common Workflows
1. **Background Removal** → **Grid Division** → **Aspect Ratio Adjustment**
2. **Quality Validation** → **Batch Processing** → **Output Organization**

## Code Refactoring Workflows

### 1. Analyzing Existing Code

**Step 1: Code Structure Analysis**
```bash
# Examine current project structure
find . -name "*.py" -o -name "*.sh" | head -20
ls -la src/ tests/ 2>/dev/null || echo "Directories may not exist yet"
```

**Step 2: Identify Refactoring Opportunities**
```bash
# Look for code duplication
grep -r "def " src/ --include="*.py" | sort
# Check for long functions (>50 lines)
find src/ -name "*.py" -exec wc -l {} \; 2>/dev/null
```

**Step 3: Dependency Analysis**
```bash
# Check imports and dependencies
grep -r "^import\|^from" src/ --include="*.py" | sort | uniq
# Verify external dependencies
grep -A 10 "dependencies" pyproject.toml
```

### 2. Modular Refactoring Process

**Step 1: Create Module Structure**
```bash
# Create src directory if it doesn't exist
mkdir -p src
touch src/__init__.py
```

**Step 2: Extract Functions**
```python
# Template for new module
"""Module docstring with purpose and examples.

Example:
    Basic usage:
    >>> from src import module_name
    >>> result = module_name.function_name(args)
"""

import logging
from pathlib import Path
from typing import Optional, Tuple, List

logger = logging.getLogger(__name__)

def function_name(param: type) -> return_type:
    """Function docstring with clear description.
    
    Args:
        param: Parameter description
        
    Returns:
        Return value description
        
    Raises:
        ExceptionType: When this exception occurs
    """
    # Implementation
    pass
```

**Step 3: Update Main Script**
```python
# Update imports in main script
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from image_analyzer import analyze_function
from background_remover import remove_function
```

**Step 4: Maintain Backward Compatibility**
```bash
# Test backward compatibility
python validate_refactoring.py
# Run original command line interface tests
python -m pytest tests/test_integration.py::TestBackwardCompatibility -v
```

### 3. Error Handling Enhancement

**Step 1: Add Comprehensive Logging**
```python
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def enhanced_function(param):
    """Function with comprehensive error handling."""
    try:
        logger.info(f"Processing {param}")
        # Main logic here
        result = process_param(param)
        logger.info(f"Successfully processed {param}")
        return result
    except SpecificException as e:
        logger.error(f"Specific error processing {param}: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error processing {param}: {e}")
        raise
```

**Step 2: Input Validation**
```python
from pathlib import Path

def validate_image_input(image_path: Path) -> bool:
    """Validate image input with clear error messages."""
    if not image_path.exists():
        logger.error(f"Image file not found: {image_path}")
        return False
    
    if not image_path.suffix.lower() in ['.png', '.jpg', '.jpeg']:
        logger.error(f"Unsupported image format: {image_path.suffix}")
        return False
    
    try:
        from PIL import Image
        with Image.open(image_path) as img:
            img.verify()
        return True
    except Exception as e:
        logger.error(f"Invalid image file {image_path}: {e}")
        return False
```

## Feature Development Workflows

### 1. Test-Driven Development Process

**Step 1: Write Failing Tests**
```python
# tests/test_new_feature.py
import pytest
from pathlib import Path
import sys

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from new_module import new_function
from tests.fixtures import create_test_image

class TestNewFeature:
    """Test new feature functionality."""
    
    def test_new_function_basic_case(self):
        """Test basic functionality of new feature."""
        # Arrange
        test_image = create_test_image(width=100, height=100)
        expected_result = "expected_value"
        
        try:
            # Act
            result = new_function(test_image)
            
            # Assert
            assert result == expected_result
            
        finally:
            # Cleanup
            test_image.unlink()
```

**Step 2: Run Tests (Should Fail)**
```bash
# Run the new tests
python -m pytest tests/test_new_feature.py -v
# Expected: Tests should fail since function doesn't exist yet
```

**Step 3: Implement Minimal Feature**
```python
# src/new_module.py
"""New feature module for LINE sticker processing."""

import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

def new_function(image_path: Path) -> Optional[str]:
    """New function with minimal implementation.
    
    Args:
        image_path: Path to image file
        
    Returns:
        Result string or None if processing fails
    """
    if image_path is None:
        raise ValueError("image_path cannot be None")
    
    if not image_path.exists():
        logger.error(f"Image file not found: {image_path}")
        return None
    
    # Minimal implementation to pass tests
    return "expected_value"
```

### 2. Integration with Existing Tools

**Step 1: Add Command-Line Interface**
```python
# In main script (e.g., remove_bg.py)
def parse_arguments():
    """Parse command line arguments."""
    # Add new feature flag
    if '--new-feature' in sys.argv:
        return {'use_new_feature': True}
    return {'use_new_feature': False}

def main():
    """Main function with new feature integration."""
    args = parse_arguments()
    
    for image_path in image_paths:
        if args['use_new_feature']:
            from new_module import new_function
            result = new_function(image_path)
            if result:
                print(f"New feature result: {result}")
        
        # Continue with existing processing
        process_image_normally(image_path)
```

### 3. Performance Optimization

**Step 1: Implement Parallel Processing**
```python
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import multiprocessing

def process_images_parallel(image_paths: list, max_workers: int = None):
    """Process multiple images in parallel.
    
    Args:
        image_paths: List of image file paths
        max_workers: Maximum number of worker threads
    """
    if max_workers is None:
        max_workers = min(len(image_paths), multiprocessing.cpu_count())
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks
        futures = [executor.submit(process_single_image, path) 
                  for path in image_paths]
        
        # Collect results with progress indication
        results = []
        for i, future in enumerate(futures):
            try:
                result = future.result()
                results.append(result)
                print(f"Progress: {i+1}/{len(futures)} completed")
            except Exception as e:
                print(f"Error processing image {i}: {e}")
                results.append(None)
    
    return results
```

## Testing and Validation Workflows

### 1. Unit Testing Strategy

**Step 1: Write Comprehensive Unit Tests**
```python
# tests/test_image_analyzer.py
import pytest
import numpy as np
from PIL import Image
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from image_analyzer import get_average_border_color, count_holes
from tests.fixtures import create_test_image, create_border_test_image

class TestImageAnalyzer:
    """Test image analysis functions."""
    
    def test_get_average_border_color_success(self):
        """Test successful border color detection."""
        # Create test image with known border color
        test_image = create_border_test_image(
            width=100, height=100,
            border_color=(255, 0, 0),  # Red border
            center_color=(0, 255, 0)   # Green center
        )
        
        try:
            result = get_average_border_color(test_image)
            
            # Should detect red border color
            assert result is not None
            r, g, b = result
            assert abs(r - 255) < 10  # Allow small tolerance
            assert abs(g - 0) < 10
            assert abs(b - 0) < 10
            
        finally:
            test_image.unlink()
    
    @pytest.mark.parametrize("width,height", [
        (50, 50),
        (200, 150),
        (300, 300)
    ])
    def test_different_image_sizes(self, width, height):
        """Test functions with different image dimensions."""
        test_image = create_test_image(width=width, height=height)
        
        try:
            # Test that functions handle different sizes
            color = get_average_border_color(test_image)
            holes = count_holes(test_image)
            
            assert color is not None
            assert isinstance(holes, int)
            
        finally:
            test_image.unlink()
```

### 2. Integration Testing

**Step 1: Test Complete Workflow**
```python
# tests/test_integration.py
class TestCompleteWorkflow:
    """Test complete LINE sticker processing workflow."""
    
    def test_complete_sticker_workflow(self):
        """Test the complete workflow from input to final output."""
        # Create a 3x3 grid test image
        test_image = create_test_image(width=300, height=300)
        
        try:
            # Step 1: Background removal
            result = subprocess.run([
                sys.executable, "remove_bg.py", str(test_image)
            ], capture_output=True, text=True)
            
            assert result.returncode == 0
            
            nobg_image = test_image.with_name(f"{test_image.stem}-nobg.png")
            assert nobg_image.exists()
            
            # Step 2: Grid division
            result = subprocess.run([
                "./divide-crop-3x3.sh", str(nobg_image)
            ], capture_output=True, text=True)
            
            assert result.returncode == 0
            
            # Check that 9 individual images were created
            for i in range(9):
                individual_image = nobg_image.with_name(f"{nobg_image.stem}-{i}.png")
                assert individual_image.exists()
            
        finally:
            # Cleanup all generated files
            cleanup_test_files(test_image)
```

### 3. Backward Compatibility Testing

**Step 1: Validate Original Interface**
```bash
# Run backward compatibility tests
python validate_refactoring.py

# Run specific compatibility test suite
python -m pytest tests/test_integration.py::TestBackwardCompatibility -v
```

## Documentation Workflows

### 1. Code Documentation

**Step 1: Add Comprehensive Docstrings**
```python
def process_line_sticker_image(image_path: Path, 
                              background_color: Optional[Tuple[int, int, int]] = None,
                              fuzz_tolerance: int = 10) -> bool:
    """Process a LINE sticker image with background removal.
    
    This function removes the background from a LINE sticker image using
    ImageMagick with intelligent parameter selection. It analyzes the image
    border to determine the background color if not provided.
    
    Args:
        image_path: Path to the input image file. Must be PNG, JPG, or JPEG.
        background_color: RGB tuple for background color. If None, will be
            automatically detected from image borders.
        fuzz_tolerance: Color matching tolerance (0-100). Higher values
            match more similar colors. Default is 10.
    
    Returns:
        True if processing succeeded, False otherwise.
    
    Raises:
        ValueError: If image_path is None or fuzz_tolerance is out of range.
        FileNotFoundError: If the input image file doesn't exist.
        
    Example:
        Basic usage with automatic background detection:
        
        >>> from pathlib import Path
        >>> success = process_line_sticker_image(Path("sticker.png"))
        >>> if success:
        ...     print("Background removed successfully")
    
    Note:
        - Output file will be saved with '-nobg' suffix
        - Requires ImageMagick to be installed and available in PATH
        - Large images may require significant processing time
    """
```

## Troubleshooting Guide

### Common Issues and Solutions

**1. ImageMagick Not Found**
```bash
# Check if ImageMagick is installed
which convert identify
# If not found, install it
sudo apt-get install imagemagick  # Ubuntu/Debian
brew install imagemagick          # macOS
```

**2. Import Errors**
```python
# Add src to Python path
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / "src"))

# Or use relative imports
from .image_analyzer import function_name
```

**3. Test Failures**
```bash
# Run tests with verbose output
python -m pytest -v --tb=short

# Run specific test
python -m pytest tests/test_image_analyzer.py::TestImageAnalyzer::test_specific_function -v

# Run with coverage
python -m pytest --cov=src --cov-report=html
```

**4. Performance Issues**
```python
# Profile code to find bottlenecks
import cProfile
cProfile.run('your_function()', 'profile_output.prof')

# Analyze profile
import pstats
stats = pstats.Stats('profile_output.prof')
stats.sort_stats('cumulative').print_stats(10)
```

**5. Memory Issues with Large Images**
```python
# Process images in chunks
def process_large_image_safely(image_path: Path):
    """Process large images with memory management."""
    try:
        with Image.open(image_path) as img:
            # Check image size
            if img.width * img.height > 10_000_000:  # 10MP threshold
                # Resize for processing
                img.thumbnail((2000, 2000), Image.Resampling.LANCZOS)
            
            # Process the image
            result = process_image(img)
            return result
            
    except MemoryError:
        logger.error(f"Image too large to process: {image_path}")
        return None
```

### Debugging Workflows

**1. Enable Debug Logging**
```python
import logging

# Set up debug logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('debug.log'),
        logging.StreamHandler()
    ]
)
```

**2. Interactive Debugging**
```python
# Add breakpoints for debugging
import pdb; pdb.set_trace()

# Or use ipdb for better interface
import ipdb; ipdb.set_trace()

# For pytest debugging
python -m pytest --pdb tests/test_file.py::test_function
```

---

This document serves as a comprehensive guide for AI assistants working on LINE Sticker Tools. Follow these workflows to maintain code quality, ensure backward compatibility, and deliver robust features that meet LINE sticker processing requirements.

For additional information, refer to:
- [DEVELOPMENT.md](DEVELOPMENT.md) for development environment setup
- [README.md](README.md) for user-facing documentation
- [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md) for technical improvement details
