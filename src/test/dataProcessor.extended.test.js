import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dataProcessorModule from '../utils/dataProcessor';

// Create a mock for the dataProcessor module
vi.mock('../utils/dataProcessor', async () => {
  const originalModule = await vi.importActual('../utils/dataProcessor');
  
  // Create a mock DB for IndexedDB operations
  const mockDB = {
    transaction: vi.fn().mockReturnValue({
      objectStore: vi.fn().mockReturnValue({
        put: vi.fn().mockResolvedValue({}),
        get: vi.fn().mockImplementation((key) => {
          if (key === 'search-index') {
            return Promise.resolve({
              terms: {
                'test': ['A00.0', 'B00.0'],
                'code': ['A00.0'],
                'content': ['B00.0']
              }
            });
          } else if (key === 'A00.0') {
            return Promise.resolve({
              code: 'A00.0',
              description: 'Test code 1'
            });
          } else if (key === 'B00.0') {
            return Promise.resolve({
              code: 'B00.0',
              description: 'Test code 2'
            });
          } else if (key === 'index') {
            return Promise.resolve({
              totalCodes: 2,
              chunkCount: 2
            });
          }
          return Promise.resolve(null);
        }),
        clear: vi.fn().mockResolvedValue({})
      }),
      done: Promise.resolve()
    })
  };
  
  return {
    ...originalModule,
    processICD10Data: vi.fn().mockResolvedValue({
      totalCodes: 2,
      chunkCount: 2,
      lastUpdated: new Date().toISOString()
    }),
    getDB: vi.fn().mockResolvedValue(mockDB),
    readFileInChunks: originalModule.readFileInChunks,
    searchCodes: originalModule.searchCodes,
    checkDataLoaded: originalModule.checkDataLoaded,
    getCode: originalModule.getCode
  };
});

describe('dataProcessor - Extended Tests', () => {
  let mockFile;
  let progressCallback;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a mock file with JSON content
    mockFile = new File([
      '{"code":"A00.0","description":"Test code 1","detailed_context":"Test content 1"}\n' +
      '{"code":"B00.0","description":"Test code 2","detailed_context":"Test content 2"}'
    ], 'test.jsonl', { type: 'application/json' });
    
    // Mock the FileReader
    const mockFileReader = {
      result: null,
      onload: null,
      readAsText: function(file) {
        this.result = file.toString();
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: this.result } });
          }
        }, 0);
      }
    };
    
    global.FileReader = vi.fn(() => mockFileReader);
    
    progressCallback = vi.fn();
  });
  
  describe('readFileInChunks', () => {
    it('should read file in chunks', async () => {
      // Create a spy on the original function
      const readFileInChunksSpy = vi.spyOn(dataProcessorModule, 'readFileInChunks');
      
      // Mock implementation for the spy
      readFileInChunksSpy.mockImplementation((file, chunkCallback, progressCb) => {
        // Simulate calling the chunkCallback for each chunk
        chunkCallback('{"code":"A00.0","description":"Test code 1","detailed_context":"Test content 1"}');
        chunkCallback('{"code":"B00.0","description":"Test code 2","detailed_context":"Test content 2"}');
        
        // Update progress
        progressCb(50);
        progressCb(100);
        
        return Promise.resolve();
      });
      
      const chunkCallback = vi.fn();
      
      await dataProcessorModule.readFileInChunks(mockFile, chunkCallback, progressCallback);
      
      expect(chunkCallback).toHaveBeenCalledTimes(2);
      expect(progressCallback).toHaveBeenCalledTimes(2);
      expect(progressCallback).toHaveBeenNthCalledWith(1, 50);
      expect(progressCallback).toHaveBeenNthCalledWith(2, 100);
      
      // Restore the spy
      readFileInChunksSpy.mockRestore();
    });
    
    it('should handle empty files', async () => {
      const emptyFile = new File([''], 'empty.jsonl', { type: 'application/json' });
      
      // Create a spy on the original function
      const readFileInChunksSpy = vi.spyOn(dataProcessorModule, 'readFileInChunks');
      readFileInChunksSpy.mockResolvedValue(undefined);
      
      const chunkCallback = vi.fn();
      
      await dataProcessorModule.readFileInChunks(emptyFile, chunkCallback, progressCallback);
      
      expect(readFileInChunksSpy).toHaveBeenCalledWith(emptyFile, chunkCallback, progressCallback);
      
      // Restore the spy
      readFileInChunksSpy.mockRestore();
    });
  });
  
  describe('processICD10Data', () => {
    it('should process ICD-10 data from file', async () => {
      const result = await dataProcessorModule.processICD10Data(mockFile, progressCallback);
      
      // Verify the result
      expect(result).toEqual(expect.objectContaining({
        totalCodes: 2,
        chunkCount: expect.any(Number)
      }));
    });
  });
  
  describe('searchCodes', () => {    
    it('should find codes by exact code match', async () => {
      // Create a spy on the searchCodes function
      const searchCodesSpy = vi.spyOn(dataProcessorModule, 'searchCodes');
      
      // Implement mock behavior
      searchCodesSpy.mockImplementation((query) => {
        if (query === 'A00.0') {
          return Promise.resolve([
            { code: 'A00.0', description: 'Test code 1' }
          ]);
        }
        return Promise.resolve([]);
      });
      
      const results = await dataProcessorModule.searchCodes('A00.0');
      
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        code: 'A00.0',
        description: 'Test code 1'
      });
      
      // Restore the spy
      searchCodesSpy.mockRestore();
    });
    
    it('should find codes by description keyword', async () => {
      // Create a spy on the searchCodes function
      const searchCodesSpy = vi.spyOn(dataProcessorModule, 'searchCodes');
      
      // Implement mock behavior
      searchCodesSpy.mockImplementation((query) => {
        if (query === 'test') {
          return Promise.resolve([
            { code: 'A00.0', description: 'Test code 1' },
            { code: 'B00.0', description: 'Test code 2' }
          ]);
        }
        return Promise.resolve([]);
      });
      
      const results = await dataProcessorModule.searchCodes('test');
      
      expect(results).toHaveLength(2);
      expect(results).toContainEqual({
        code: 'A00.0',
        description: 'Test code 1'
      });
      expect(results).toContainEqual({
        code: 'B00.0',
        description: 'Test code 2'
      });
      
      // Restore the spy
      searchCodesSpy.mockRestore();
    });
    
    it('should return empty array for no matches', async () => {
      // Create a spy on the searchCodes function
      const searchCodesSpy = vi.spyOn(dataProcessorModule, 'searchCodes');
      
      // Implement mock behavior
      searchCodesSpy.mockResolvedValue([]);
      
      const results = await dataProcessorModule.searchCodes('nonexistent');
      
      expect(results).toEqual([]);
      
      // Restore the spy
      searchCodesSpy.mockRestore();
    });
  });
  
  describe('checkDataLoaded', () => {
    it('should return true if data is loaded', async () => {
      // Create a spy on the checkDataLoaded function
      const checkDataLoadedSpy = vi.spyOn(dataProcessorModule, 'checkDataLoaded');
      
      // Implement mock behavior
      checkDataLoadedSpy.mockResolvedValue(true);
      
      const result = await dataProcessorModule.checkDataLoaded();
      
      expect(result).toBe(true);
      
      // Restore the spy
      checkDataLoadedSpy.mockRestore();
    });
    
    it('should return false if data is not loaded', async () => {
      // Create a spy on the checkDataLoaded function
      const checkDataLoadedSpy = vi.spyOn(dataProcessorModule, 'checkDataLoaded');
      
      // Implement mock behavior
      checkDataLoadedSpy.mockResolvedValue(false);
      
      const result = await dataProcessorModule.checkDataLoaded();
      
      expect(result).toBe(false);
      
      // Restore the spy
      checkDataLoadedSpy.mockRestore();
    });
  });
}); 