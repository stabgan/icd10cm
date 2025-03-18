import FlexSearch from 'flexsearch';

// Create indices when requested
self.addEventListener('message', async (event) => {
  const { action, data } = event.data;

  switch (action) {
    case 'createIndices':
      const indices = createIndices();
      self.postMessage({ 
        action: 'indicesCreated',
        indices: 'Indices created but cannot be directly transferred' 
      });
      break;

    case 'indexBatch':
      try {
        const { documents } = data;
        const result = indexDocuments(documents);
        self.postMessage({ 
          action: 'batchIndexed',
          result 
        });
      } catch (error) {
        self.postMessage({ 
          action: 'error',
          error: error.message 
        });
      }
      break;

    case 'search':
      try {
        const { query, documents, limit } = data;
        const results = await searchDocuments(query, documents, limit);
        self.postMessage({ 
          action: 'searchResults',
          results 
        });
      } catch (error) {
        self.postMessage({ 
          action: 'error', 
          error: error.message 
        });
      }
      break;

    default:
      self.postMessage({ 
        action: 'error', 
        error: `Unknown action: ${action}` 
      });
  }
});

// Worker internal state
let codeIndex = null;
let descriptionIndex = null;
let detailedIndex = null;

function createIndices() {
  // Create the indices
  codeIndex = new FlexSearch.Index({
    preset: 'performance',
    tokenize: 'forward',
    resolution: 9,
    cache: 100
  });
  
  descriptionIndex = new FlexSearch.Index({
    preset: 'match',
    tokenize: 'full',
    resolution: 9,
    cache: 100
  });
  
  detailedIndex = new FlexSearch.Index({
    preset: 'score',
    tokenize: 'full',
    resolution: 9,
    cache: 100
  });
  
  return true;
}

function indexDocuments(documents) {
  // Make sure indices are created
  if (!codeIndex || !descriptionIndex || !detailedIndex) {
    createIndices();
  }
  
  // Index the documents
  let count = 0;
  
  documents.forEach((doc, id) => {
    if (doc.code) {
      codeIndex.add(id, doc.code);
    }
    
    if (doc.description) {
      descriptionIndex.add(id, doc.description);
    }
    
    if (doc.detailed_context) {
      // For efficiency, only index the first 1000 characters
      const contextToIndex = doc.detailed_context.substring(0, 1000);
      detailedIndex.add(id, contextToIndex);
    }
    
    count++;
  });
  
  return { indexed: count };
}

async function searchDocuments(query, documents, limit = 100) {
  if (!query || query.trim() === '') {
    return [];
  }
  
  if (!codeIndex || !descriptionIndex || !detailedIndex) {
    throw new Error('Search indices not initialized');
  }
  
  // Search each index
  const codeResults = await codeIndex.search(query, { limit });
  const descResults = await descriptionIndex.search(query, { limit });
  const detailedResults = await detailedIndex.search(query, { limit: 20 });
  
  // Combine all results and remove duplicates
  const allIds = [...new Set([...codeResults, ...descResults, ...detailedResults])];
  
  if (allIds.length === 0) {
    return [];
  }
  
  // Boost exact matches
  const exactMatches = allIds.filter(id => {
    const doc = documents[parseInt(id)];
    return doc && doc.code && doc.code.toUpperCase() === query.toUpperCase();
  });
  
  // Combine results, putting exact matches first
  const combinedIds = [...new Set([...exactMatches, ...allIds])].slice(0, limit);
  
  // Map IDs back to documents
  return combinedIds
    .map(id => documents[parseInt(id)])
    .filter(Boolean);
} 