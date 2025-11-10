# Technical Context

## Technologies Used

### Core
- **Electron**: v37.2.0 - Desktop application framework
- **Node.js**: v16+ required
- **npm**: v7+ required

### Dependencies
- **axios**: ^1.10.0 - HTTP client for API requests
- **electron-builder**: ^26.0.0 - Application packaging and distribution

### Development Dependencies
- **jest**: ^29.7.0 - Testing framework

## Development Setup

### Installation
```bash
npm install
```

### Running
```bash
npm start
```

### Testing
```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

### Building
```bash
npm run build:win     # Windows only
npm run build         # All platforms
```

## Technical Constraints

### Security
- Context isolation: Enabled
- Node.js integration: Disabled in renderer
- Sandbox: Disabled (needed for file operations)
- CSP: Configured in HTML

### Platform Support
- Windows: NSIS installer
- macOS: DMG (not yet tested)
- Linux: AppImage (not yet tested)

### API Configuration
- JSONBin.io API v3
- Master key authentication
- Default timeout: 15 seconds

## File Structure
```
src/
├── main/              # Electron main process
│   ├── main.js        # Entry point, IPC handlers
│   └── preload.js     # Context bridge
├── renderer/          # UI layer
│   ├── index.html     # HTML structure
│   ├── renderer.js    # UI logic
│   └── styles.css     # Styling
├── api/               # API client
│   └── jsonbin-client.js
├── config/            # Configuration
│   └── settings.js
└── utils/             # Utilities
    └── file-handler.js
```

## Build Configuration
- **electron-builder.yml**: Detailed build settings
- **package.json**: Basic build configuration
- Icons required: `assets/icons/icon.ico`, `icon.icns`, `icon.png`

## Testing Strategy
- Unit tests for API client, config, and file handler
- Jest configured for Node.js environment
- Coverage excludes main and renderer processes (require Electron environment)

