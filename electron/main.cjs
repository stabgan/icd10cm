const { app, BrowserWindow, dialog, ipcMain, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';
let mainWindow;
let serverProcess;

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Set up protocol to serve local files
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
]);

async function startServer() {
  console.log('Starting server process...');
  
  // Determine the correct path to server.js
  const serverPath = isDev 
    ? path.join(process.cwd(), 'server.js')
    : path.join(process.resourcesPath, 'app', 'server.js');
  
  // Check if server.js exists
  if (!fs.existsSync(serverPath)) {
    console.error(`Server file not found at: ${serverPath}`);
    dialog.showErrorBox(
      'Server Error',
      `Could not find server file at: ${serverPath}`
    );
    return null;
  }
  
  // Start server process
  serverProcess = spawn('node', [serverPath], {
    stdio: 'pipe',
    windowsHide: true
  });
  
  // Log server output
  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
  });
  
  serverProcess.on('error', (error) => {
    console.error(`Failed to start server process: ${error}`);
    dialog.showErrorBox(
      'Server Error',
      `Failed to start server process: ${error.message}`
    );
  });
  
  // Wait for server to start
  return new Promise((resolve) => {
    // Check if server is running every 500ms
    const interval = setInterval(() => {
      const request = require('http').request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/check-data',
        method: 'GET'
      }, (response) => {
        clearInterval(interval);
        console.log('Server is running');
        resolve(true);
      });
      
      request.on('error', (err) => {
        // Still waiting for server
      });
      
      request.end();
    }, 500);
    
    // Timeout after 30 seconds
    setTimeout(() => {
      clearInterval(interval);
      console.log('Server started or timed out');
      resolve(true);
    }, 30000);
  });
}

// Create main browser window
async function createWindow() {
  // Start server first
  await startServer();
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    },
    icon: path.join(__dirname, 'icon.png'),
    title: 'ICD-10-CM Browser',
    backgroundColor: '#f5f5f5'
  });
  
  // Set up loading UI
  mainWindow.webContents.on('did-start-loading', () => {
    mainWindow.setTitle('ICD-10-CM Browser (Loading...)');
  });
  
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.setTitle('ICD-10-CM Browser');
  });
  
  // Load app
  if (isDev) {
    await mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
  
  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App ready event
app.on('ready', async () => {
  createWindow();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Clean up on app quit
app.on('quit', () => {
  console.log('Terminating server process...');
  if (serverProcess) {
    if (process.platform === 'win32') {
      // On Windows, we need to kill the process group
      spawn('taskkill', ['/pid', serverProcess.pid, '/f', '/t']);
    } else {
      // On Unix, we can kill the process
      serverProcess.kill();
    }
  }
});

// IPC handlers for file operations
ipcMain.handle('open-file', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select ICD-10-CM Data File',
    properties: ['openFile'],
    filters: [
      { name: 'JSON Lines', extensions: ['jsonl', 'json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (canceled) {
    return null;
  }
  
  return filePaths[0];
});

ipcMain.handle('get-file-stats', async (event, filePath) => {
  const stats = fs.statSync(filePath);
  return {
    size: stats.size,
    created: stats.birthtime,
    modified: stats.mtime
  };
});

ipcMain.handle('read-file-as-blob', async (event, filePath) => {
  return fs.readFileSync(filePath).buffer;
}); 