# Favicon Resizer - Manual Width & Height Control

This guide shows you how to manually set the width and height of your favicon.

## Quick Start

### Method 1: Edit TypeScript File (Recommended)

1. Open `resize-favicon.ts`
2. Edit these lines:
   ```typescript
   const WIDTH = 768;   // Change this to your desired width
   const HEIGHT = 480;  // Change this to your desired height
   ```
3. Run:
   ```bash
   npx tsx resize-favicon.ts
   ```
   OR if you have tsx installed:
   ```bash
   npm install -g tsx
   tsx resize-favicon.ts
   ```

### Method 2: PowerShell Script

1. Run with custom dimensions:
   ```powershell
   .\resize-favicon.ps1 -Width 800 -Height 500
   ```

2. Or edit the default values in the script:
   ```powershell
   param(
       [int]$Width = 768,    # Edit this
       [int]$Height = 480,   # Edit this
       ...
   )
   ```

### Method 3: Node.js Script

1. Run with command line arguments:
   ```bash
   node resize-favicon.js 800 500
   ```

2. Or edit the CONFIG object in the file:
   ```javascript
   const CONFIG = {
       width: 768,      // Edit this
       height: 480,     // Edit this
       ...
   };
   ```

### Method 4: JSON Config File

1. Edit `resize-favicon-config.json`:
   ```json
   {
     "width": 768,    // Edit this
     "height": 480,    // Edit this
     ...
   }
   ```

## Recommended Sizes

- **Square favicons**: 32x32, 64x64, 128x128, 256x256
- **Wide favicons**: 768x480, 800x500, 1024x640
- **Standard**: 16x16, 32x32, 48x48

## Current Settings

- **Width**: 768 pixels
- **Height**: 480 pixels
- **Aspect Ratio**: 8:5 (wider than standard)

## After Resizing

The script automatically updates:
- `src/app/icon.png` (Next.js auto-detection)
- `public/albania_favicon.png` (metadata reference)

Then:
1. Hard refresh your browser (Ctrl+Shift+R / Cmd+Shift+R)
2. Or restart your dev server

## Dependencies

For TypeScript/Node.js scripts, you need:
```bash
npm install sharp
```

For PowerShell script, no dependencies needed (uses .NET).
