# Remove Background Tool (GUI)

A web-based tool for removing image backgrounds.
Supports automatic background removal with manual threshold adjustment.

## Features

- **Background Removal**: Fast processing in browser using Canvas API
- **Threshold Adjustment**: Fine-tune the automatic fuzz value using keyboard
- **Batch Processing**: Process and download multiple images at once
- **Auto Sizing**: Automatically adjusts image display size to fit window
- **Dark Mode**: Supports system preference or manual toggle

## Usage

1. Drag & drop images onto the screen (multiple allowed)
2. Check the result
   - **Arrow Keys**: Select (focus) image
   - **J / N**: Increase transparency range (increase fuzz)
   - **K / P**: Decrease transparency range (decrease fuzz)
3. **E**: Save images
   - Single image: Download as PNG
   - Multiple images: Download as ZIP

## Development

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```
