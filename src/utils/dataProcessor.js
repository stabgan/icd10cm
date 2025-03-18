import { openDB } from 'idb';

// Database configuration
const DB_NAME = 'icd10cm-db';
const DB_VERSION = 1;
const CODES_STORE = 'codes';
const CHUNKS_STORE = 'chunks';
const INDEX_STORE = 'index';
const SEARCH_INDEX_STORE = 'search-index';

// Initialize the database
async function initializeDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(CODES_STORE)) {
        db.createObjectStore(CODES_STORE, { keyPath: 'code' });
      }
      
      if (!db.objectStoreNames.contains(CHUNKS_STORE)) {
        db.createObjectStore(CHUNKS_STORE, { keyPath: 'letter' });
      }
      
      if (!db.objectStoreNames.contains(INDEX_STORE)) {
        db.createObjectStore(INDEX_STORE, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(SEARCH_INDEX_STORE)) {
        db.createObjectStore(SEARCH_INDEX_STORE, { keyPath: 'id' });
      }
    }
  });
}

// Read a large file in chunks
async function readFileInChunks(file, chunkCallback, progressCallback) {
  const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
  const totalSize = file.size;
  let processedSize = 0;
  let offset = 0;
  let result = '';
  
  while (offset < totalSize) {
    const chunk = file.slice(offset, offset + CHUNK_SIZE);
    const chunkText = await chunk.text();
    result += chunkText;
    
    // Process complete lines from result
    const lastNewlineIndex = result.lastIndexOf('\n');
    if (lastNewlineIndex !== -1) {
      const completeLines = result.substring(0, lastNewlineIndex);
      result = result.substring(lastNewlineIndex + 1);
      
      await chunkCallback(completeLines);
    }
    
    offset += CHUNK_SIZE;
    processedSize = Math.min(offset, totalSize);
    progressCallback(Math.round((processedSize / totalSize) * 50)); // First 50% for reading
  }
  
  // Process any remaining text
  if (result) {
    await chunkCallback(result);
  }
}

// Organize codes by first letter
function organizeCodesByLetter(codes) {
  const letterChunks = {};
  
  codes.forEach(code => {
    const firstChar = code.code.charAt(0);
    if (!letterChunks[firstChar]) {
      letterChunks[firstChar] = [];
    }
    letterChunks[firstChar].push(code);
  });
  
  return letterChunks;
}

// Build a simple search index
function buildSearchIndex(codes) {
  const searchIndex = {};
  
  codes.forEach(code => {
    // Index by code
    if (!searchIndex[code.code]) {
      searchIndex[code.code] = { code: code.code, description: code.description };
    }
    
    // Index keywords from description
    const words = code.description.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length >= 3) { // Only index words with 3+ characters
        if (!searchIndex[word]) {
          searchIndex[word] = [];
        }
        // Avoid duplicates
        if (!searchIndex[word].some(item => item.code === code.code)) {
          searchIndex[word].push({ code: code.code, description: code.description });
        }
      }
    });
  });
  
  return searchIndex;
}

// Main processing function
export async function processICD10Data(file, progressCallback) {
  const startTime = performance.now();
  const db = await initializeDB();
  
  // Clear existing data
  const tx = db.transaction(
    [CODES_STORE, CHUNKS_STORE, INDEX_STORE, SEARCH_INDEX_STORE], 
    'readwrite'
  );
  await Promise.all([
    tx.objectStore(CODES_STORE).clear(),
    tx.objectStore(CHUNKS_STORE).clear(),
    tx.objectStore(INDEX_STORE).clear(),
    tx.objectStore(SEARCH_INDEX_STORE).clear()
  ]);
  
  // Process data
  const allCodes = [];
  
  await readFileInChunks(file, async (text) => {
    // Parse lines to get ICD-10 codes
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const codeData = JSON.parse(line);
        if (codeData.code && codeData.description) {
          allCodes.push(codeData);
        }
      } catch (e) {
        console.warn('Error parsing line:', e, line);
      }
    }
  }, progressCallback);
  
  // Update progress to 60%
  progressCallback(60);
  
  // Organize codes by first letter
  const letterChunks = organizeCodesByLetter(allCodes);
  const chunkMap = {};
  
  // Build chunk map
  Object.keys(letterChunks).forEach(letter => {
    chunkMap[letter] = letter;
  });
  
  // Update progress to 70%
  progressCallback(70);
  
  // Build search index
  const searchIndex = buildSearchIndex(allCodes);
  
  // Update progress to 80%
  progressCallback(80);
  
  // Save chunks to database
  const chunksTransaction = db.transaction(CHUNKS_STORE, 'readwrite');
  const chunksStore = chunksTransaction.objectStore(CHUNKS_STORE);
  
  const chunkPromises = Object.entries(letterChunks).map(([letter, codes]) => {
    return chunksStore.put({ letter, codes });
  });
  
  await Promise.all(chunkPromises);
  
  // Update progress to 90%
  progressCallback(90);
  
  // Save index metadata
  const endTime = performance.now();
  const processTimeSeconds = (endTime - startTime) / 1000;
  
  const indexData = {
    id: 'main',
    totalCodes: allCodes.length,
    chunkCount: Object.keys(letterChunks).length,
    chunkMap,
    processTimeSeconds,
    lastUpdated: new Date().toISOString()
  };
  
  // Save search index
  const searchIndexTransaction = db.transaction(SEARCH_INDEX_STORE, 'readwrite');
  await searchIndexTransaction.objectStore(SEARCH_INDEX_STORE).put({
    id: 'main',
    data: searchIndex
  });
  
  // Save index data
  const indexTransaction = db.transaction(INDEX_STORE, 'readwrite');
  await indexTransaction.objectStore(INDEX_STORE).put(indexData);
  
  // Update progress to 100%
  progressCallback(100);
  
  console.log(`Processed ${allCodes.length} codes in ${processTimeSeconds.toFixed(2)} seconds`);
  
  // Store in local storage that data is available
  localStorage.setItem('icd10cm-data-loaded', 'true');
  localStorage.setItem('icd10cm-data-count', allCodes.length.toString());
  localStorage.setItem('icd10cm-last-updated', new Date().toISOString());
  
  return indexData;
}

// Check if data is already loaded
export async function checkDataLoaded() {
  try {
    const dataLoaded = localStorage.getItem('icd10cm-data-loaded') === 'true';
    if (!dataLoaded) return false;
    
    // Verify the database exists and has data
    const db = await openDB(DB_NAME, DB_VERSION);
    const tx = db.transaction(INDEX_STORE, 'readonly');
    const indexStore = tx.objectStore(INDEX_STORE);
    const indexData = await indexStore.get('main');
    
    return !!indexData && indexData.totalCodes > 0;
  } catch (error) {
    console.error('Error checking data:', error);
    return false;
  }
}

// Get index data
export async function getIndexData() {
  try {
    const db = await openDB(DB_NAME, DB_VERSION);
    const tx = db.transaction(INDEX_STORE, 'readonly');
    const indexStore = tx.objectStore(INDEX_STORE);
    return await indexStore.get('main');
  } catch (error) {
    console.error('Error getting index data:', error);
    return null;
  }
}

// Get codes for a letter
export async function getCodesForLetter(letter) {
  try {
    const db = await openDB(DB_NAME, DB_VERSION);
    const tx = db.transaction(CHUNKS_STORE, 'readonly');
    const chunksStore = tx.objectStore(CHUNKS_STORE);
    const chunk = await chunksStore.get(letter);
    return chunk ? chunk.codes : [];
  } catch (error) {
    console.error(`Error getting codes for letter ${letter}:`, error);
    return [];
  }
}

// Get a specific code
export async function getCode(code) {
  try {
    // Get the first letter of the code
    const letter = code.charAt(0);
    
    // Get all codes for that letter
    const codes = await getCodesForLetter(letter);
    
    // Find the specific code
    return codes.find(c => c.code === code) || null;
  } catch (error) {
    console.error(`Error getting code ${code}:`, error);
    return null;
  }
}

// Search codes
export async function searchCodes(query) {
  if (!query || query.length < 2) return [];
  
  try {
    const db = await openDB(DB_NAME, DB_VERSION);
    const tx = db.transaction(SEARCH_INDEX_STORE, 'readonly');
    const searchStore = tx.objectStore(SEARCH_INDEX_STORE);
    const searchIndex = await searchStore.get('main');
    
    if (!searchIndex || !searchIndex.data) return [];
    
    const results = new Map();
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    // Search for exact code match first
    if (searchIndex.data[query]) {
      const exactMatch = searchIndex.data[query];
      if (Array.isArray(exactMatch)) {
        exactMatch.forEach(item => {
          results.set(item.code, item);
        });
      } else {
        results.set(exactMatch.code, exactMatch);
      }
    }
    
    // Then search for each term
    for (const term of searchTerms) {
      if (term.length < 2) continue;
      
      // Look for exact matches in search index
      Object.keys(searchIndex.data).forEach(key => {
        if (key.includes(term)) {
          const matches = searchIndex.data[key];
          if (Array.isArray(matches)) {
            matches.forEach(item => {
              results.set(item.code, item);
            });
          } else if (matches) {
            results.set(matches.code, matches);
          }
        }
      });
    }
    
    return Array.from(results.values());
  } catch (error) {
    console.error('Error searching codes:', error);
    return [];
  }
} 