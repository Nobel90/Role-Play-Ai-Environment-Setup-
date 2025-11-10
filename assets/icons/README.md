# Application Icons

This directory should contain the application icons for all platforms.

## Required Icons

### Windows
- **File**: `icon.ico`
- **Size**: 256x256 pixels (recommended)
- **Format**: ICO format
- **Usage**: Windows installer and application icon

### macOS
- **File**: `icon.icns`
- **Size**: Multiple sizes (16x16 to 1024x1024)
- **Format**: ICNS format
- **Usage**: macOS DMG and application icon

### Linux
- **File**: `icon.png`
- **Size**: 512x512 pixels (recommended)
- **Format**: PNG format
- **Usage**: Linux AppImage and application icon

## Creating Icons

### Option 1: Online Tools
- Use online icon generators like:
  - [CloudConvert](https://cloudconvert.com/) - Convert PNG to ICO/ICNS
  - [IconGenerator](https://icongenerator.app/) - Generate icons from images
  - [RealFaviconGenerator](https://realfavicongenerator.net/) - Generate all formats

### Option 2: ImageMagick
```bash
# Convert PNG to ICO (Windows)
magick convert icon.png -resize 256x256 icon.ico

# Convert PNG to ICNS (macOS) - requires iconutil on macOS
# First create iconset directory structure, then:
iconutil -c icns icon.iconset
```

### Option 3: Design Tools
- Use design tools like Photoshop, GIMP, or Figma
- Export in required formats
- Ensure proper sizing and transparency

## Icon Design Guidelines

1. **Design**: Create a simple, recognizable icon that represents the application
2. **Colors**: Use colors that work well on both light and dark backgrounds
3. **Size**: Design at high resolution (1024x1024) and scale down
4. **Transparency**: Use transparent backgrounds where appropriate
5. **Clarity**: Ensure the icon is clear and recognizable at small sizes

## Temporary Solution

If icons are not available, the application will still run, but:
- Builds may show warnings
- The application will use default Electron icons
- Installers may not have custom icons

## Notes

- The build configuration in `electron-builder.yml` references these icon files
- If icons are missing, the build process will still work but with default icons
- Icons are referenced in `src/main/main.js` for the application window icon

