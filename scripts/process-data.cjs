// Use CommonJS style imports
const fs = require('fs');
const path = require('path');

// Path to your data files - using relative paths from the project root
const jsonlFilePath = path.join(__dirname, '../data/icd10_cm_code_detailed.jsonl');
const completedCodesPath = path.join(__dirname, '../data/completed_icd_codes.json');
const outputPath = path.join(__dirname, '../public/data');
const chunksPath = path.join(outputPath, 'chunks');

// Check if necessary files exist
console.log('\n========== ICD-10-CM Data Processing ==========\n');

// Ensure output directories exist
if (!fs.existsSync(outputPath)) {
  console.log(`Creating output directory: ${outputPath}`);
  fs.mkdirSync(outputPath, { recursive: true });
}

if (!fs.existsSync(chunksPath)) {
  console.log(`Creating chunks directory: ${chunksPath}`);
  fs.mkdirSync(chunksPath, { recursive: true });
}

console.log('Processing ICD-10-CM codes...');

// Check if JSONL file exists
if (!fs.existsSync(jsonlFilePath)) {
  console.error(`\n❌ ERROR: JSONL file not found: ${jsonlFilePath}`);
  console.error('\nPlease make sure to place your JSONL data file at:');
  console.error('  data/icd10_cm_code_detailed.jsonl');
  process.exit(1);
}

// Read the completed ICD codes
let completedCodes;
try {
  // Check if completedCodes file exists
  if (!fs.existsSync(completedCodesPath)) {
    console.error(`\n❌ ERROR: Completed codes file not found: ${completedCodesPath}`);
    console.error('\nPlease make sure to place your completed codes JSON file at:');
    console.error('  data/completed_icd_codes.json');
    console.error('\nThe file should contain an array of ICD-10-CM codes to include.');
    process.exit(1);
  }
  
  const completedCodesData = fs.readFileSync(completedCodesPath, 'utf8');
  completedCodes = JSON.parse(completedCodesData);
  console.log(`Loaded ${completedCodes.length} completed ICD codes`);
  
  // Make sure the array has unique values
  completedCodes = [...new Set(completedCodes)];
  console.log(`After removing duplicates: ${completedCodes.length} unique ICD codes`);
  
} catch (error) {
  console.error('\n❌ ERROR reading completed codes file:', error);
  console.error('\nPlease ensure your completed_icd_codes.json file contains a valid JSON array.');
  process.exit(1);
}

// Create a compact version of the ICD codes for search
const searchIndex = [];

// Process the JSONL file in chunks
const readStream = fs.createReadStream(jsonlFilePath, { encoding: 'utf8' });
let buffer = '';
let codesByFirstChar = {};
let totalProcessed = 0;
let totalLines = 0;
let startTime = Date.now();
let missingCodes = new Set(completedCodes); // Track which codes we haven't found yet

console.log('\nStarting to process JSONL file...');

readStream.on('data', (chunk) => {
  buffer += chunk;
  
  // Process complete lines
  const lines = buffer.split('\n');
  buffer = lines.pop(); // Keep the last incomplete line in the buffer
  
  totalLines += lines.length;
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    try {
      const codeData = JSON.parse(line);
      // Process the code if it's in the completedCodes list
      if (completedCodes.includes(codeData.code)) {
        // Add to search index with normalized values for better searching
        // Only include first 500 chars of detailed_context to avoid file size issues
        const truncatedContext = codeData.detailed_context 
          ? codeData.detailed_context.substring(0, 500) 
          : '';
        
        searchIndex.push({
          code: codeData.code,
          description: codeData.description,
          detailed_context: truncatedContext // Add truncated detailed_context to search index
        });
        
        // Group by first character for chunking
        const firstChar = codeData.code.charAt(0);
        if (!codesByFirstChar[firstChar]) {
          codesByFirstChar[firstChar] = [];
        }
        
        // Ensure we keep the full detailed_context field for the chunks
        codesByFirstChar[firstChar].push({
          code: codeData.code,
          description: codeData.description,
          detailed_context: codeData.detailed_context || ''
        });
        
        // Remove from missing codes
        missingCodes.delete(codeData.code);
        
        totalProcessed++;
        
        // Log progress occasionally
        if (totalProcessed % 1000 === 0) {
          process.stdout.write(`Processed ${totalProcessed} codes...\r`);
        }
      }
    } catch (err) {
      console.error(`\n❌ Error parsing line: ${err.message}`);
      console.error('Line content:', line.substring(0, 100) + '...');
    }
  }
});

readStream.on('end', () => {
  if (buffer.trim()) {
    try {
      const codeData = JSON.parse(buffer);
      if (completedCodes.includes(codeData.code)) {
        // Add to search index with normalized values for better searching
        // Only include first 500 chars of detailed_context to avoid file size issues
        const truncatedContext = codeData.detailed_context 
          ? codeData.detailed_context.substring(0, 500) 
          : '';
        
        searchIndex.push({
          code: codeData.code,
          description: codeData.description,
          detailed_context: truncatedContext // Add truncated detailed_context to search index
        });
        
        const firstChar = codeData.code.charAt(0);
        if (!codesByFirstChar[firstChar]) {
          codesByFirstChar[firstChar] = [];
        }
        
        // Ensure we keep the full detailed_context field for the chunks
        codesByFirstChar[firstChar].push({
          code: codeData.code,
          description: codeData.description,
          detailed_context: codeData.detailed_context || ''
        });
        
        missingCodes.delete(codeData.code);
        totalProcessed++;
      }
    } catch (err) {
      console.error(`\n❌ Error parsing final buffer: ${err.message}`);
    }
  }
  
  // Check if any codes were not found
  if (missingCodes.size > 0) {
    console.warn(`\n⚠️ WARNING: ${missingCodes.size} codes from completed_icd_codes.json were not found in the JSONL file.`);
    
    if (missingCodes.size <= 20) {
      console.warn('Missing codes:', Array.from(missingCodes).join(', '));
    } else {
      console.warn('First 20 missing codes:', Array.from(missingCodes).slice(0, 20).join(', ') + '...');
    }
  }
  
  // Write chunked files by first character
  console.log('\nWriting chunked files by first character...');
  const chunkMap = {};
  
  Object.keys(codesByFirstChar).forEach((firstChar) => {
    console.log(`- Writing chunk for '${firstChar}' with ${codesByFirstChar[firstChar].length} codes...`);
    fs.writeFileSync(
      path.join(chunksPath, `${firstChar}.json`),
      JSON.stringify(codesByFirstChar[firstChar])
    );
    chunkMap[firstChar] = firstChar;
  });
  
  // Write search index
  console.log(`\nWriting search index with ${searchIndex.length} entries...`);
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
    processingTime: ((endTime - startTime) / 1000).toFixed(2) // in seconds
  };
  
  fs.writeFileSync(
    path.join(outputPath, 'index.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  console.log('\n========== Processing Summary ==========');
  console.log(`✅ Total JSONL lines read: ${totalLines}`);
  console.log(`✅ Processed ICD codes: ${totalProcessed} / ${completedCodes.length}`);
  console.log(`✅ Generated chunks: ${Object.keys(codesByFirstChar).length}`);
  console.log(`✅ Search index entries: ${searchIndex.length}`);
  console.log(`✅ Processing time: ${metadata.processingTime} seconds`);
  
  if (missingCodes.size > 0) {
    console.log(`⚠️ Missing codes: ${missingCodes.size}`);
  } else {
    console.log('✅ All codes from completed_icd_codes.json were found and processed!');
  }
  
  console.log('\n✅ Data processing complete!');
  console.log('\nYou can now run "npm run dev" to start the development server.');
});

// Handle errors
readStream.on('error', (err) => {
  console.error(`\n❌ Error reading JSONL file: ${err.message}`);
  console.error('\nPlease check that your JSONL file is valid and accessible.');
  process.exit(1);
}); 