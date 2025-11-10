# Technical Context

## Technology Stack

### Core Technologies
- **Electron**: ^37.2.0 - Desktop application framework
- **Node.js**: v16+ required (v22.17.0 currently used)
- **JavaScript**: ES6+ (no TypeScript currently)

### Key Dependencies

#### Production
- **axios**: ^1.10.0 - HTTP client for API requests
- **electron**: ^37.2.0 - Core Electron framework
- **electron-builder**: ^26.0.0 - Application packaging and distribution

#### Development
- **jest**: ^29.7.0 - Testing framework

## Development Setup

### Prerequisites
```bash
Node.js >= 16.0.0
npm >= 7.0.0
```

### Installation
```bash
npm install
```

### Development Commands
```bash
npm start              # Run application in development mode
npm test               # Run unit tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate test coverage report
npm run build:win      # Build Windows executable
npm run build          # Build for all platforms
```

## Project Structure

```
Role-Play-Ai-Environment-Setup/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.js        # Entry point, window management, IPC handlers
│   │   └── preload.js     # Secure bridge between main and renderer
│   ├── renderer/          # Renderer process (UI)
│   │   ├── index.html     # Main HTML structure
│   │   ├── renderer.js    # UI logic and event handlers
│   │   └── styles.css     # Application styles (dark theme)
│   ├── api/               # API clients
│   │   └── jsonbin-client.js  # JSONBin.io API integration
│   ├── config/            # Configuration management
│   │   └── settings.js    # Config loading, env vars, defaults
│   └── utils/             # Utility functions
│       └── file-handler.js    # File operations, JSON validation
├── tests/                 # Test files
│   ├── unit/              # Unit tests
│   │   ├── api.test.js
│   │   ├── config.test.js
│   │   └── file-handler.test.js
│   └── e2e/               # End-to-end tests (future)
├── docs/                  # Documentation
│   ├── API.md             # API documentation
│   └── BUILD.md           # Build instructions
├── assets/                # Static assets
│   └── icons/             # Application icons
├── package.json           # Project configuration
├── electron-builder.yml   # Build configuration
├── jest.config.js         # Jest test configuration
└── README.md              # Project documentation
```

## Configuration

### Environment Variables
- `JSONBIN_URL` - JSONBin API endpoint
- `JSONBIN_MASTER_KEY` - API master key
- `API_TIMEOUT` - Request timeout (milliseconds)
- `NODE_ENV` - Set to 'development' to enable DevTools

### Config File Location
- **Windows**: `%APPDATA%/role-play-ai-environment-setup/config.json`
- **macOS**: `~/Library/Application Support/role-play-ai-environment-setup/config.json`
- **Linux**: `~/.config/role-play-ai-environment-setup/config.json`

### Default Configuration
Located in `src/config/settings.js`:
```javascript
{
  BIN_URL: 'https://api.jsonbin.io/v3/b/685483278a456b7966b15571',
  HEADERS: {
    'Content-Type': 'application/json',
    'X-Master-Key': '$2a$10$565nuvZV/Ei9YWxi8ccHeOlOdGnL8XpJMbFGn.ufl.I3QDw.cplBW'
  },
  TIMEOUT: 15000
}
```

## Build Configuration

### Electron Builder
- **App ID**: `com.role-play-ai.environment-setup`
- **Product Name**: `VRC Character Updater`
- **Output Directory**: `dist/`

### Windows Build
- **Target**: NSIS installer
- **Icon**: `assets/icons/icon.ico`
- **Features**: Desktop shortcut, Start menu shortcut, custom install directory

### Build Files
- `package.json` - Basic build configuration
- `electron-builder.yml` - Detailed build settings

## Security Considerations

### Electron Security
- **Context Isolation**: Enabled (prevents renderer from accessing Node.js)
- **Node Integration**: Disabled in renderer
- **Sandbox**: Disabled (needed for file operations)
- **Preload Script**: Secure IPC bridge

### API Security
- API keys stored in config (not in code repository)
- Environment variable support for sensitive data
- Config file in user data directory (not version controlled)

## Testing

### Test Framework
- **Jest**: Unit testing
- **Mocking**: axios, fs, electron modules
- **Coverage**: Focus on api, config, utils modules

### Test Structure
- Tests mirror source structure
- Unit tests in `tests/unit/`
- E2E tests in `tests/e2e/` (future)

## Dependencies Management

### Version Pinning
- Exact versions in package.json for stability
- Regular dependency updates recommended

### Known Dependencies
- All dependencies are production-ready
- No deprecated packages in core dependencies
- Some npm warnings during install (non-critical)

## Platform Support

### Currently Supported
- **Windows**: Primary target, fully supported
- **macOS**: Build configuration present, not tested
- **Linux**: Build configuration present, not tested

### Build Targets
- Windows: NSIS installer (.exe)
- macOS: DMG disk image
- Linux: AppImage

