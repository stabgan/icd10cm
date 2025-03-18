import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Ensure build directory exists
const buildDir = path.join(rootDir, 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

const iconDir = path.join(buildDir, 'icons');
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

console.log('Building ICD-10-CM Browser for Windows...');

try {
  // Step 1: Build the React application
  console.log('Building React app...');
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir });
  
  // Step 2: Generate icons if they don't exist
  if (!fs.existsSync(path.join(iconDir, 'icon.ico'))) {
    console.log('Generating icons...');
    try {
      execSync('npm run build:icons', { stdio: 'inherit', cwd: rootDir });
    } catch (error) {
      console.warn('Warning: Failed to generate icons. You may need to create them manually.');
      console.warn('Please place an icon.ico file in the build/icons directory.');
    }
  }
  
  // Step 3: Package the application
  console.log('Packaging for Windows...');
  execSync('npx electron-forge package --platform=win32 --arch=x64', { 
    stdio: 'inherit', 
    cwd: rootDir 
  });
  
  // Step 4: Create Windows installer
  console.log('Creating Windows installer...');
  execSync('npx electron-forge make --platform=win32 --arch=x64', { 
    stdio: 'inherit', 
    cwd: rootDir 
  });
  
  console.log('Build completed successfully!');
  console.log('Your installer can be found in the out/make/ directory.');
  
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
} 