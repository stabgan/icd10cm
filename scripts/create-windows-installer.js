import { createWindowsInstaller } from 'electron-winstaller';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The directory where the packaged application is located
const outPath = path.join(__dirname, '..', 'out');
const installerPath = path.join(outPath, 'windows-installer');

// Create installer directory if it doesn't exist
if (!fs.existsSync(installerPath)) {
  fs.mkdirSync(installerPath, { recursive: true });
}

// Add delay function to avoid file locks
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function build() {
  try {
    console.log('Waiting for files to be available...');
    await delay(2000);
    
    console.log('Creating Windows installer...');
    
    // Simplified configuration without icon references
    await createWindowsInstaller({
      appDirectory: path.join(outPath, 'icd10cm-browser-win32-x64'),
      outputDirectory: installerPath,
      authors: 'Kaustabh',
      exe: 'icd10cm-browser.exe',
      description: 'ICD-10-CM Browser Desktop Application',
      title: 'ICD-10-CM Browser',
      name: 'ICD10CMBrowser',
      noMsi: true
    });

    console.log(`Windows installer created successfully in ${installerPath}`);
  } catch (error) {
    console.error(`Error creating Windows installer: ${error.message}`);
    process.exit(1);
  }
}

build(); 