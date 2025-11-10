# System Patterns

## Architecture Overview

### Electron Architecture
The application follows Electron's standard architecture with clear separation between main and renderer processes:

```
┌─────────────────────────────────────┐
│         Main Process                │
│  (Node.js, Full System Access)      │
│  - Window Management                │
│  - IPC Handlers                     │
│  - File System Operations           │
│  - API Calls                        │
└──────────────┬──────────────────────┘
               │ IPC (Inter-Process Communication)
               │ via contextBridge
┌──────────────▼──────────────────────┐
│       Renderer Process              │
│  (Browser-like, Sandboxed)          │
│  - UI Rendering                     │
│  - User Interactions                │
│  - DOM Manipulation                 │
└─────────────────────────────────────┘
```

## Key Design Patterns

### 1. Module Separation
Code is organized into logical modules:
- **api/**: API client logic (JSONBin integration)
- **config/**: Configuration management
- **utils/**: Utility functions (file handling, JSON formatting)
- **main/**: Electron main process
- **renderer/**: UI and renderer process logic

### 2. IPC Communication Pattern
Secure communication between processes using contextBridge:

**Main Process** → **Preload** → **Renderer**
- Main process exposes handlers via `ipcMain.handle()`
- Preload script uses `contextBridge.exposeInMainWorld()`
- Renderer accesses via `window.electronAPI`

**Example Flow:**
```
Renderer: window.electronAPI.fetchJson()
  ↓
Preload: ipcRenderer.invoke('fetch-json')
  ↓
Main: ipcMain.handle('fetch-json', async () => {...})
```

### 3. Configuration Management Pattern
Three-tier configuration priority:
1. **Environment Variables** (highest priority)
2. **Config File** (user data directory)
3. **Default Values** (hardcoded fallback)

### 4. Error Handling Pattern
- API errors: Detailed error messages with HTTP status codes
- Network errors: User-friendly messages
- Validation errors: Specific JSON parsing errors
- UI feedback: Status messages with success/error states

### 5. Security Pattern
- **Context Isolation**: Enabled (renderer cannot access Node.js directly)
- **Node Integration**: Disabled in renderer
- **Preload Script**: Secure bridge between processes
- **CSP**: Content Security Policy in HTML

## Component Relationships

### Main Process Components
```
main.js
  ├── createWindow() → BrowserWindow
  ├── IPC Handlers:
  │   ├── fetch-json → jsonbin-client.fetchJson()
  │   ├── upload-json → jsonbin-client.uploadJson()
  │   └── load-from-file → file-handler.readJsonFile()
  └── Event Handlers (app lifecycle)
```

### Renderer Process Components
```
index.html (UI Structure)
  ├── renderer.js (Logic)
  │   ├── UI Event Handlers
  │   ├── IPC Communication
  │   └── JSON Formatting
  └── styles.css (Styling)
```

### API Client Pattern
```
jsonbin-client.js
  ├── fetchJson() → axios.get()
  ├── uploadJson() → axios.put()
  └── Error Handling → Detailed error messages
```

## Data Flow

### Fetch JSON Flow
```
User clicks "Reload" 
  → renderer.js: handleFetchJson()
  → window.electronAPI.fetchJson()
  → main.js: ipcMain.handle('fetch-json')
  → jsonbin-client.js: fetchJson()
  → JSONBin API
  → Response → Main → Renderer
  → displayJson() → Update UI
```

### Upload JSON Flow
```
User clicks "Upload"
  → renderer.js: validate JSON
  → window.electronAPI.uploadJson(jsonString)
  → main.js: ipcMain.handle('upload-json')
  → file-handler.js: validateJson()
  → jsonbin-client.js: uploadJson()
  → JSONBin API
  → Response → Main → Renderer
  → showStatus() → User feedback
```

## File Structure Pattern
```
src/
  ├── main/           # Main process (Node.js)
  ├── renderer/       # Renderer process (Browser)
  ├── api/            # API clients
  ├── config/         # Configuration
  └── utils/          # Utilities
```

## Testing Pattern
- **Unit Tests**: Test individual modules in isolation
- **Mocking**: Mock external dependencies (axios, fs, electron)
- **Test Structure**: Mirror source structure in tests/
- **Coverage**: Focus on business logic (api, config, utils)

