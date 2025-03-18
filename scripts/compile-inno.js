import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const innoSetupPath = 'C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe';
const altInnoSetupPath = 'C:\\Program Files\\Inno Setup 6\\ISCC.exe';
const scriptPath = path.join(__dirname, 'windows-installer.iss');

console.log('Attempting to build Inno Setup installer...');

if (!fs.existsSync(scriptPath)) {
  console.error('Error: Inno Setup script not found at', scriptPath);
  process.exit(1);
}

// Check if Inno Setup is installed
let innoCompilerPath = '';
if (fs.existsSync(innoSetupPath)) {
  innoCompilerPath = innoSetupPath;
} else if (fs.existsSync(altInnoSetupPath)) {
  innoCompilerPath = altInnoSetupPath;
}

if (!innoCompilerPath) {
  console.error('Error: Inno Setup compiler not found. Please install Inno Setup 6 or later.');
  console.error('You can download it from: https://jrsoftware.org/isdl.php');
  process.exit(1);
}

try {
  // Make sure the output directory exists
  const outputDir = path.join(rootDir, 'out', 'make');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Running Inno Setup compiler...');
  execSync(`"${innoCompilerPath}" "${scriptPath}"`, { 
    stdio: 'inherit', 
    cwd: rootDir 
  });
  
  console.log('Inno Setup installer created successfully!');
  console.log(`Installer can be found at: ${path.join(outputDir, 'ICD-10-CM-Browser-Setup.exe')}`);
  
} catch (error) {
  console.error('Error creating Inno Setup installer:', error.message);
  process.exit(1);
} 