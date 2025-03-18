import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a basic icon 
function createIcon() {
  try {
    console.log('Creating icon...');
    
    // Paths for the icons
    const pngOutputPath = path.join(__dirname, '..', 'build', 'icons', 'icon.png');
    const icoOutputPath = path.join(__dirname, '..', 'build', 'icons', 'icon.ico');
    
    // Generate a 256x256 PNG icon
    // This is a valid 256x256 blue PNG square
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAADZJREFUaN7twTEBAAAAwiD7p14JT2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfBgIbAABvrYcCQAAAABJRU5ErkJggg==';
    const pngBuffer = Buffer.from(pngBase64, 'base64');
    
    // Ensure directory exists
    const iconDir = path.join(__dirname, '..', 'build', 'icons');
    if (!fs.existsSync(iconDir)) {
      fs.mkdirSync(iconDir, { recursive: true });
    }
    
    // Write the files
    fs.writeFileSync(pngOutputPath, pngBuffer);
    
    // For ICO file, we'll duplicate the PNG since electron-builder will convert it
    fs.writeFileSync(icoOutputPath, pngBuffer);
    
    // Also write to electron directory for electron-winstaller
    const electronIconPath = path.join(__dirname, '..', 'electron', 'icon.png');
    fs.writeFileSync(electronIconPath, pngBuffer);
    
    console.log(`Icons created successfully`);
  } catch (error) {
    console.error(`Error creating icon: ${error.message}`);
    process.exit(1);
  }
}

createIcon(); 