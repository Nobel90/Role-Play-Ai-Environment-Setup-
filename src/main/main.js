/**
 * Electron Main Process
 * Entry point for the Electron application
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { fetchJson, uploadJson } = require('../api/jsonbin-client');
const { readJsonFile, writeJsonFile, validateJson } = require('../utils/file-handler');

let mainWindow;

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 450,
    title: 'VRC Character Updater',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    icon: (() => {
      const iconPath = path.join(__dirname, '../../assets/icons/icon.png');
      return fs.existsSync(iconPath) ? iconPath : undefined;
    })()
  });

  // Load the HTML file
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Handle fetch JSON request from renderer
 */
ipcMain.handle('fetch-json', async () => {
  try {
    const data = await fetchJson();
    return { success: true, data };
  } catch (error) {
    console.error('Fetch error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Handle upload JSON request from renderer
 */
ipcMain.handle('upload-json', async (event, jsonString) => {
  try {
    // Validate JSON before uploading
    const parsedData = validateJson(jsonString);
    const result = await uploadJson(parsedData);
    return { success: true, data: result };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Handle load from file request from renderer
 */
ipcMain.handle('load-from-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    const filePath = result.filePaths[0];
    const data = await readJsonFile(filePath);
    return { success: true, data };
  } catch (error) {
    console.error('Load file error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Handle save to file request from renderer
 */
ipcMain.handle('save-to-file', async (event, jsonString) => {
  try {
    // Validate JSON before saving
    const parsedData = validateJson(jsonString);
    
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      defaultPath: 'config.json'
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    const filePath = result.filePath;
    await writeJsonFile(filePath, parsedData, 4);
    return { success: true, filePath };
  } catch (error) {
    console.error('Save file error:', error);
    return { success: false, error: error.message };
  }
});

// App event handlers
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});

