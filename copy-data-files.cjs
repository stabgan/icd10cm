const fs = require('fs-extra');
const path = require('path');

console.log('Starting data files copy process...');

// Ensure target directories exist
fs.ensureDirSync(path.join(__dirname, 'dist', 'data'));
fs.ensureDirSync(path.join(__dirname, 'dist', 'data', 'chunks'));

// Copy data files manually
try {
  // Copy index.json and search-index.json
  fs.copySync(
    path.join(__dirname, 'public', 'data', 'index.json'),
    path.join(__dirname, 'dist', 'data', 'index.json')
  );
  console.log('✓ Copied index.json');

  fs.copySync(
    path.join(__dirname, 'public', 'data', 'search-index.json'),
    path.join(__dirname, 'dist', 'data', 'search-index.json')
  );
  console.log('✓ Copied search-index.json');

  // Copy all chunk files
  const chunksDir = path.join(__dirname, 'public', 'data', 'chunks');
  const files = fs.readdirSync(chunksDir);
  
  console.log(`Found ${files.length} chunk files to copy...`);
  
  files.forEach(file => {
    if (file.endsWith('.json')) {
      fs.copySync(
        path.join(chunksDir, file),
        path.join(__dirname, 'dist', 'data', 'chunks', file)
      );
      console.log(`✓ Copied chunk file: ${file}`);
    }
  });

  console.log('All data files copied successfully!');
} catch (err) {
  console.error('Error copying data files:', err);
  process.exit(1);
} 