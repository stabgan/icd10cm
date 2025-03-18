const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'out');

// Paths
const desktopPath = path.join(process.env.USERPROFILE, 'Desktop');
const appName = 'ICD-10-CM Browser';
const exeName = 'icd10cm-browser.exe';

// Find the executable
function findExecutable() {
  // Check different possible locations
  const possiblePaths = [
    path.join(outDir, `${appName}-win32-x64`, exeName),
    path.join(outDir, 'icd10cm-browser-win32-x64', exeName),
    path.join(outDir, 'make', 'squirrel.windows', 'x64', exeName)
  ];
  
  for (const execPath of possiblePaths) {
    if (fs.existsSync(execPath)) {
      return execPath;
    }
  }
  
  return null;
}

console.log('Creating Windows desktop shortcut...');

const execPath = findExecutable();
if (!execPath) {
  console.error('Error: Could not find application executable.');
  console.error('Make sure you have built the application first with npm run electron:make:windows');
  process.exit(1);
}

// Create a Windows Script Host file that creates a shortcut
const vbsPath = path.join(rootDir, 'CreateShortcut.vbs');
const vbsContent = `
Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = "${path.join(desktopPath, appName + '.lnk')}"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "${execPath.replace(/\\/g, '\\\\')}"
oLink.WorkingDirectory = "${path.dirname(execPath).replace(/\\/g, '\\\\')}"
oLink.Description = "ICD-10-CM Browser Desktop Application"
oLink.IconLocation = "${execPath.replace(/\\/g, '\\\\')}, 0"
oLink.Save
`;

fs.writeFileSync(vbsPath, vbsContent);

try {
  console.log('Running shortcut creation script...');
  execSync(`cscript //NoLogo "${vbsPath}"`, { stdio: 'inherit' });
  console.log(`Desktop shortcut created at: ${path.join(desktopPath, appName + '.lnk')}`);
} catch (error) {
  console.error('Error creating shortcut:', error.message);
} finally {
  // Clean up the VBS file
  if (fs.existsSync(vbsPath)) {
    fs.unlinkSync(vbsPath);
  }
} 