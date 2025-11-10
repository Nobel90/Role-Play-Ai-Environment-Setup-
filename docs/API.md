# API Documentation

## JSONBin Integration

This application integrates with the [JSONBin.io](https://jsonbin.io/) API to store and retrieve JSON data.

### API Client

The API client is located in `src/api/jsonbin-client.js` and provides two main functions:

#### `fetchJson()`

Fetches JSON data from the configured JSONBin endpoint.

**Returns:** `Promise<Object>` - The JSON data from the bin

**Throws:** `Error` - If the request fails

**Example:**
```javascript
const { fetchJson } = require('./src/api/jsonbin-client');

try {
  const data = await fetchJson();
  console.log(data);
} catch (error) {
  console.error('Error fetching JSON:', error.message);
}
```

#### `uploadJson(data)`

Uploads JSON data to the configured JSONBin endpoint.

**Parameters:**
- `data` (Object) - The JSON data to upload

**Returns:** `Promise<Object>` - The response from the API

**Throws:** `Error` - If the upload fails

**Example:**
```javascript
const { uploadJson } = require('./src/api/jsonbin-client');

const data = { key: 'value' };

try {
  const result = await uploadJson(data);
  console.log('Upload successful:', result);
} catch (error) {
  console.error('Error uploading JSON:', error.message);
}
```

### Configuration

The API client uses configuration from `src/config/settings.js`. Configuration can be set via:

1. **Environment Variables** (highest priority)
   - `JSONBIN_URL` - The JSONBin API endpoint
   - `JSONBIN_MASTER_KEY` - The API master key
   - `API_TIMEOUT` - Request timeout in milliseconds

2. **Config File** - Located in the application's user data directory

3. **Default Values** - Hardcoded defaults (lowest priority)

### Error Handling

The API client provides detailed error messages:

- **HTTP Errors**: Includes status code and message from the server
- **Network Errors**: Indicates when no response was received
- **Request Errors**: Shows errors in setting up the request

### Timeout

Default timeout is 15 seconds. This can be configured via:
- Environment variable: `API_TIMEOUT`
- Config file: `TIMEOUT` property
- Default: 15000 milliseconds

## IPC Communication

The application uses Electron's IPC (Inter-Process Communication) for secure communication between the main and renderer processes.

### Main Process Handlers

#### `fetch-json`

Fetches JSON from the API.

**Returns:** `Promise<{success: boolean, data?: Object, error?: string}>`

#### `upload-json`

Uploads JSON to the API.

**Parameters:**
- `jsonString` (string) - JSON string to upload

**Returns:** `Promise<{success: boolean, data?: Object, error?: string}>`

#### `load-from-file`

Opens a file dialog and loads JSON from a selected file.

**Returns:** `Promise<{success: boolean, data?: Object, error?: string, canceled?: boolean}>`

#### `save-to-file`

Opens a save dialog and saves JSON to a selected file.

**Parameters:**
- `jsonString` (string) - JSON string to save

**Returns:** `Promise<{success: boolean, filePath?: string, error?: string, canceled?: boolean}>`

### Renderer Process API

The renderer process accesses these handlers through `window.electronAPI`:

```javascript
// Fetch JSON
const result = await window.electronAPI.fetchJson();

// Upload JSON
const result = await window.electronAPI.uploadJson(jsonString);

// Load from file
const result = await window.electronAPI.loadFromFile();

// Save to file
const result = await window.electronAPI.saveToFile(jsonString);
```

## File Handler Utilities

Located in `src/utils/file-handler.js`, provides utilities for JSON file operations:

- `readJsonFile(filePath)` - Read and parse JSON file
- `writeJsonFile(filePath, data, indent)` - Write JSON to file
- `validateJson(jsonString)` - Validate JSON string
- `formatJson(data, indent)` - Format JSON with indentation

