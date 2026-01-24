# Development Guide

This document describes how to develop and run LINE Sticker Tools locally.

## Requirements

- **Python 3.11 or higher**
- **uv** (Python package manager)
- **ImageMagick** (uses `convert` command)
- **Node.js** (for developing sticker-gui locally)

## Installation

```bash
git clone <repository-url>
cd line-sticker-tools
uv sync

# If developing sticker-gui locally
cd sticker-gui
npm install
```

---

## Python Tools Development

### Background Removal Tool

```bash
uv run remove_bg.py image.png
```

### Running Tests

```bash
uv run pytest
```

---

## sticker-gui Development

### Starting Local Server

```bash
cd sticker-gui
npm run dev
```

Please access the displayed URL (e.g., `http://localhost:5173`) in your browser.

### Linting

```bash
npm run lint
```

### Running Tests

```bash
npx playwright install  # First time only
npx playwright test
```

### Build

```bash
npm run build
```

---

## File Structure (For Developers)

```
.
├── remove_bg.py             # Main script for background removal
├── src/                     # Source code for Python image processing
│   ├── image_analyzer.py    # Image analysis features
│   └── background_remover.py# Background removal processing
├── tests/                   # Python test suite
├── sticker-gui/             # Web app for sticker verification/management
│   ├── src/                 # React source code
│   ├── tests/               # Playwright tests
│   └── ...
├── divide-crop-3x3.sh       # Image division script
└── adjust-aspect-ratio.sh   # Aspect ratio adjustment script
```
