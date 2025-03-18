const fs = require('fs-extra');
const path = require('path');

console.log('Starting data files copy process...');

// Define source and target directories
const distDataDir = path.join(__dirname, 'dist', 'data');
const distChunksDir = path.join(__dirname, 'dist', 'data', 'chunks');
const publicDataDir = path.join(__dirname, 'public', 'data');
const srcDataDir = path.join(__dirname, 'src', 'data');
const dataDir = path.join(__dirname, 'data');

// Ensure target directories exist
fs.ensureDirSync(distDataDir);
fs.ensureDirSync(distChunksDir);

// Check if directories exist
const publicDataExists = fs.existsSync(publicDataDir);
const srcDataExists = fs.existsSync(srcDataDir);
const rootDataExists = fs.existsSync(dataDir);

console.log(`Public data directory exists: ${publicDataExists}`);
console.log(`Src data directory exists: ${srcDataExists}`);
console.log(`Root data directory exists: ${rootDataExists}`);

// Determine which source directory to use
let sourceDataDir = null;
if (publicDataExists) {
  sourceDataDir = publicDataDir;
  console.log('Using public/data directory as source');
} else if (srcDataExists) {
  sourceDataDir = srcDataDir;
  console.log('Using src/data directory as source');
} else if (rootDataExists) {
  sourceDataDir = dataDir;
  console.log('Using root data directory as source');
}

// If we don't have source data, create placeholder data
if (!sourceDataDir) {
  console.warn('No data directories found. Creating placeholder data.');
  
  // Create minimal placeholder index.json
  const placeholderIndex = {
    totalCodes: 0,
    chunkCount: 0,
    chunkMap: {},
    processTimeSeconds: 0,
    lastUpdated: new Date().toISOString()
  };
  
  fs.writeJSONSync(path.join(distDataDir, 'index.json'), placeholderIndex);
  console.log('✓ Created placeholder index.json');
  
  // Create minimal placeholder search-index.json
  fs.writeJSONSync(path.join(distDataDir, 'search-index.json'), {});
  console.log('✓ Created placeholder search-index.json');
  
  console.log('Placeholder data created. The application will start but data will be empty.');
  process.exit(0);
}

// Copy data files
try {
  // Try to copy index.json
  const indexJsonSource = path.join(sourceDataDir, 'index.json');
  const indexJsonTarget = path.join(distDataDir, 'index.json');
  
  if (fs.existsSync(indexJsonSource)) {
    fs.copySync(indexJsonSource, indexJsonTarget);
    console.log('✓ Copied index.json');
  } else {
    console.warn('⚠️ index.json not found in source directory');
    
    // Create minimal placeholder
    const placeholderIndex = {
      totalCodes: 0,
      chunkCount: 0,
      chunkMap: {},
      processTimeSeconds: 0,
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeJSONSync(indexJsonTarget, placeholderIndex);
    console.log('✓ Created placeholder index.json');
  }

  // Try to copy search-index.json
  const searchIndexSource = path.join(sourceDataDir, 'search-index.json');
  const searchIndexTarget = path.join(distDataDir, 'search-index.json');
  
  if (fs.existsSync(searchIndexSource)) {
    fs.copySync(searchIndexSource, searchIndexTarget);
    console.log('✓ Copied search-index.json');
  } else {
    console.warn('⚠️ search-index.json not found in source directory');
    
    // Create minimal placeholder
    fs.writeJSONSync(searchIndexTarget, {});
    console.log('✓ Created placeholder search-index.json');
  }

  // Try to copy chunk files
  const sourceChunksDir = path.join(sourceDataDir, 'chunks');
  
  if (fs.existsSync(sourceChunksDir)) {
    // Check if directory is not empty
    const files = fs.readdirSync(sourceChunksDir);
    
    if (files.length > 0) {
      console.log(`Found ${files.length} files in chunks directory`);
      
      // Copy chunk files
      files.forEach(file => {
        if (file.endsWith('.json')) {
          fs.copySync(
            path.join(sourceChunksDir, file),
            path.join(distChunksDir, file)
          );
          console.log(`✓ Copied chunk file: ${file}`);
        }
      });
    } else {
      console.warn('⚠️ Chunks directory is empty');
    }
  } else {
    console.warn('⚠️ Chunks directory not found in source directory');
  }

  console.log('Data file copy process completed!');
} catch (err) {
  console.error('Error during data file copy:', err);
  
  // Don't fail the build completely - allow the application to build with warnings
  console.warn('⚠️ Some data files could not be copied. The application may have limited functionality.');
  
  // Create default index.json if it doesn't exist
  if (!fs.existsSync(path.join(distDataDir, 'index.json'))) {
    const placeholderIndex = {
      totalCodes: 0,
      chunkCount: 0,
      chunkMap: {},
      processTimeSeconds: 0,
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeJSONSync(path.join(distDataDir, 'index.json'), placeholderIndex);
    console.log('✓ Created fallback index.json');
  }
  
  // Exit with success to not fail the build
  process.exit(0);
} 