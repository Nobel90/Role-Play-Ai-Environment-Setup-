/**
 * Electron Main Process
 * Entry point for the Electron application
 */

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { fetchJson, uploadJson } = require('../api/jsonbin-client');
const { readJsonFile, writeJsonFile, validateJson } = require('../utils/file-handler');
const { checkForUpdates, downloadUpdate } = require('../utils/portable-updater');

let mainWindow;

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 880,
    minWidth: 1280,
    minHeight: 880,
    title: 'VRC Character Updater',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    icon: (() => {
      const iconPath = path.join(__dirname, '../../assets/icons/icon-white_s.ico');
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

// Custom portable updater IPC handlers
ipcMain.handle('check-for-updates', async () => {
  if (!app.isPackaged) {
    return { success: false, error: 'Update checker is only available in production builds' };
  }
  try {
    const updateInfo = await checkForUpdates();
    return { success: true, updateInfo };
  } catch (error) {
    console.error('Update check error:', error);
    return { success: false, error: error.message };
  }
});

// IPC handler for downloading update
ipcMain.handle('download-update', async (event, downloadUrl, fileName = null) => {
  if (!app.isPackaged) {
    return { success: false, error: 'Download is only available in production builds' };
  }
  
  try {
    const onProgress = (progress) => {
      if (mainWindow) {
        mainWindow.webContents.send('download-progress', progress);
      }
    };

    const result = await downloadUpdate(downloadUrl, onProgress, 0, fileName);
    return { success: true, ...result };
  } catch (error) {
    console.error('Download error:', error);
    return { success: false, error: error.message };
  }
});

// IPC handler to open downloads folder
ipcMain.handle('open-downloads-folder', () => {
  const downloadsPath = app.getPath('downloads');
  shell.openPath(downloadsPath);
  return { success: true, path: downloadsPath };
});

// App event handlers
app.whenReady().then(() => {
  createWindow();

  // Check for updates after a short delay (only in production)
  if (app.isPackaged) {
    setTimeout(async () => {
      try {
        console.log('Checking for updates...');
        const updateInfo = await checkForUpdates();
        console.log('Update check result:', updateInfo);
        if (updateInfo.hasUpdate && mainWindow) {
          console.log('Update available! Sending to renderer...');
          mainWindow.webContents.send('update-available', updateInfo);
        } else {
          console.log('No update available. Current:', updateInfo.currentVersion, 'Latest:', updateInfo.latestVersion);
        }
      } catch (error) {
        console.error('Background update check failed:', error);
        // Show error to user in development, but silently fail in production
        if (mainWindow && process.env.NODE_ENV === 'development') {
          mainWindow.webContents.send('update-error', error.message);
        }
      }
    }, 3000);
  }

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

