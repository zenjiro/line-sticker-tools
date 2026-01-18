# AI Agent Workflows & Development Guide for LINE Sticker Tools

This document provides comprehensive workflows for AI assistants and developers working on the LINE Sticker Tools project. It combines development setup instructions with step-by-step procedures for code refactoring, feature development, and testing validation.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Development Setup](#development-setup)
3. [Domain Knowledge](#domain-knowledge)
4. [Tool Usage](#tool-usage)
5. [Code Refactoring Workflows](#code-refactoring-workflows)
6. [Feature Development Workflows](#feature-development-workflows)
7. [Testing and Validation Workflows](#testing-and-validation-workflows)
8. [Documentation Workflows](#documentation-workflows)
9. [Troubleshooting & Debugging](#troubleshooting--debugging)
10. [Contributing](#contributing)

## Project Overview

### Architecture
```
line-sticker-tools/
├── src/                    # Source code modules
│   ├── __init__.py
│   ├── image_analyzer.py   # Image analysis utilities
│   └── background_remover.py # Background removal logic
├── tests/                  # Comprehensive test suite
│   ├── __init__.py
│   ├── fixtures.py         # Test fixtures and utilities
│   ├── test_image_analyzer.py
│   └── test_background_remover.py
├── scripts/                # Additional scripts
├── remove_bg.py           # Main CLI script (Background removal)
├── divide-crop-3x3.sh     # Image division script
├── adjust-aspect-ratio.sh # Aspect ratio adjustment
├── validate_refactoring.py # Backward compatibility testing
├── pyproject.toml         # Project configuration
└── README.md              # User documentation (Japanese)
```

### Key Technologies
- **Python 3.11+** with PIL, NumPy, SciPy
- **ImageMagick** for advanced image processing
- **Shell scripting** for batch operations
- **pytest** for testing framework
- **uv** for package management

## Development Setup

### Prerequisites

- Python 3.11 or higher
- [uv](https://docs.astral.sh/uv/) - Python package manager
- ImageMagick - Image processing library
- Git

### Installation

**1. Clone the Repository**

```bash
git clone <repository-url>
cd line-sticker-tools
```

**2. Install Dependencies**

Using uv (recommended):
```bash
# Install runtime dependencies
uv sync

# Install development dependencies
uv sync --extra dev
```

Using pip:
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e .
pip install -e ".[dev]"
```

### System Dependencies

**Ubuntu/Debian**
```bash
sudo apt-get update
sudo apt-get install imagemagick bc
```

**macOS**
```bash
brew install imagemagick bc
```

**Windows**
- Install ImageMagick from https://imagemagick.org/script/download.php#windows
- `bc` is available through WSL or Git Bash

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

### Performance Considerations
- **Memory**: Large images may require significant memory for NumPy operations.
- **Disk Space**: Temporary files are created during processing - ensure sufficient disk space.
- **Testing**: Consider using smaller test images during development to speed up testing.

## Tool Usage

### Running the Tools

**Background Removal**
```bash
uv run remove_bg.py image.png
```

**Image Division** (Shell script)
```bash
./divide-crop-3x3.sh image-nobg.png
```

**Aspect Ratio Adjustment** (Shell script)
```bash
./adjust-aspect-ratio.sh output_directory
```

## Code Refactoring Workflows

### 1. Analyzing Existing Code

**Step 1: Code Structure Analysis**
```bash
# Examine current project structure
find . -name "*.py" -o -name "*.sh" | head -20
```

**Step 2: Identify Refactoring Opportunities**
```bash
# Look for code duplication
grep -r "def " src/ --include="*.py" | sort
# Check for long functions (>50 lines)
find src/ -name "*.py" -exec wc -l {} \; 2>/dev/null
```

### 2. Modular Refactoring Process

**Step 1: Create Module Structure**
```bash
# Create src directory if it doesn't exist
mkdir -p src
touch src/__init__.py
```

**Step 2: Extract Functions**
(See original AGENTS.md for templates)

**Step 3: Update Main Script**
Ensure imports are updated to use the new `src` modules.

**Step 4: Maintain Backward Compatibility**
```bash
# Test backward compatibility
python validate_refactoring.py
```

## Feature Development Workflows

### Checklist for New Features
1. Create a new branch: `git checkout -b feature/your-feature`
2. Write tests first (TDD approach)
3. Implement the feature
4. Run tests and quality checks
5. Update documentation if needed
6. Submit a pull request

### 1. Test-Driven Development Process

**Step 1: Write Failing Tests**
Create a new test file in `tests/` and define your test cases using `pytest`.

**Step 2: Run Tests (Should Fail)**
```bash
python -m pytest tests/test_new_feature.py -v
```

**Step 3: Implement Minimal Feature**
Write just enough code in `src/` to make the test pass.

### 2. Integration with Existing Tools

**Step 1: Add Command-Line Interface**
Update `remove_bg.py` or create a new script to expose the feature via CLI arguments.

## Testing and Validation Workflows

### Running Tests

```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=src --cov-report=html

# Run specific test file
uv run pytest tests/test_image_analyzer.py

# Run tests with specific markers
uv run pytest -m "not slow"
```

### Code Quality Checks

```bash
# Format code
uv run black src/ tests/

# Sort imports
uv run isort src/ tests/

# Type checking
uv run mypy src/

# Run all quality checks
uv run black --check src/ tests/
uv run isort --check-only src/ tests/
uv run mypy src/
```

### 3. Integration Testing

**Step 1: Test Complete Workflow**
Run integration tests to verify the pipeline: Background Removal → Grid Division → Aspect Ratio Adjustment.

```bash
# Run integration tests
python -m pytest tests/test_integration.py -v
```

## Documentation Workflows

### 1. Code Documentation

Add comprehensive docstrings to all functions and classes. Follow Google style docstrings as shown in the template below:

```python
def function_name(param: type) -> return_type:
    """Short description.

    Args:
        param: Description.

    Returns:
        Description.
    """
    pass
```

## Troubleshooting & Debugging

### Enable Debug Logging

**For Python scripts:**
```bash
# Set logging level to DEBUG
PYTHONPATH=src python -c "
import logging
logging.basicConfig(level=logging.DEBUG)
# Your test code here
"
```

**For shell scripts:**
```bash
# Enable debug mode
DEBUG=1 ./adjust-aspect-ratio.sh my_images/

# Enable bash debugging
bash -x ./divide-crop-3x3.sh image.png
```

### Common Issues

1. **ImageMagick not found**: Ensure ImageMagick is installed and in PATH (`which convert`).
2. **Permission denied**: Make shell scripts executable with `chmod +x *.sh`.
3. **Import errors**: Ensure you're running from the project root directory and `src` is in PYTHONPATH.
4. **Test failures**: Check that test fixtures are properly created and cleaned up.
5. **Memory Issues**: Large images (>10MP) may fail; resize them or process in chunks.

## Contributing

1. Follow the existing code style (enforced by `black` and `isort`).
2. Add type hints to all new functions.
3. Write comprehensive tests for new features.
4. Update documentation for user-facing changes.
5. Ensure all quality checks pass before submitting.