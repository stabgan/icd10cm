const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const serve = require('electron-serve');
const Store = require('electron-store');

// Setup persistent storage
const store = new Store();

// Setup loading of production build from dist folder
const loadURL = serve({ directory: 'dist' });

// Check if running in development or production
const isDev = !app.isPackaged;

// Create main window
function createMainWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    // Set app icon
    icon: path.join(process.resourcesPath, 'icon.ico'),
  });

  // Load either dev server or production build
  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    loadURL(win);
  }

  return win;
}

// App ready event
app.whenReady().then(() => {
  const mainWindow = createMainWindow();

  // Register IPC handlers
  setupIpcHandlers(mainWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Quit app when all windows closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Setup IPC handlers for communication with renderer
function setupIpcHandlers(mainWindow) {
  // Handle file open dialog
  ipcMain.handle('open-file-dialog', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Select JSONL File',
      filters: [
        { name: 'JSONL Files', extensions: ['jsonl'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (canceled) {
      return null;
    }

    return filePaths[0];
  });

  // Handle reading file in chunks for streaming
  ipcMain.handle('read-file-stats', async (_, filePath) => {
    try {
      const stats = fs.statSync(filePath);
      return { size: stats.size, path: filePath };
    } catch (error) {
      console.error('Error getting file stats:', error);
      throw error;
    }
  });

  // Handle reading a chunk of the file
  ipcMain.handle('read-file-chunk', async (_, { filePath, start, end }) => {
    try {
      return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(filePath, { start, end });
        let data = '';

        stream.on('data', (chunk) => {
          data += chunk.toString();
        });

        stream.on('end', () => {
          resolve(data);
        });

        stream.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error reading file chunk:', error);
      throw error;
    }
  });
} 