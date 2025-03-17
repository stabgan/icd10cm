// This script processes JSONL data files into JSON files for the web app
const fs = require('fs');
const path = require('path');

// Path configurations
const DATA_DIR = path.join(__dirname, '../data');
const OUTPUT_DIR = path.join(__dirname, '../public/data');
const JSONL_FILE = path.join(DATA_DIR, 'icd10_data.jsonl');
const CODES_FILE = path.join(DATA_DIR, 'completed_icd_codes.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Created output directory: ${OUTPUT_DIR}`);
}

console.log('Starting ICD-10-CM data processing...');

// Load completed codes list (if exists)
let completedCodes = [];
try {
  if (fs.existsSync(CODES_FILE)) {
    completedCodes = JSON.parse(fs.readFileSync(CODES_FILE, 'utf8'));
    console.log(`Loaded ${completedCodes.length} codes from completed codes file`);
  } else {
    console.log('No completed codes file found. Will process all codes.');
  }
} catch (error) {
  console.error('Error loading completed codes:', error);
  process.exit(1);
}

// Check if JSONL file exists
if (!fs.existsSync(JSONL_FILE)) {
  console.error(`JSONL file not found: ${JSONL_FILE}`);
  console.log('Looking for alternative JSONL files...');
  
  // Try to find any JSONL file in the data directory
  const files = fs.readdirSync(DATA_DIR);
  const jsonlFiles = files.filter(file => file.endsWith('.jsonl'));
  
  if (jsonlFiles.length === 0) {
    console.error('No JSONL files found in the data directory.');
    process.exit(1);
  }
  
  console.log(`Found alternative JSONL file(s): ${jsonlFiles.join(', ')}`);
  console.log(`Using: ${jsonlFiles[0]}`);
  
  // Use the first JSONL file found
  JSONL_FILE = path.join(DATA_DIR, jsonlFiles[0]);
}

// Process the JSONL file
const processData = () => {
  console.log(`Processing JSONL file: ${JSONL_FILE}`);
  
  // Read the JSONL file content
  const content = fs.readFileSync(JSONL_FILE, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Process each line (JSON object)
  const allCodes = [];
  const searchIndex = [];
  
  console.log(`Found ${lines.length} lines to process`);
  
  lines.forEach((line, index) => {
    try {
      const data = JSON.parse(line);
      
      // Skip if we have a completed codes list and this code is not in it
      if (completedCodes.length > 0 && !completedCodes.includes(data.code)) {
        return;
      }
      
      // Add to all codes
      allCodes.push(data);
      
      // Add to search index (with minimal data for faster searches)
      searchIndex.push({
        code: data.code,
        description: data.description,
        category: data.category || 'Uncategorized'
      });
      
      if ((index + 1) % 1000 === 0) {
        console.log(`Processed ${index + 1} lines...`);
      }
    } catch (error) {
      console.error(`Error processing line ${index + 1}:`, error);
    }
  });
  
  console.log(`Processing complete. Found ${allCodes.length} valid codes.`);
  
  // Split into chunks of 1000 codes each
  const chunkSize = 1000;
  const chunks = [];
  
  for (let i = 0; i < allCodes.length; i += chunkSize) {
    chunks.push(allCodes.slice(i, i + chunkSize));
  }
  
  console.log(`Split into ${chunks.length} chunks`);
  
  // Write each chunk to a separate file
  chunks.forEach((chunk, index) => {
    const outputFile = path.join(OUTPUT_DIR, `chunk-${index}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(chunk, null, 2));
    console.log(`Wrote chunk ${index} to ${outputFile}`);
  });
  
  // Write search index
  const searchIndexFile = path.join(OUTPUT_DIR, 'search-index.json');
  fs.writeFileSync(searchIndexFile, JSON.stringify(searchIndex, null, 2));
  console.log(`Wrote search index to ${searchIndexFile}`);
  
  // Write index metadata
  const indexFile = path.join(OUTPUT_DIR, 'index.json');
  fs.writeFileSync(indexFile, JSON.stringify({
    totalCodes: allCodes.length,
    chunkCount: chunks.length,
    lastUpdated: new Date().toISOString()
  }, null, 2));
  console.log(`Wrote index metadata to ${indexFile}`);
  
  console.log('Data processing complete!');
};

// Execute the processing
try {
  processData();
} catch (error) {
  console.error('Error during processing:', error);
  process.exit(1);
} 