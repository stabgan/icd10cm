import FlexSearch from 'flexsearch';

// Create separate indices for different search fields
export function createSearchIndices() {
  return {
    codeIndex: new FlexSearch.Index({
      preset: 'performance',
      tokenize: 'forward',
      resolution: 9,
      cache: 100
    }),
    descriptionIndex: new FlexSearch.Index({
      preset: 'match',
      tokenize: 'full',
      resolution: 9,
      cache: 100
    }),
    detailedIndex: new FlexSearch.Index({
      preset: 'score',
      tokenize: 'full',
      resolution: 9,
      cache: 100
    })
  };
}

// Index a batch of documents
export function indexBatch(indices, documents) {
  const { codeIndex, descriptionIndex, detailedIndex } = indices;
  
  documents.forEach((doc, id) => {
    // Index each field separately
    if (doc.code) {
      codeIndex.add(id, doc.code);
    }
    
    if (doc.description) {
      descriptionIndex.add(id, doc.description);
    }
    
    if (doc.detailed_context) {
      // For efficiency, we only index the first 1000 characters of detailed context
      const contextToIndex = doc.detailed_context.substring(0, 1000);
      detailedIndex.add(id, contextToIndex);
    }
  });
  
  return { indexed: documents.length };
}

// Search across all indices
export async function search(indices, documentsMap, query, limit = 100) {
  if (!indices || !query || query.trim() === '') {
    return [];
  }
  
  const { codeIndex, descriptionIndex, detailedIndex } = indices;
  
  // Search each index
  const codeResults = await codeIndex.search(query, { limit });
  const descResults = await descriptionIndex.search(query, { limit });
  const detailedResults = await detailedIndex.search(query, { limit: 20 }); // Limit detailed results
  
  // Combine all results and remove duplicates
  const allIds = [...new Set([...codeResults, ...descResults, ...detailedResults])];
  
  // If no results, return empty array
  if (allIds.length === 0) {
    return [];
  }
  
  // Boost exact matches
  const exactMatches = allIds.filter(id => {
    const doc = documentsMap.get(parseInt(id));
    return doc && doc.code && doc.code.toUpperCase() === query.toUpperCase();
  });
  
  // Combine results, putting exact matches first
  const combinedIds = [...new Set([...exactMatches, ...allIds])].slice(0, limit);
  
  // Map IDs back to documents
  return combinedIds
    .map(id => documentsMap.get(parseInt(id)))
    .filter(Boolean); // Remove undefined entries
}

// Export a function to generate a documents map for fast lookup
export function createDocumentsMap(documents) {
  const map = new Map();
  documents.forEach((doc, index) => {
    map.set(index, doc);
  });
  return map;
}

// Export adapter for easy integration with existing code
export const flexSearchAdapter = {
  createIndices: createSearchIndices,
  indexBatch,
  search,
  createDocumentsMap
}; 