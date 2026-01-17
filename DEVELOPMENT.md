# Development Setup

This document provides instructions for setting up the development environment for LINE Sticker Tools.

## Prerequisites

- Python 3.11 or higher
- [uv](https://docs.astral.sh/uv/) - Python package manager
- ImageMagick - Image processing library
- Git

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd line-sticker-tools
```

### 2. Install Dependencies

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

### 3. Install System Dependencies

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install imagemagick bc
```

#### macOS
```bash
brew install imagemagick bc
```

#### Windows
- Install ImageMagick from https://imagemagick.org/script/download.php#windows
- bc is available through WSL or Git Bash

## Development Workflow

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

### Code Quality

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

### Running the Tools

```bash
# Background removal
uv run remove_bg.py image.png

# Image division (shell script)
./divide-crop-3x3.sh image-nobg.png

# Aspect ratio adjustment (shell script)  
./adjust-aspect-ratio.sh output_directory
```

## Project Structure

```
line-sticker-tools/
├── src/                    # Source code modules
│   ├── __init__.py
│   ├── image_analyzer.py   # Image analysis utilities
│   └── background_remover.py # Background removal logic
├── tests/                  # Test files
│   ├── __init__.py
│   ├── fixtures.py         # Test fixtures and utilities
│   ├── test_image_analyzer.py
│   └── test_background_remover.py
├── scripts/                # Additional scripts (future use)
├── remove_bg.py           # Main background removal script
├── divide-crop-3x3.sh     # Image division script
├── adjust-aspect-ratio.sh # Aspect ratio adjustment script
├── pyproject.toml         # Project configuration
└── README.md              # User documentation
```

## Adding New Features

1. Create a new branch: `git checkout -b feature/your-feature`
2. Write tests first (TDD approach)
3. Implement the feature
4. Run tests and quality checks
5. Update documentation if needed
6. Submit a pull request

## Debugging

### Enable Debug Logging

For Python scripts:
```bash
# Set logging level to DEBUG
PYTHONPATH=src python -c "
import logging
logging.basicConfig(level=logging.DEBUG)
# Your test code here
"
```

For shell scripts:
```bash
# Enable debug mode
DEBUG=1 ./adjust-aspect-ratio.sh my_images/

# Enable bash debugging
bash -x ./divide-crop-3x3.sh image.png
```

### Common Issues

1. **ImageMagick not found**: Ensure ImageMagick is installed and in PATH
2. **Permission denied**: Make shell scripts executable with `chmod +x *.sh`
3. **Import errors**: Ensure you're running from the project root directory
4. **Test failures**: Check that test fixtures are properly created and cleaned up

## Contributing

1. Follow the existing code style (enforced by black and isort)
2. Add type hints to all new functions
3. Write comprehensive tests for new features
4. Update documentation for user-facing changes
5. Ensure all quality checks pass before submitting

## Performance Considerations

- Large images may require significant memory for NumPy operations
- Temporary files are created during processing - ensure sufficient disk space
- Consider using smaller test images during development to speed up testing
