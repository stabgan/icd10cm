import { openDB } from 'idb';
import { flexSearchAdapter } from './flexSearchAdapter';

// Database configuration
const DB_NAME = 'icd10cm-db';
const DB_VERSION = 2; // Updated version to handle schema changes
const CODES_STORE = 'codes';
const CHUNKS_STORE = 'chunks';
const INDEX_STORE = 'index';
const SEARCH_INDEX_STORE = 'search-index';
const FLEX_INDEX_STORE = 'flex-index'; // New store for FlexSearch serialized index

// Hold in-memory indices for faster searches
let searchIndices = null;
let documentsMap = null;

// Initialize the database
async function initializeDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
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
      
      // Add FlexSearch index store
      if (!db.objectStoreNames.contains(FLEX_INDEX_STORE)) {
        db.createObjectStore(FLEX_INDEX_STORE, { keyPath: 'id' });
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

// Initialize FlexSearch indices
async function initializeSearchIndices() {
  if (searchIndices) {
    return { searchIndices, documentsMap };
  }
  
  try {
    const db = await initializeDB();
    
    // Try to load serialized indices from database
    const flexIndexTx = db.transaction(FLEX_INDEX_STORE, 'readonly');
    const flexIndexStore = flexIndexTx.objectStore(FLEX_INDEX_STORE);
    const indexData = await flexIndexStore.get('serialized');
    
    if (indexData && indexData.documentCount > 0) {
      // Create new indices
      searchIndices = flexSearchAdapter.createIndices();
      
      // Load documents for the document map
      const chunksTx = db.transaction(CHUNKS_STORE, 'readonly');
      const chunksStore = chunksTx.objectStore(CHUNKS_STORE);
      const allChunks = await chunksStore.getAll();
      
      // Build documents array
      const allCodes = [];
      for (const chunk of allChunks) {
        allCodes.push(...chunk.codes);
      }
      
      // Create document map for faster lookup
      documentsMap = flexSearchAdapter.createDocumentsMap(allCodes);
      
      // Load serialized indices if available
      if (indexData.serialized) {
        // Import serialized data (in a real implementation)
        // This is a placeholder as FlexSearch doesn't support direct serialization
        console.log(`Loaded search indices with ${indexData.documentCount} documents`);
      } else {
        // Index all documents if serialized data isn't available
        console.log('Rebuilding search indices');
        await flexSearchAdapter.indexBatch(searchIndices, allCodes);
      }
      
      return { searchIndices, documentsMap };
    }
    
    // If we get here, indices weren't loaded
    return { searchIndices: null, documentsMap: null };
  } catch (error) {
    console.error('Error initializing search indices:', error);
    return { searchIndices: null, documentsMap: null };
  }
}

// Main processing function
export async function processICD10Data(file, progressCallback) {
  const startTime = performance.now();
  const db = await initializeDB();
  
  // Clear existing data
  const tx = db.transaction(
    [CODES_STORE, CHUNKS_STORE, INDEX_STORE, SEARCH_INDEX_STORE, FLEX_INDEX_STORE], 
    'readwrite'
  );
  await Promise.all([
    tx.objectStore(CODES_STORE).clear(),
    tx.objectStore(CHUNKS_STORE).clear(),
    tx.objectStore(INDEX_STORE).clear(),
    tx.objectStore(SEARCH_INDEX_STORE).clear(),
    tx.objectStore(FLEX_INDEX_STORE).clear()
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
  
  // Build search index (traditional)
  const searchIndex = buildSearchIndex(allCodes);
  
  // Update progress to 75%
  progressCallback(75);
  
  // Create FlexSearch indices
  const indices = flexSearchAdapter.createIndices();
  const documentsMap = flexSearchAdapter.createDocumentsMap(allCodes);
  
  // Index all documents with FlexSearch
  await flexSearchAdapter.indexBatch(indices, allCodes);
  
  // Store references to in-memory indices
  searchIndices = indices;
  this.documentsMap = documentsMap;
  
  // Update progress to 80%
  progressCallback(80);
  
  // Save chunks to database
  const chunksTransaction = db.transaction(CHUNKS_STORE, 'readwrite');
  const chunksStore = chunksTransaction.objectStore(CHUNKS_STORE);
  
  const chunkPromises = Object.entries(letterChunks).map(([letter, codes]) => {
    return chunksStore.put({ letter, codes });
  });
  
  await Promise.all(chunkPromises);
  
  // Update progress to 85%
  progressCallback(85);
  
  // Save FlexSearch index metadata
  const flexIndexTransaction = db.transaction(FLEX_INDEX_STORE, 'readwrite');
  await flexIndexTransaction.objectStore(FLEX_INDEX_STORE).put({
    id: 'serialized',
    documentCount: allCodes.length,
    // Serialized data would go here if FlexSearch supported direct serialization
    // This is just a placeholder to track that we've indexed the data
    serialized: false,
    date: new Date().toISOString()
  });
  
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
    const db = await initializeDB();
    const tx = db.transaction(INDEX_STORE, 'readonly');
    const indexStore = tx.objectStore(INDEX_STORE);
    const indexData = await indexStore.get('main');
    
    // Initialize search indices
    if (indexData && indexData.totalCodes > 0) {
      await initializeSearchIndices();
    }
    
    return !!indexData && indexData.totalCodes > 0;
  } catch (error) {
    console.error('Error checking data:', error);
    return false;
  }
}

// Get index data
export async function getIndexData() {
  try {
    const db = await initializeDB();
    const tx = db.transaction(INDEX_STORE, 'readonly');
    const indexStore = tx.objectStore(INDEX_STORE);
    return await indexStore.get('main');
  } catch (error) {
    console.error('Error getting index data:', error);
    return null;
  }
}

// Get codes for a specific letter
export async function getCodesForLetter(letter) {
  try {
    const db = await initializeDB();
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
    const db = await initializeDB();
    
    // First try the exact code
    const codeTx = db.transaction(CODES_STORE, 'readonly');
    const codeStore = codeTx.objectStore(CODES_STORE);
    const codeData = await codeStore.get(code);
    
    if (codeData) {
      return codeData;
    }
    
    // If not found in CODES_STORE, search in chunks
    const letter = code.charAt(0);
    const chunkTx = db.transaction(CHUNKS_STORE, 'readonly');
    const chunksStore = chunkTx.objectStore(CHUNKS_STORE);
    const chunk = await chunksStore.get(letter);
    
    if (chunk) {
      return chunk.codes.find(c => c.code === code) || null;
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting code ${code}:`, error);
    return null;
  }
}

// Search for codes
export async function searchCodes(query) {
  if (!query || query.trim() === '') {
    return [];
  }
  
  try {
    // First initialize the search indices if they aren't loaded
    let indices = searchIndices;
    let docMap = documentsMap;
    
    if (!indices) {
      const result = await initializeSearchIndices();
      indices = result.searchIndices;
      docMap = result.documentsMap;
      
      // If we still don't have indices, fall back to traditional search
      if (!indices) {
        console.log('FlexSearch indices not available, falling back to traditional search');
        return fallbackSearch(query);
      }
    }
    
    // Use FlexSearch
    console.log('Using FlexSearch for query:', query);
    const results = await flexSearchAdapter.search(indices, docMap, query);
    
    return results;
  } catch (error) {
    console.error('Error searching codes:', error);
    
    // Fall back to traditional search on error
    console.log('Error with FlexSearch, falling back to traditional search');
    return fallbackSearch(query);
  }
}

// Traditional fallback search
async function fallbackSearch(query) {
  try {
    // Normalize query
    const normalizedQuery = query.trim().toLowerCase();
    
    // Try exact match first
    const exactCode = await getCode(query.toUpperCase());
    if (exactCode) {
      return [exactCode];
    }
    
    // Then try search index
    const db = await initializeDB();
    const indexTx = db.transaction(SEARCH_INDEX_STORE, 'readonly');
    const indexStore = indexTx.objectStore(SEARCH_INDEX_STORE);
    const indexData = await indexStore.get('main');
    
    if (!indexData || !indexData.data) {
      console.warn('Search index not found, falling back to direct search');
      return directCodeSearch(normalizedQuery);
    }
    
    // Search in index
    const results = [];
    
    // First add exact word matches
    if (indexData.data[normalizedQuery]) {
      const matches = indexData.data[normalizedQuery];
      if (Array.isArray(matches)) {
        results.push(...matches);
      } else if (matches) {
        results.push(matches);
      }
    }
    
    // Then add partial matches
    const searchWords = normalizedQuery.split(/\s+/);
    for (const word of searchWords) {
      if (word.length >= 3) {
        Object.keys(indexData.data).forEach(key => {
          if (key.includes(word) && key !== normalizedQuery) {
            const matches = indexData.data[key];
            if (Array.isArray(matches)) {
              results.push(...matches);
            } else if (matches) {
              results.push(matches);
            }
          }
        });
      }
    }
    
    // Deduplicate results
    const seen = new Set();
    const uniqueResults = [];
    
    for (const result of results) {
      if (!seen.has(result.code)) {
        seen.add(result.code);
        uniqueResults.push(result);
      }
    }
    
    return uniqueResults.slice(0, 100); // Limit to 100 results
    
  } catch (error) {
    console.error('Error in fallback search:', error);
    return directCodeSearch(query.toLowerCase());
  }
}

// Direct code search (most basic fallback)
async function directCodeSearch(query) {
  console.log('Using direct search for:', query);
  
  try {
    const db = await initializeDB();
    const tx = db.transaction(CHUNKS_STORE, 'readonly');
    const chunksStore = tx.objectStore(CHUNKS_STORE);
    
    const results = [];
    const cursor = await chunksStore.openCursor();
    
    // Limit the number of results
    const limit = 100;
    
    // Search through all chunks
    const searchAllChunks = async (cursor) => {
      if (!cursor || results.length >= limit) {
        return results;
      }
      
      const chunk = cursor.value;
      
      // Search this chunk for matching codes
      for (const code of chunk.codes) {
        if (results.length >= limit) {
          break;
        }
        
        if (
          code.code.toLowerCase().includes(query) ||
          code.description.toLowerCase().includes(query)
        ) {
          results.push(code);
        }
      }
      
      // Move to next chunk
      return searchAllChunks(await cursor.continue());
    };
    
    await searchAllChunks(cursor);
    return results;
    
  } catch (error) {
    console.error('Error in direct search:', error);
    return [];
  }
} 