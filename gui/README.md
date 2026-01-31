# LINE Sticker Tools - GUI

This directory contains the unified GUI tools for LINE Sticker processing, built with React and Vite.

## Unified Architecture

Previously, each tool was a separate project. They have now been consolidated into a single Multi-Page Application (MPA) for better maintainability and consistent design.

- **Design System:** Shared components (Header, Layout) and CSS variables.
- **I18n:** Centralized internationalization management.
- **MPA Structure:** Uses Vite's rollup options to provide multiple entry points.

## Tools Included

1.  **Home:** The landing page with links to all tools.
2.  **Remove BG GUI:** Background removal tool using fuzzy color matching.
3.  **Divide & Crop GUI:** Tool for splitting images into 3x3 grids.
4.  **Arrange GUI:** Simulation and management tool for sticker sets.

## Development

### Prerequisites
- Node.js (v20 or later)
- npm

### Setup
```bash
npm install
```

### Running Locally
```bash
npm run dev
```
Navigate to `http://localhost:5173/line-sticker-tools/`.

### Building for Production
```bash
npm run build
```
The output will be in the `dist/` directory.

### Testing
We use Playwright for smoke tests.
```bash
npx playwright test
```
