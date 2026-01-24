# LINE Sticker Tools

Simple tools to assist in creating LINE stickers.

## Requirements

- **Python 3.11 or higher**
- **uv** (Python package manager)
- **ImageMagick** (uses `convert` command)

## Installation

```bash
git clone <repository-url>
cd line-sticker-tools
uv sync
```

## Usage

### 1. Background Removal (Required)
```bash
uv run remove_bg.py image.png
uv run remove_bg.py image1.png image2.png image3.png
```

Files with `-nobg` suffix like `image-nobg.png` will be generated.

### 2. Image Division (3x3) (Required)
```bash
./divide-crop-3x3.sh image-nobg.png
```

Proceed with one of the following methods depending on your application method.

### 3. Applying via Smartphone App (Adjust Aspect Ratio)
```bash
./adjust-aspect-ratio.sh directory_name
```

### 4. Applying via PC (sticker-gui)

A GUI tool for simulating and managing stickers in your browser. It is deployed to GitHub Pages for immediate use.

**🔗 [Open sticker-gui](https://zenjiro.github.io/line-sticker-tools/)**

Key Features:
- **Drag & Drop** to import images
- **Keyboard Shortcuts** for quick organization
- **Main/Tab Image** settings
- **ZIP Export** to create files for application

For detailed usage, please refer to [sticker-gui/README-en.md](sticker-gui/README-en.md).

## Development

For local development and running tests, please refer to [DEVELOPMENT-en.md](DEVELOPMENT-en.md).
