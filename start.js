import { spawn, exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MONGO_DATA_DIR = path.join('C:', 'Program Files', 'MongoDB', 'Server', '8.0', 'data');
const MONGO_PORT = 27017;
const SERVER_PORT = 5000;
const FRONTEND_PORT = 3000;

// We don't need to create mongo_data directory anymore since MongoDB service uses its own path
// if (!fs.existsSync(MONGO_DATA_DIR)) {
//   fs.mkdirSync(MONGO_DATA_DIR, { recursive: true });
//   console.log(`Created MongoDB data directory: ${MONGO_DATA_DIR}`);
// }

// Function to check if MongoDB is already running
function checkMongoDBRunning(callback) {
  const command = os.platform() === 'win32' 
    ? 'netstat -ano | findstr "LISTENING" | findstr "27017"'
    : 'lsof -i:27017';

  exec(command, (error, stdout) => {
    callback(!error && stdout.trim() !== '');
  });
}

// Start MongoDB
function startMongoDB() {
  return new Promise((resolve) => {
    checkMongoDBRunning((isRunning) => {
      if (isRunning) {
        console.log('MongoDB service is already running');
        resolve();
        return;
      }

      console.log('MongoDB service is not running...');
      
      if (os.platform() === 'win32') {
        console.log('Attempting to start MongoDB Windows service...');
        // Try to start MongoDB Windows service
        exec('net start MongoDB', (error, stdout, stderr) => {
          if (error) {
            console.error('\x1b[31m%s\x1b[0m', 'Could not start MongoDB service:');
            console.error('\x1b[33m%s\x1b[0m', stderr || error.message);
            console.log('The application will continue, but database operations may fail.');
            console.log('Check that MongoDB is installed as a Windows service.');
          } else {
            console.log('MongoDB service started successfully');
          }
          resolve();
        });
      } else {
        // For non-Windows platforms
        console.log('You need to start MongoDB manually on this platform.');
        console.log('The application will continue, but database operations may fail.');
        resolve();
      }
    });
  });
}

// Start the backend server
function startBackend() {
  console.log('Starting backend server...');
  const server = spawn('node', ['server.js'], {
    stdio: 'inherit'
  });

  server.on('error', (error) => {
    console.error(`Failed to start backend: ${error.message}`);
  });

  return server;
}

// Start the frontend development server
function startFrontend() {
  console.log('Starting frontend development server...');
  
  // Use full path to npm to avoid ENOENT errors
  const npmCmd = os.platform() === 'win32' ? 'npm.cmd' : 'npm';
  
  const frontend = spawn(npmCmd, ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });

  frontend.on('error', (error) => {
    console.error(`Failed to start frontend: ${error.message}`);
    console.error('Make sure Node.js and npm are correctly installed and in your PATH');
  });

  return frontend;
}

// Main function to start everything
async function startAll() {
  try {
    console.log('Starting ICD-10-CM Browser with Server Backend...');
    
    // Start MongoDB first
    await startMongoDB();
    
    // Then start the backend
    const server = startBackend();
    
    // Wait a bit for the backend to initialize
    setTimeout(() => {
      // Then start the frontend
      const frontend = startFrontend();
      
      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('Shutting down all services...');
        frontend.kill();
        server.kill();
        process.exit(0);
      });
    }, 2000);
    
  } catch (error) {
    console.error(`Failed to start: ${error.message}`);
    process.exit(1);
  }
}

// Run the application
startAll(); 