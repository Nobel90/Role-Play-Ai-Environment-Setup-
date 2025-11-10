# Build Documentation

## Building the Application

This application uses [electron-builder](https://www.electron.build/) to create distributable packages.

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- All dependencies installed (`npm install`)

## Build Configuration

Build configuration is defined in:
- `package.json` - Basic build settings
- `electron-builder.yml` - Detailed build configuration

## Building for Windows

### NSIS Installer

Build a Windows NSIS installer:

```bash
npm run build:win
```

This creates:
- `dist/VRC Character Updater-Setup-1.0.0.exe` - NSIS installer

### Build Options

The Windows build includes:
- Custom installer icon
- Desktop shortcut creation
- Start menu shortcut
- Allow installation directory selection
- Uninstaller support

## Building for All Platforms

Build for all configured platforms:

```bash
npm run build
```

This will create installers for:
- Windows (NSIS)
- macOS (DMG)
- Linux (AppImage)

## Build Output

All build outputs are placed in the `dist/` directory:

```
dist/
├── VRC Character Updater-Setup-1.0.0.exe  # Windows installer
├── VRC Character Updater-1.0.0.dmg        # macOS disk image
└── VRC Character Updater-1.0.0.AppImage   # Linux AppImage
```

## Icons

Application icons should be placed in `assets/icons/`:

- `icon.ico` - Windows icon (256x256 recommended)
- `icon.icns` - macOS icon
- `icon.png` - Linux icon (512x512 recommended)

## Customization

### Changing App ID

Edit `package.json`:
```json
{
  "build": {
    "appId": "com.yourcompany.yourapp"
  }
}
```

### Changing Product Name

Edit `package.json`:
```json
{
  "build": {
    "productName": "Your App Name"
  }
}
```

### Modifying Installer Options

Edit `electron-builder.yml` or `package.json` build section:

```yaml
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  shortcutName: "Your App Name"
```

## Troubleshooting

### Build Fails

1. Ensure all dependencies are installed: `npm install`
2. Check Node.js version: `node --version` (should be v16+)
3. Clear cache: `npm cache clean --force`
4. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Icons Not Showing

1. Ensure icon files exist in `assets/icons/`
2. Check icon file formats (`.ico` for Windows, `.icns` for macOS)
3. Verify icon sizes are appropriate

### Large Build Size

The build includes Electron runtime, which is large. This is normal. To reduce size:
- Use electron-builder's compression options
- Consider using asar packaging (enabled by default)

## Publishing

To publish to GitHub Releases:

1. Set up GitHub token in environment:
```bash
export GH_TOKEN=your_github_token
```

2. Build and publish:
```bash
npm run dist
```

This will:
- Build the application
- Create release artifacts
- Upload to GitHub Releases (if configured)

## Continuous Integration

Example GitHub Actions workflow:

```yaml
name: Build

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - run: npm install
      - run: npm run build
      
      - uses: actions/upload-artifact@v2
        with:
          name: dist-${{ matrix.os }}
          path: dist/
```

