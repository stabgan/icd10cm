import { spawn, exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SERVER_PORT = 5000;
const FRONTEND_PORT = 3000;

// Function to check if MongoDB is already running
function checkMongoDBRunning(callback) {
  const command = os.platform() === 'win32' 
    ? 'netstat -ano | findstr "LISTENING" | findstr "27017"'
    : 'lsof -i:27017';

  exec(command, (error, stdout) => {
    callback(!error && stdout.trim() !== '');
  });
}

// Create a promise-based version of the check
function isMongoDBRunning() {
  return new Promise((resolve) => {
    checkMongoDBRunning(isRunning => {
      resolve(isRunning);
    });
  });
}

// Function to start Express server
function startExpressServer() {
  console.log('Starting Express server...');
  const serverProcess = spawn('node', ['server.js'], {
    stdio: 'inherit'
  });
  
  serverProcess.on('error', (error) => {
    console.error('Failed to start Express server:', error);
    process.exit(1);
  });
  
  return serverProcess;
}

// Function to start frontend dev server
function startFrontendDevServer() {
  console.log('Starting frontend development server...');
  const npmCmd = os.platform() === 'win32' ? 'npm.cmd' : 'npm';
  const frontendProcess = spawn(npmCmd, ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  frontendProcess.on('error', (error) => {
    console.error('Failed to start frontend server:', error);
  });
  
  return frontendProcess;
}

// Main function
async function main() {
  console.log('Starting ICD-10-CM Browser application...');
  
  // Check MongoDB
  const mongoRunning = await isMongoDBRunning();
  if (!mongoRunning) {
    console.warn('\x1b[33mWARNING: MongoDB does not appear to be running!\x1b[0m');
    console.warn('\x1b[33mPlease ensure MongoDB is installed and running on port 27017\x1b[0m');
    console.warn('\x1b[33mOn Windows, check services.msc for MongoDB Service\x1b[0m');
    console.warn('\x1b[33mOn macOS/Linux, run: sudo systemctl start mongodb\x1b[0m');
    console.warn('\x1b[33mContinuing anyway, but the application may not work correctly...\x1b[0m\n');
  } else {
    console.log('\x1b[32mMongoDB is running. Good!\x1b[0m');
  }
  
  // Start Express server
  const serverProcess = startExpressServer();
  
  // Start frontend dev server
  const frontendProcess = startFrontendDevServer();
  
  // Handle application shutdown
  const cleanup = () => {
    console.log('\nShutting down...');
    
    if (serverProcess) {
      serverProcess.kill();
    }
    
    if (frontendProcess) {
      frontendProcess.kill();
    }
    
    process.exit(0);
  };
  
  // Handle process termination
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

// Run the main function
main().catch(error => {
  console.error('Error starting application:', error);
  process.exit(1);
}); 