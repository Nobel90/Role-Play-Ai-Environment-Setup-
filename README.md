# VRC Character Updater

An Electron desktop application for managing JSON configuration data through the JSONBin.io API. This application provides a user-friendly interface to fetch, edit, and upload JSON data to a remote JSONBin storage.

## Features

- 🔄 **Fetch JSON** - Load JSON data from JSONBin API
- ✏️ **Edit JSON** - Edit JSON data in a formatted text editor
- 💾 **Load from File** - Import JSON from local files
- 💾 **Save to File** - Export JSON to local files
- ⬆️ **Upload to JSONBin** - Save changes back to JSONBin API
- 🎨 **Dark Theme** - Modern dark UI matching ttkbootstrap darkly style
- ✅ **JSON Validation** - Automatic validation before upload and save

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Nobel90/Role-Play-Ai-Environment-Setup-.git
cd Role-Play-Ai-Environment-Setup-
```

2. Install dependencies:
```bash
npm install
```

## Development

### Running the Application

Start the application in development mode:

```bash
npm start
```

### Running Tests

Run unit tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

Watch mode for tests:

```bash
npm run test:watch
```

## Building

### Build for Windows

Build a Windows installer:

```bash
npm run build:win
```

The installer will be created in the `dist` directory.

### Build for All Platforms

Build for all platforms:

```bash
npm run build
```

## Configuration

### Environment Variables

You can configure the application using environment variables:

- `JSONBIN_URL` - JSONBin API endpoint URL
- `JSONBIN_MASTER_KEY` - JSONBin API master key
- `API_TIMEOUT` - Request timeout in milliseconds (default: 15000)

### Config File

The application also supports a configuration file located at:
- Windows: `%APPDATA%/role-play-ai-environment-setup/config.json`
- macOS: `~/Library/Application Support/role-play-ai-environment-setup/config.json`
- Linux: `~/.config/role-play-ai-environment-setup/config.json`

Example `config.json`:
```json
{
  "BIN_URL": "https://api.jsonbin.io/v3/b/your-bin-id",
  "HEADERS": {
    "Content-Type": "application/json",
    "X-Master-Key": "your-master-key"
  },
  "TIMEOUT": 15000
}
```

**Priority Order:**
1. Environment variables (highest priority)
2. Config file
3. Default values (lowest priority)

## Project Structure

```
Role-Play-Ai-Environment-Setup/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.js        # Main entry point
│   │   └── preload.js     # Preload script
│   ├── renderer/          # Renderer process (UI)
│   │   ├── index.html     # Main HTML
│   │   ├── renderer.js    # Renderer logic
│   │   └── styles.css     # Application styles
│   ├── api/               # API client
│   │   └── jsonbin-client.js
│   ├── config/            # Configuration
│   │   └── settings.js
│   └── utils/             # Utilities
│       └── file-handler.js
├── tests/                 # Test files
│   └── unit/
├── docs/                  # Documentation
├── assets/                # Assets (icons, etc.)
└── dist/                  # Build output
```

## Usage

1. **Launch the application** - The app will automatically fetch JSON from the configured JSONBin endpoint
2. **Edit JSON** - Modify the JSON data in the text editor
3. **Load from File** - Click "Load from File" to import JSON from a local file
4. **Save to File** - Click "Save to File" to export JSON to a local file
5. **Upload** - Click "Upload to JSONBin" to save your changes to the remote storage
6. **Reload** - Click "Reload JSON" to fetch the latest data from the server

## Security

- The application uses Electron's context isolation for security
- Node.js integration is disabled in the renderer process
- API keys should be stored securely (use environment variables or config file outside of version control)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

## Author

Nobel90

## Support

For issues and questions, please open an issue on [GitHub](https://github.com/Nobel90/Role-Play-Ai-Environment-Setup-/issues).

