const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure build directory exists (this is where electron-builder looks for icons by default)
const buildDir = path.resolve(__dirname, '../build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Check if SVG exists
const svgPath = path.resolve(__dirname, '../public/icon.svg');
if (!fs.existsSync(svgPath)) {
  console.error(`Error: SVG file not found at ${svgPath}`);
  process.exit(1);
}

// Copy SVG to build directory
fs.copyFileSync(svgPath, path.resolve(buildDir, 'icon.svg'));
console.log(`Copied SVG to ${path.resolve(buildDir, 'icon.svg')}`);

// Create public/icons directory for runtime icons
const publicIconsDir = path.resolve(__dirname, '../public/icons');
if (!fs.existsSync(publicIconsDir)) {
  fs.mkdirSync(publicIconsDir, { recursive: true });
}

// Create a base64-encoded 256x256 blue square PNG
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDIgNzkuMTY0NDYwLCAyMDIwLzA1LzEyLTE2OjA0OjE3ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjEuMiAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTEyLTIwVDE2OjQ5OjI3LTA2OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMC0xMi0yMFQxNjo1MjoxNC0wNjowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0xMi0yMFQxNjo1MjoxNC0wNjowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5YzhjMjUzZi04NGQ2LWQ0NDYtODgyOS0xY2FkZGYzZWM5YjgiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OWM4YzI1M2YtODRkNi1kNDQ2LTg4MjktMWNhZGRmM2VjOWI4IiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6OWM4YzI1M2YtODRkNi1kNDQ2LTg4MjktMWNhZGRmM2VjOWI4Ij4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo5YzhjMjUzZi04NGQ2LWQ0NDYtODgyOS0xY2FkZGYzZWM5YjgiIHN0RXZ0OndoZW49IjIwMjAtMTItMjBUMTY6NDk6MjctMDY6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMS4yIChXaW5kb3dzKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5ZxDQvAAAC0ElEQVR42u3UsQkAMAwDQXf/oe3SJRgU7gJpDvTQGjPv7gQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhDArwIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQwK8CEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEI4K0ABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEMCvAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCOCtAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhDArwIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQjgrQAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQwK8CEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEI4K0ABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEMCvAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCOCtAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAvgEXnFw9qT53REAAAAASUVORK5CYII=';

try {
  console.log('Creating icon files...');
  
  // 1. Try to download a good ICO file
  try {
    const downloadIconCommand = 'curl -L https://raw.githubusercontent.com/electron/electron/main/shell/browser/resources/win/electron.ico -o ' + path.resolve(buildDir, 'icon.ico');
    execSync(downloadIconCommand, { stdio: 'inherit' });
    console.log(`Downloaded valid icon to ${path.resolve(buildDir, 'icon.ico')}`);
    
    // Copy to public icons too
    fs.copyFileSync(path.resolve(buildDir, 'icon.ico'), path.resolve(publicIconsDir, 'icon.ico'));
    console.log(`Copied icon to ${path.resolve(publicIconsDir, 'icon.ico')}`);
  } catch (error) {
    console.error('Error downloading ICO file:', error);
  }
  
  // 2. Create PNG from base64
  const pngBuffer = Buffer.from(pngBase64, 'base64');
  fs.writeFileSync(path.resolve(buildDir, 'icon.png'), pngBuffer);
  console.log(`Created valid PNG icon at ${path.resolve(buildDir, 'icon.png')}`);
  
  // Copy to public icons too
  fs.writeFileSync(path.resolve(publicIconsDir, 'icon.png'), pngBuffer);
  console.log(`Created valid PNG icon at ${path.resolve(publicIconsDir, 'icon.png')}`);
  
} catch (error) {
  console.error('Error creating icon files:', error);
  console.log('Falling back to placeholder icons...');
  
  // Write a text file explaining the issue
  fs.writeFileSync(path.resolve(buildDir, 'ICON_ERROR.txt'), 
    'Failed to create proper icon files. Please manually add icon.ico (256x256) to the build directory.');
  process.exit(1);
}

console.log('Icon generation complete!'); 