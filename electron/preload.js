const { contextBridge, ipcRenderer } = require('electron');

// Expose validated IPC methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // File system operations
  openFile: () => ipcRenderer.invoke('open-file-dialog'),
  getFileStats: (filePath) => ipcRenderer.invoke('read-file-stats', filePath),
  readFileChunk: (options) => ipcRenderer.invoke('read-file-chunk', options),
  
  // Get app version
  getAppVersion: () => process.env.npm_package_version || '0.1.0',
  
  // Platform info
  getPlatformInfo: () => ({
    platform: process.platform,
    arch: process.arch
  })
}); 