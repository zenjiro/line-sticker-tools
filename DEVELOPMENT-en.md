# Development Guide

This document describes how to develop and run LINE Sticker Tools locally.

## Requirements

- **Python 3.11 or higher**
- **uv** (Python package manager)
- **ImageMagick** (uses `convert` command)
- **Node.js** (for developing the GUI locally)

## Installation

```bash
git clone <repository-url>
cd line-sticker-tools
uv sync

# If developing the GUI locally
cd gui
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

## GUI Development (React + Vite)

### Starting Local Server

```bash
cd gui
npm run dev
```

Please access the URL (e.g., `http://localhost:5173/line-sticker-tools/`) in your browser.

### Linting

```bash
cd gui
npm run lint
```

### Running Tests (Playwright)

```bash
cd gui
npx playwright install  # First time only
npx playwright test
```

### Build

```bash
cd gui
npm run build
```

---

## File Structure (For Developers)

```
.
├── remove_bg.py             # Main script for background removal
├── src/                     # Source code for Python image processing
├── tests/                   # Python test suite
├── gui/                     # Unified Web App (React + Vite)
│   ├── src/                 # React source code (tools are under pages/)
│   ├── tests/               # Playwright tests
│   ├── public/              # Static assets
│   └── vite.config.js       # MPA Configuration
├── divide-crop-3x3.sh       # Image division script
└── adjust-aspect-ratio.sh   # Aspect ratio adjustment script
```
