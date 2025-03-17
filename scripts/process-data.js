// Since we're using Node.js directly, we need to use CommonJS
const fs = require('fs');
const path = require('path');

// Path to your data files
const jsonlFilePath = path.join(__dirname, '../data/icd10_cm_code_detailed.jsonl');
const completedCodesPath = path.join(__dirname, '../data/completed_icd_codes.json');
const outputPath = path.join(__dirname, '../public/data');
const chunksPath = path.join(outputPath, 'chunks');

// Ensure output directories exist
if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

if (!fs.existsSync(chunksPath)) {
  fs.mkdirSync(chunksPath, { recursive: true });
}

console.log('Processing ICD-10-CM codes...');
console.log(`JSONL file: ${jsonlFilePath}`);
console.log(`Completed codes file: ${completedCodesPath}`);
console.log(`Output directory: ${outputPath}`);

// Read the completed ICD codes
let completedCodes;
try {
  const completedCodesData = fs.readFileSync(completedCodesPath, 'utf8');
  completedCodes = JSON.parse(completedCodesData);
  console.log(`Loaded ${completedCodes.length} completed ICD codes`);
} catch (error) {
  console.error('Error reading completed codes file:', error);
  process.exit(1);
}

// Check if JSONL file exists
if (!fs.existsSync(jsonlFilePath)) {
  console.error(`JSONL file not found: ${jsonlFilePath}`);
  process.exit(1);
}

// Create a compact version of the ICD codes for search
const searchIndex = [];

// Process the JSONL file in chunks
const readStream = fs.createReadStream(jsonlFilePath, { encoding: 'utf8' });
let buffer = '';
let codesByFirstChar = {};
let totalProcessed = 0;
let startTime = Date.now();

console.log('Starting to process JSONL file...');

readStream.on('data', (chunk) => {
  buffer += chunk;
  
  // Process complete lines
  const lines = buffer.split('\n');
  buffer = lines.pop(); // Keep the last incomplete line in the buffer
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    try {
      const codeData = JSON.parse(line);
      if (completedCodes.includes(codeData.code)) {
        // Add to search index
        searchIndex.push({
          code: codeData.code,
          description: codeData.description,
          category: codeData.category || 'Uncategorized'
        });
        
        // Group by first character for chunking
        const firstChar = codeData.code.charAt(0);
        if (!codesByFirstChar[firstChar]) {
          codesByFirstChar[firstChar] = [];
        }
        
        // Ensure we keep the detailed_context field
        codesByFirstChar[firstChar].push({
          code: codeData.code,
          description: codeData.description,
          category: codeData.category || 'Uncategorized',
          detailed_context: codeData.detailed_context || ''
        });
        
        totalProcessed++;
      }
    } catch (err) {
      console.error('Error parsing line:', err);
    }
  }
});

readStream.on('end', () => {
  if (buffer.trim()) {
    try {
      const codeData = JSON.parse(buffer);
      if (completedCodes.includes(codeData.code)) {
        searchIndex.push({
          code: codeData.code,
          description: codeData.description,
          category: codeData.category || 'Uncategorized'
        });
        
        const firstChar = codeData.code.charAt(0);
        if (!codesByFirstChar[firstChar]) {
          codesByFirstChar[firstChar] = [];
        }
        
        // Ensure we keep the detailed_context field
        codesByFirstChar[firstChar].push({
          code: codeData.code,
          description: codeData.description,
          category: codeData.category || 'Uncategorized',
          detailed_context: codeData.detailed_context || ''
        });
        
        totalProcessed++;
      }
    } catch (err) {
      console.error('Error parsing final buffer:', err);
    }
  }
  
  // Write chunked files by first character
  console.log('Writing chunked files by first character...');
  const chunkMap = {};
  
  Object.keys(codesByFirstChar).forEach((firstChar) => {
    console.log(`Writing chunk for '${firstChar}' with ${codesByFirstChar[firstChar].length} codes...`);
    fs.writeFileSync(
      path.join(chunksPath, `${firstChar}.json`),
      JSON.stringify(codesByFirstChar[firstChar])
    );
    chunkMap[firstChar] = firstChar;
  });
  
  // Write search index
  console.log(`Writing search index with ${searchIndex.length} entries...`);
  fs.writeFileSync(
    path.join(outputPath, 'search-index.json'),
    JSON.stringify(searchIndex)
  );
  
  // Write index file with metadata
  const endTime = Date.now();
  const metadata = {
    totalCodes: totalProcessed,
    chunkCount: Object.keys(codesByFirstChar).length,
    chunkMap: chunkMap,
    lastUpdated: new Date().toISOString(),
    processingTime: (endTime - startTime) / 1000 // in seconds
  };
  
  fs.writeFileSync(
    path.join(outputPath, 'index.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  console.log(`Processed ${totalProcessed} ICD-10-CM codes into ${Object.keys(codesByFirstChar).length} chunks.`);
  console.log(`Search index contains ${searchIndex.length} entries.`);
  console.log(`Processing took ${metadata.processingTime} seconds.`);
  console.log('Data processing complete!');
});

// Handle errors
readStream.on('error', (err) => {
  console.error('Error reading JSONL file:', err);
  process.exit(1);
}); 