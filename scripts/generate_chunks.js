const fs = require('fs');
const path = require('path');

// Function to generate chunk files from the main data file
async function generateChunks() {
  console.log('Starting to generate code chunks...');
  
  try {
    // Read the complete data file
    const dataPath = path.join(__dirname, '../data/completed_icd_codes.json');
    console.log(`Reading data from ${dataPath}`);
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Create a map to store codes by their first letter
    const chunkMap = {};
    
    // Organize codes by first letter
    data.forEach(code => {
      if (!code.code) return;
      
      const firstLetter = code.code.charAt(0).toUpperCase();
      
      if (!chunkMap[firstLetter]) {
        chunkMap[firstLetter] = [];
      }
      
      chunkMap[firstLetter].push(code);
    });
    
    // Ensure the chunks directory exists
    const chunksDir = path.join(__dirname, '../data/chunks');
    if (!fs.existsSync(chunksDir)) {
      fs.mkdirSync(chunksDir, { recursive: true });
      console.log(`Created chunks directory at ${chunksDir}`);
    }
    
    // Write each chunk to a separate file
    for (const [letter, codes] of Object.entries(chunkMap)) {
      const chunkPath = path.join(chunksDir, `${letter}.json`);
      fs.writeFileSync(chunkPath, JSON.stringify(codes, null, 2));
      console.log(`Generated chunk for letter ${letter} with ${codes.length} codes`);
    }
    
    // Create a sample index file to track the data
    const indexData = {
      totalCodes: data.length,
      chunkCount: Object.keys(chunkMap).length,
      chunks: Object.keys(chunkMap).map(letter => ({
        letter,
        count: chunkMap[letter].length
      })),
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(__dirname, '../data/index.json'),
      JSON.stringify(indexData, null, 2)
    );
    
    console.log(`Generated index file with metadata`);
    console.log(`Chunk generation complete. Created ${Object.keys(chunkMap).length} chunk files.`);
    
  } catch (error) {
    console.error('Error generating chunks:', error);
  }
}

// Create a search index file for faster searches
async function generateSearchIndex() {
  console.log('Starting to generate search index...');
  
  try {
    // Read the complete data file
    const dataPath = path.join(__dirname, '../data/completed_icd_codes.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Extract just the fields needed for search
    const searchIndex = data.map(item => ({
      code: item.code,
      description: item.description,
      category: item.category || ''
    }));
    
    // Write the search index
    fs.writeFileSync(
      path.join(__dirname, '../data/search-index.json'),
      JSON.stringify(searchIndex)
    );
    
    console.log(`Generated search index with ${searchIndex.length} items`);
    
  } catch (error) {
    console.error('Error generating search index:', error);
  }
}

// Run both functions
async function main() {
  await generateChunks();
  await generateSearchIndex();
  console.log('All data generation complete!');
}

main(); 