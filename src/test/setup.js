import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { vi } from 'vitest';
import { beforeAll, afterEach } from 'vitest';

// Add custom queries
screen.getByAcceptingFiles = function() {
  return screen.getByRole('textbox', { hidden: true, type: 'file' }) || 
         document.querySelector('input[type="file"]');
};

// Need to define this before any imports that might use it
const mockMatchMedia = vi.fn().mockImplementation(query => ({
  matches: query === '(prefers-color-scheme: dark)', // Default to false, true for dark mode query
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Mock window.matchMedia - needed for ThemeContext tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
  configurable: true,
});

// Make sure global.matchMedia is also set
global.matchMedia = mockMatchMedia;

// Mock File.prototype.text
File.prototype.text = function() {
  return Promise.resolve(this.toString());
};

// Mock Blob.prototype.text for slices
Blob.prototype.text = function() {
  return Promise.resolve(this.toString());
};

// Mock IndexedDB
class IDBObjectStore {
  constructor(name) {
    this.name = name;
    this.data = new Map();
  }
  
  put(item, key) {
    const request = new IDBRequest();
    this.data.set(key || item.code || item.id, item);
    setTimeout(() => request.triggerSuccess(item), 0);
    return request;
  }
  
  get(key) {
    const request = new IDBRequest();
    const value = this.data.get(key);
    setTimeout(() => request.triggerSuccess(value), 0);
    return request;
  }
  
  clear() {
    const request = new IDBRequest();
    this.data.clear();
    setTimeout(() => request.triggerSuccess(undefined), 0);
    return request;
  }
}

class IDBTransaction {
  constructor(db, storeNames) {
    this.db = db;
    this.storeNames = storeNames;
    this.oncomplete = null;
  }
  
  objectStore(name) {
    return this.db.stores.get(name);
  }
}

class IDBRequest {
  constructor() {
    this.result = null;
    this.error = null;
    this.readyState = 'pending';
    this.onsuccess = null;
    this.onerror = null;
  }
  
  triggerSuccess(value) {
    this.result = value;
    this.readyState = 'done';
    if (this.onsuccess) {
      this.onsuccess({ target: { result: value } });
    }
  }
  
  triggerError(error) {
    this.error = error;
    this.readyState = 'done';
    if (this.onerror) {
      this.onerror({ target: { error } });
    }
  }
}

class IDBOpenDBRequest extends IDBRequest {
  constructor() {
    super();
    this.onupgradeneeded = null;
    this.onblocked = null;
  }
}

class IDBDatabase {
  constructor(name) {
    this.name = name;
    this.stores = new Map();
    this.objectStoreNames = {
      contains: (name) => this.stores.has(name)
    };
  }
  
  createObjectStore(name) {
    const store = new IDBObjectStore(name);
    this.stores.set(name, store);
    return store;
  }
  
  transaction(storeNames, mode = 'readonly') {
    return new IDBTransaction(this, storeNames);
  }
  
  close() {}
}

class IDBFactory {
  constructor() {
    this.databases = new Map();
  }
  
  open(name, version) {
    const request = new IDBOpenDBRequest();
    
    setTimeout(() => {
      let db = this.databases.get(name);
      if (!db) {
        db = new IDBDatabase(name);
        this.databases.set(name, db);
        
        if (request.onupgradeneeded) {
          request.onupgradeneeded({ 
            target: { result: db },
            oldVersion: 0,
            newVersion: version 
          });
        }
      }
      
      request.triggerSuccess(db);
    }, 0);
    
    return request;
  }
  
  deleteDatabase(name) {
    const request = new IDBRequest();
    setTimeout(() => {
      this.databases.delete(name);
      request.triggerSuccess(undefined);
    }, 0);
    return request;
  }
}

// Mock console to suppress unnecessary warnings during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out React router warnings that are expected during tests
  if (args[0] && typeof args[0] === 'string' && args[0].includes('React Router')) {
    return;
  }
  
  // Filter out matchMedia errors
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Cannot read properties of undefined (reading \'matches\')')) {
    return;
  }
  
  // Pass other errors through
  originalConsoleError(...args);
};

// For ResizeObserver errors
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Set up localStorage mock
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock file reader
class MockFileReader {
  constructor() {
    this.result = null;
    this.onload = null;
  }
  
  readAsText() {
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: { result: this.result } });
      }
    }, 0);
  }
}

window.FileReader = MockFileReader;

// Mock JSON.parse to handle Blob objects
const originalJSONParse = JSON.parse;
JSON.parse = function(text) {
  if (text === '[object Blob]') {
    return { dummy: 'Mocked blob data' };
  }
  return originalJSONParse(text);
};

// Set up global mocks for tests
beforeAll(() => {
  // Mock IndexedDB with our implementation
  global.indexedDB = new IDBFactory();
  
  // Mock window.URL.createObjectURL
  if (typeof window.URL.createObjectURL === 'undefined') {
    Object.defineProperty(window.URL, 'createObjectURL', {
      value: vi.fn(() => 'mock-object-url')
    });
  }
  
  // Mock IntersectionObserver
  class IntersectionObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe() { return null; }
    unobserve() { return null; }
    disconnect() { return null; }
  }
  global.IntersectionObserver = IntersectionObserver;
  
  // Mock window.scroll
  window.scroll = vi.fn();
  window.scrollTo = vi.fn();
  
  // Create a mock ResizeObserver
  window.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));
  
  // Mock document methods potentially used by components
  document.createRange = () => ({
    setStart: () => {},
    setEnd: () => {},
    commonAncestorContainer: {
      nodeName: 'BODY',
      ownerDocument: document
    },
    getBoundingClientRect: () => ({
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      width: 0,
      height: 0
    })
  });
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Mock the CSS modules
vi.mock('*.module.css', () => {
  return new Proxy({}, {
    get: (target, key) => key
  });
}); 