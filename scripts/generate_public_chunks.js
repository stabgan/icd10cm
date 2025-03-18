import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to generate chunk files for the public directory
async function generatePublicChunks() {
  console.log('Starting to generate public code chunks...');
  
  try {
    // Read the search index data
    const dataPath = path.join(__dirname, '../data/search-index.json');
    console.log(`Reading data from ${dataPath}`);
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Enhance the data with additional fields that might be needed for rendering
    const enhancedData = data.map(item => ({
      ...item,
      // Add any additional fields that might be needed
      additionalInfo: item.additionalInfo || '',
      includes: item.includes || [],
      excludes: item.excludes || [],
      notes: item.notes || ''
    }));
    
    // Create a map to store codes by their first letter
    const chunkMap = {};
    
    // Organize codes by first letter
    enhancedData.forEach(code => {
      if (!code.code) return;
      
      const firstLetter = code.code.charAt(0).toUpperCase();
      
      if (!chunkMap[firstLetter]) {
        chunkMap[firstLetter] = [];
      }
      
      chunkMap[firstLetter].push(code);
    });
    
    // Ensure the public chunks directory exists
    const chunksDir = path.join(__dirname, '../public/data/chunks');
    if (!fs.existsSync(chunksDir)) {
      fs.mkdirSync(chunksDir, { recursive: true });
      console.log(`Created public chunks directory at ${chunksDir}`);
    }
    
    // Write each chunk to a separate file
    for (const [letter, codes] of Object.entries(chunkMap)) {
      const chunkPath = path.join(chunksDir, `${letter}.json`);
      fs.writeFileSync(chunkPath, JSON.stringify(codes, null, 2));
      console.log(`Generated public chunk for letter ${letter} with ${codes.length} codes`);
    }
    
    console.log(`Public chunk generation complete. Created ${Object.keys(chunkMap).length} chunk files.`);
    
  } catch (error) {
    console.error('Error generating public chunks:', error);
  }
}

// Create a small fallback chunk file for each letter if none exists
async function ensureAllChunksExist() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const chunksDir = path.join(__dirname, '../public/data/chunks');
  
  // Ensure the directory exists
  if (!fs.existsSync(chunksDir)) {
    fs.mkdirSync(chunksDir, { recursive: true });
  }
  
  for (const letter of letters) {
    const chunkPath = path.join(chunksDir, `${letter}.json`);
    
    // Check if the chunk file already exists
    if (!fs.existsSync(chunkPath)) {
      // Create a minimal fallback chunk
      const fallbackData = [{
        code: `${letter}00`,
        description: `Example ${letter} code`,
        category: "Sample category"
      }];
      
      fs.writeFileSync(chunkPath, JSON.stringify(fallbackData, null, 2));
      console.log(`Created fallback chunk for letter ${letter}`);
    }
  }
  
  console.log('Ensured all letter chunks exist');
}

// Run the functions
async function main() {
  await generatePublicChunks();
  await ensureAllChunksExist();
  console.log('All chunk generation tasks completed');
}

main(); 