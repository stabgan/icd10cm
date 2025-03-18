const { contextBridge, ipcRenderer } = require('electron');

// Expose safe functionality to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  openFile: () => ipcRenderer.invoke('open-file'),
  getFileStats: (filePath) => ipcRenderer.invoke('get-file-stats', filePath),
  readFileAsBlob: (filePath) => ipcRenderer.invoke('read-file-as-blob', filePath),
  
  // App info
  isElectron: true,
  appVersion: process.env.npm_package_version || 'dev'
}); 