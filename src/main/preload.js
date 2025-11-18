/**
 * Preload script
 * Provides secure bridge between main and renderer processes
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // API operations
  fetchJson: () => ipcRenderer.invoke('fetch-json'),
  uploadJson: (data) => ipcRenderer.invoke('upload-json', data),
  
  // File operations
  loadFromFile: () => ipcRenderer.invoke('load-from-file'),
  saveToFile: (data) => ipcRenderer.invoke('save-to-file', data),
  
  // Custom portable updater APIs
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: (downloadUrl, fileName) => ipcRenderer.invoke('download-update', downloadUrl, fileName),
  openDownloadsFolder: () => ipcRenderer.invoke('open-downloads-folder'),
  installAndRestart: (newExePath) => ipcRenderer.invoke('install-and-restart', newExePath),
  
  // Update event listeners
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (event, info) => callback(info)),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, progress) => callback(progress)),
  
  // Remove listeners
  removeUpdateListeners: () => {
    ipcRenderer.removeAllListeners('update-available');
    ipcRenderer.removeAllListeners('download-progress');
  },
  
  // Error handling
  onError: (callback) => ipcRenderer.on('error', (event, error) => callback(error)),
  onSuccess: (callback) => ipcRenderer.on('success', (event, message) => callback(message))
});

