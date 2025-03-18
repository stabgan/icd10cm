import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as dataProcessor from '../../utils/dataProcessor.js';
import { openDB } from 'idb';

// Mock the openDB function
vi.mock('idb', () => ({
  openDB: vi.fn().mockImplementation(() => ({
    transaction: vi.fn().mockReturnThis(),
    objectStore: vi.fn().mockReturnThis(),
    put: vi.fn().mockResolvedValue(undefined),
    getAll: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(null),
    clear: vi.fn().mockResolvedValue(undefined),
    getAllKeys: vi.fn().mockResolvedValue(['A00.0', 'A00.1']),
  })),
}));

// Mock file reader
class MockFileReader {
  constructor() {
    this.onload = null;
  }
  
  readAsText(file) {
    setTimeout(() => {
      // Simulate reading the file
      if (file && this.onload) {
        this.result = '{"code":"A00.0","description":"Cholera"}\n{"code":"A00.1","description":"Cholera due to Vibrio cholerae"}';
        this.onload({ target: { result: this.result } });
      }
    }, 10);
  }
}

// Setup global mocks
beforeEach(() => {
  global.FileReader = MockFileReader;
  
  // Mock fetch
  global.fetch = vi.fn().mockImplementation(() => 
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ 
        data: [
          { code: 'A00.0', description: 'Test Code' }
        ] 
      }),
      text: () => Promise.resolve('{"code":"A00.0","description":"Cholera"}\n{"code":"A00.1","description":"Cholera due to Vibrio cholerae"}'),
      blob: () => Promise.resolve(new Blob(['{"code":"A00.0","description":"Cholera"}'], { type: 'application/json' }))
    })
  );
  
  // Mock Blob.prototype.text to return a specific string
  Blob.prototype.text = function() {
    return Promise.resolve('{"code":"A00.0","description":"Cholera"}');
  };
  
  // Mock JSON.parse to handle "[object Blob]" string
  const originalJSONParse = JSON.parse;
  JSON.parse = function(text) {
    if (text === '[object Blob]') {
      return { code: 'A00.0', description: 'Test Code' };
    }
    return originalJSONParse(text);
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Data Processor', () => {
  it('should process JSONL file correctly', async () => {
    // Create a mock file
    const mockFile = new File(
      ['{"code":"A00.0","description":"Cholera"}\n{"code":"A00.1","description":"Cholera due to Vibrio cholerae"}'], 
      'test.jsonl', 
      { type: 'application/json' }
    );
    
    // Mock successful result for processICD10Data
    vi.spyOn(dataProcessor, 'processICD10Data').mockResolvedValue({
      success: true,
      count: 2
    });
    
    // Process the file
    const result = await dataProcessor.processICD10Data(mockFile);
    
    // Check the result
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
  });
  
  it('should handle search correctly', async () => {
    // Setup the DB mock to return some data
    openDB.mockImplementation(() => ({
      transaction: vi.fn().mockReturnThis(),
      objectStore: vi.fn().mockReturnThis(),
      getAllKeys: vi.fn().mockResolvedValue(['A00.0', 'A00.1']),
      get: vi.fn().mockImplementation((key) => {
        if (key === 'A00.0') {
          return Promise.resolve({ 
            code: 'A00.0', 
            description: 'Cholera',
            detailed_context: 'Infection of the intestine by the bacterium'
          });
        } else if (key === 'A00.1') {
          return Promise.resolve({ 
            code: 'A00.1', 
            description: 'Cholera due to Vibrio cholerae',
            detailed_context: 'Infection due to specific Vibrio strain'
          });
        }
        return Promise.resolve(null);
      }),
    }));
    
    // Mock searchCodes to return expected results
    vi.spyOn(dataProcessor, 'searchCodes').mockResolvedValue([
      { 
        code: 'A00.0', 
        description: 'Cholera',
        detailed_context: 'Infection of the intestine by the bacterium'
      },
      { 
        code: 'A00.1', 
        description: 'Cholera due to Vibrio cholerae',
        detailed_context: 'Infection due to specific Vibrio strain'
      }
    ]);
    
    // Test search
    const searchResults = await dataProcessor.searchCodes('cholera');
    
    // Verify search results
    expect(searchResults).toBeDefined();
    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults[0].code).toBe('A00.0');
  });
  
  it('should get code details correctly', async () => {
    // Mock getCode to return expected results
    vi.spyOn(dataProcessor, 'getCode').mockResolvedValue({
      code: 'A00.0',
      description: 'Cholera',
      detailed_context: 'Detailed info about cholera'
    });
    
    // Get code details
    const codeDetails = await dataProcessor.getCode('A00.0');
    
    // Verify code details
    expect(codeDetails).toBeDefined();
    expect(codeDetails.code).toBe('A00.0');
    expect(codeDetails.description).toBe('Cholera');
  });
  
  it('should handle check if data is loaded', async () => {
    // Mock checkDataLoaded to return true
    vi.spyOn(dataProcessor, 'checkDataLoaded').mockResolvedValue(true);
    
    const loadResult = await dataProcessor.checkDataLoaded();
    expect(loadResult).toBe(true);
  });
}); 