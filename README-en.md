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

### 4. Applying via PC (LINE Sticker Tools GUI)

An integrated set of GUI tools for background removal, image division, simulation, and management in your browser. It is deployed to GitHub Pages for immediate use.

**🔗 [Open Web Tools](https://zenjiro.github.io/line-sticker-tools/)**
(Access all tools from the home page)

Key Features:
- **Remove BG**: Transparent processing in the browser
- **Divide & Crop**: Execute 3x3 division while previewing
- **Arrange**: Drag & drop organization, main/tab settings, and ZIP export

For detailed usage, please refer to [gui/README.md](gui/README.md).

## Development

For local development and running tests, please refer to [DEVELOPMENT-en.md](DEVELOPMENT-en.md).
