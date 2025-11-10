# System Patterns

## Architecture
The application follows Electron's standard architecture:
- **Main Process** (`src/main/main.js`): Handles window creation, IPC handlers, file operations
- **Renderer Process** (`src/renderer/`): UI and user interactions
- **Preload Script** (`src/main/preload.js`): Secure bridge between main and renderer

## Key Technical Decisions

### IPC Communication
- Uses `ipcMain.handle()` and `ipcRenderer.invoke()` for async communication
- All IPC handlers return `{success: boolean, data?: Object, error?: string}` format
- Context isolation enabled, Node.js integration disabled in renderer

### Configuration Management
- Priority order: Environment variables > Config file > Default values
- Config file location: User data directory (platform-specific)
- Default config includes hardcoded JSONBin URL and API key

### API Client
- Uses axios for HTTP requests
- Centralized in `src/api/jsonbin-client.js`
- Handles errors with detailed messages
- 15-second timeout by default

### File Operations
- Uses Node.js fs.promises for async file operations
- JSON validation before operations
- Error handling with user-friendly messages

## Design Patterns

### Error Handling
- Try-catch blocks in all async operations
- User-friendly error messages
- Status messages displayed to user

### Status Feedback
- Status messages shown in top-right corner
- Auto-hide after 3 seconds
- Color-coded (success/error)

### Button States
- Disabled during operations
- Loading text shown during operations
- Re-enabled after completion

## Component Relationships
```
main.js
  ├── Creates BrowserWindow
  ├── Sets up IPC handlers
  │   ├── fetch-json → jsonbin-client.fetchJson()
  │   ├── upload-json → jsonbin-client.uploadJson()
  │   └── load-from-file → file-handler.readJsonFile()
  └── Loads preload.js

preload.js
  └── Exposes electronAPI to renderer

renderer.js
  ├── Handles UI interactions
  ├── Calls electronAPI methods
  └── Updates UI based on responses

jsonbin-client.js
  ├── Uses settings.getConfig()
  └── Makes axios requests

settings.js
  └── Manages configuration (env vars, file, defaults)
```

