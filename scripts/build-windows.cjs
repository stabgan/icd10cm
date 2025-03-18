const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// Ensure all required directories exist
const buildDir = path.join(rootDir, 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

const outDir = path.join(rootDir, 'out');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Building ICD-10-CM Browser for Windows...');

try {
  // Step 1: Build the React application
  console.log('Building React app...');
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir });
  
  // Step 2: Use a simplified packaging command without icon dependencies
  console.log('Packaging for Windows...');
  const packagerCmd = 'npx --yes electron-packager . ' + 
                      'icd10cm-browser ' +
                      '--platform=win32 ' +
                      '--arch=x64 ' + 
                      '--out=out ' + 
                      '--asar ' +
                      '--overwrite ' +
                      '--app-copyright="Copyright © 2023 Kaustabh"';
  
  // Using PowerShell to execute the command as recommended in Electron docs
  const powerShellCmd = `powershell -Command "${packagerCmd}"`;
  
  try {
    execSync(powerShellCmd, { 
      stdio: 'inherit', 
      cwd: rootDir 
    });
  } catch (err) {
    // Fallback to direct command if PowerShell fails
    console.log('PowerShell execution failed, trying direct command...');
    execSync(packagerCmd, { 
      stdio: 'inherit', 
      cwd: rootDir 
    });
  }
  
  // Create a basic ZIP package of the output
  console.log('Creating a ZIP package...');
  try {
    const zipCmd = 'powershell -Command "Compress-Archive -Path \'./out/icd10cm-browser-win32-x64\' -DestinationPath \'./out/ICD-10-CM-Browser-Windows.zip\' -Force"';
    execSync(zipCmd, {
      stdio: 'inherit',
      cwd: rootDir
    });
    console.log('ZIP package created successfully at ./out/ICD-10-CM-Browser-Windows.zip');
  } catch (zipError) {
    console.warn('Warning: Could not create ZIP package:', zipError.message);
  }
  
  console.log('Build completed successfully!');
  console.log('Your packaged app can be found in the out/icd10cm-browser-win32-x64 directory.');
  
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
} 