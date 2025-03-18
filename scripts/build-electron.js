import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory (ES module equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Execute a command and print the output
 */
function exec(command, options = {}) {
  console.log(`${colors.bright}${colors.blue}> ${command}${colors.reset}`);
  try {
    return execSync(command, {
      stdio: 'inherit',
      ...options,
    });
  } catch (error) {
    console.error(`${colors.red}Error executing command: ${command}${colors.reset}`);
    throw error;
  }
}

/**
 * Build the Electron app
 */
async function buildElectronApp() {
  try {
    console.log(`\n${colors.green}${colors.bright}============================================${colors.reset}`);
    console.log(`${colors.green}${colors.bright}  Building Electron App for Windows 64-bit  ${colors.reset}`);
    console.log(`${colors.green}${colors.bright}============================================${colors.reset}\n`);

    // Step 1: Build React app
    console.log(`\n${colors.cyan}${colors.bright}Step 1: Building React application${colors.reset}\n`);
    exec('npm run build -- --mode electron');

    // Step 2: Ensure Electron directories exist
    console.log(`\n${colors.cyan}${colors.bright}Step 2: Preparing Electron build directories${colors.reset}\n`);
    
    // Create release directory if it doesn't exist
    if (!fs.existsSync(path.join(__dirname, '../release'))) {
      fs.mkdirSync(path.join(__dirname, '../release'), { recursive: true });
    }

    // Step 3: Build Electron package
    console.log(`\n${colors.cyan}${colors.bright}Step 3: Building Electron package${colors.reset}\n`);
    exec('npx electron-builder build --win --x64');

    console.log(`\n${colors.green}${colors.bright}============================================${colors.reset}`);
    console.log(`${colors.green}${colors.bright}  Electron App Build Complete!  ${colors.reset}`);
    console.log(`${colors.green}${colors.bright}============================================${colors.reset}\n`);
    
    console.log(`${colors.yellow}The installer can be found in the ${colors.bright}release${colors.reset}${colors.yellow} directory.${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}${colors.bright}Error building Electron app:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the build process
buildElectronApp(); 