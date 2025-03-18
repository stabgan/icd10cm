import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  processICD10Data, 
  checkDataLoaded, 
  getIndexData,
  getCode,
  searchCodes
} from '../utils/dataProcessor';

// Mock file with ICD-10 data
const mockFile = new File(
  [
    '{"code":"A001","description":"Test code 1","detailed_context":"Test context 1"}\n' +
    '{"code":"B002","description":"Test code 2","detailed_context":"Test context 2"}'
  ],
  'test.jsonl',
  { type: 'application/json' }
);

// Mock the database returns
vi.mock('idb', () => {
  const mockData = {
    main: {
      id: 'main',
      totalCodes: 2,
      chunkCount: 2,
      chunkMap: { A: 'A', B: 'B' },
      lastUpdated: new Date().toISOString()
    }
  };
  
  const mockCodes = {
    'A001': { code: 'A001', description: 'Test code 1', detailed_context: 'Test context 1' },
    'B002': { code: 'B002', description: 'Test code 2', detailed_context: 'Test context 2' }
  };
  
  const mockSearchIndex = {
    main: {
      id: 'main',
      data: {
        'test': [
          { code: 'A001', description: 'Test code 1' },
          { code: 'B002', description: 'Test code 2' }
        ]
      }
    }
  };
  
  return {
    openDB: () => Promise.resolve({
      transaction: (stores, mode) => {
        return {
          objectStore: (store) => {
            return {
              put: (data) => Promise.resolve(data),
              get: (key) => {
                if (store === 'index' && key === 'main') {
                  return Promise.resolve(mockData.main);
                } else if (store === 'codes') {
                  return Promise.resolve(mockCodes[key] || null);
                } else if (store === 'search-index' && key === 'main') {
                  return Promise.resolve(mockSearchIndex.main);
                }
                return Promise.resolve(null);
              },
              clear: () => Promise.resolve()
            };
          },
          done: Promise.resolve()
        };
      },
      objectStoreNames: {
        contains: () => true
      }
    })
  };
});

describe('dataProcessor', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset mocks
    vi.clearAllMocks();
  });
  
  describe('processICD10Data', () => {
    it('should process the data file and update localStorage', async () => {
      const progressCallback = vi.fn();
      
      const result = await processICD10Data(mockFile, progressCallback);
      
      // Check that localStorage was updated
      expect(localStorage.getItem('icd10cm-data-loaded')).toBe('true');
      expect(localStorage.getItem('icd10cm-data-count')).toBeDefined();
      
      // Verify progress callback was called
      expect(progressCallback).toHaveBeenCalled();
    });
  });
  
  describe('checkDataLoaded', () => {
    it('should return false when data is not loaded', async () => {
      const result = await checkDataLoaded();
      expect(result).toBe(false);
    });
    
    it('should return true when data is loaded', async () => {
      // Set localStorage to indicate data is loaded
      localStorage.setItem('icd10cm-data-loaded', 'true');
      
      // Run the test
      const result = await checkDataLoaded();
      
      // This would be true with our mocked setup
      expect(result).toBe(true);
    });
  });
  
  describe('getIndexData', () => {
    it('should retrieve index data from the database', async () => {
      // Set localStorage to simulate data being loaded
      localStorage.setItem('icd10cm-data-loaded', 'true');
      
      // Get the index data
      const indexData = await getIndexData();
      
      // Check that we got valid index data
      expect(indexData).toEqual({
        id: 'main',
        totalCodes: 2,
        chunkCount: 2,
        chunkMap: { A: 'A', B: 'B' },
        lastUpdated: expect.any(String)
      });
    });
  });
  
  describe('searchCodes', () => {
    it('should return matching codes for a search query', async () => {
      // Set localStorage to simulate data being loaded
      localStorage.setItem('icd10cm-data-loaded', 'true');
      
      // Then search for codes
      const results = await searchCodes('test');
      
      // Expect results to be an array with specific matches
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
      expect(results).toContainEqual(expect.objectContaining({ code: 'A001' }));
      expect(results).toContainEqual(expect.objectContaining({ code: 'B002' }));
    });
  });
}); 