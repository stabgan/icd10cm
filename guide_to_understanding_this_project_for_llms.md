# ICD-10-CM Browser: Comprehensive Guide for LLMs

This guide provides a detailed overview of the ICD-10-CM Browser application, designed to help LLMs and AI agents understand the architecture, data flow, implementation details, and recent optimizations.

## Project Overview

The ICD-10-CM Browser is a React-based web application that allows users to search and browse International Classification of Diseases, 10th Revision, Clinical Modification (ICD-10-CM) codes. It operates entirely client-side, using browser storage (IndexedDB) to process and store large medical datasets without requiring a server.

### Key Capabilities
- Process large JSONL files (up to 1.2GB) directly in the browser
- Store and index medical code data for efficient searching
- Provide a responsive UI that works across all device sizes
- Support dark/light mode theming based on user preference
- Display detailed code information with Markdown formatting
- Operate entirely offline with no server requirements

## Architecture Overview

The application follows a modern React architecture with these key components:

### Main Application Structure
```
src/
├── components/         # UI components
├── context/           # React context providers
├── utils/             # Utility functions and data processing
├── test/              # Test files (unit, integration, e2e)
├── assets/            # Static assets (images, icons)
├── App.jsx            # Main application component
└── main.jsx           # Application entry point
```

### Core Components
1. `SplashScreen` - Handles data upload and processing
2. `Search` - Provides search interface with suggestions
3. `CodeGrid` - Displays search results in a grid layout
4. `CodeDetail` - Displays detailed information for a specific code
5. `ThemeToggle` - Manages dark/light mode preferences
6. `Header` and `Footer` - Application-wide navigation and information

## Data Flow

The application's data flow follows this pattern:

1. **Initial Load**:
   - Check if data exists in IndexedDB
   - If not, show SplashScreen for data upload
   - If data exists, show main interface

2. **Data Import Process**:
   - User uploads JSONL file via SplashScreen
   - File is processed in chunks to avoid memory issues
   - Each chunk is parsed and stored in IndexedDB
   - Indexes are created for efficient searching
   - UI is refreshed to show search interface

3. **Search Flow**:
   - User enters query in Search component
   - Search component sends query to dataProcessor
   - dataProcessor searches IndexedDB with multi-tier strategy:
     - First attempts exact code match
     - Then searches through indexed terms
     - Falls back to direct search if needed
   - Results are returned to Search component
   - Results are displayed in CodeGrid

4. **Detail View Flow**:
   - User selects code from search results
   - App navigates to CodeDetail route
   - CodeDetail component retrieves code data from IndexedDB
   - Markdown content is rendered with proper formatting

## Storage Strategy

The application uses IndexedDB with multiple stores:

1. **`CHUNKS_STORE`** - Stores the actual code data:
   - Key: Code ID (e.g., "A00.0")
   - Value: Complete code object with description and detailed context

2. **`SEARCH_INDEX_STORE`** - Stores search indexes:
   - Key: Searchable term
   - Value: Array of code IDs containing that term

3. **`META_STORE`** - Stores metadata about the imported dataset:
   - Key: Metadata property name
   - Value: Property value (e.g., total count, import date)

## Implementation Details

### Data Processing Pipeline

The `dataProcessor.js` utility handles the core data management:

1. **File Processing**:
   ```javascript
   // Process file in chunks to avoid memory issues
   async function processFile(file, progressCallback) {
     const chunkSize = 10 * 1024 * 1024; // 10MB chunks
     const db = await openDB();
     let offset = 0;
     
     while (offset < file.size) {
       // Read chunk, parse JSONL, store in IndexedDB
       const chunk = file.slice(offset, offset + chunkSize);
       await processChunk(chunk, db);
       offset += chunkSize;
       progressCallback(Math.min(100, Math.floor((offset / file.size) * 100)));
     }
     
     // Build search indexes after all chunks are processed
     await buildSearchIndex(db);
   }
   ```

2. **Search Implementation**:
   ```javascript
   // Multi-tier search strategy
   async function searchCodes(query) {
     if (!query) return [];
     const db = await openDB();
     
     // First try exact code match
     const exactMatch = await db.get(CHUNKS_STORE, query.toUpperCase());
     if (exactMatch) return [exactMatch];
     
     // Then try search index
     try {
       const tx = db.transaction([SEARCH_INDEX_STORE, CHUNKS_STORE], 'readonly');
       const indexStore = tx.objectStore(SEARCH_INDEX_STORE);
       const chunksStore = tx.objectStore(CHUNKS_STORE);
       
       // Check if search index exists
       const indexCount = await indexStore.count();
       if (indexCount === 0) {
         // Fall back to direct search if no index
         return directCodeSearch(query, chunksStore);
       }
       
       // Search through index
       const searchTerms = query.toLowerCase().split(/\s+/);
       const results = new Map();
       
       for (const term of searchTerms) {
         const codeIds = await indexStore.get(term);
         if (codeIds) {
           for (const id of codeIds) {
             results.set(id, (results.get(id) || 0) + 1);
           }
         }
       }
       
       // Sort by relevance and fetch full code objects
       const sortedIds = [...results.entries()]
         .sort((a, b) => b[1] - a[1])
         .map(entry => entry[0])
         .slice(0, 100);
       
       const codes = await Promise.all(
         sortedIds.map(id => chunksStore.get(id))
       );
       
       return codes.filter(Boolean);
     } catch (error) {
       console.error('Search error:', error);
       return [];
     }
   }
   
   // Direct search fallback for when index is not available
   async function directCodeSearch(query, store) {
     console.log('Attempting direct search for:', query);
     const allCodes = [];
     const lowerQuery = query.toLowerCase();
     
     // Search all codes in the database
     await store.openCursor().then(function processNextCode(cursor) {
       if (!cursor || allCodes.length >= 100) return allCodes;
       
       const code = cursor.value;
       if (code.code.toLowerCase().includes(lowerQuery) || 
           code.description.toLowerCase().includes(lowerQuery)) {
         allCodes.push(code);
       }
       
       return cursor.continue().then(processNextCode);
     });
     
     return allCodes;
   }
   ```

### UI Components

**SplashScreen Component**:
- Handles file upload with drag-and-drop or file picker
- Displays progress during file processing
- Redirects to main interface after processing completes
- Recently updated to use `window.location.reload()` for more reliable redirect

**Search Component**:
- Provides input field with real-time suggestions
- Implements debounced search to prevent excessive database queries
- Maintains focus on input field for better user experience
- Uses click-outside detection to close suggestions when appropriate
- Recently updated with improved focus handling and keyboard navigation

**CodeDetail Component**:
- Fetches and displays detailed code information
- Renders Markdown content with proper formatting
- Provides navigation back to search results

**ThemeToggle Component**:
- Detects system color scheme preference
- Allows manual override of theme
- Persists preference in localStorage

## Recent Optimizations

### 1. Local-Only Usage Optimizations
- Removed GitHub Pages deployment configuration
- Simplified base path in Vite config to use root path ('/')
- Enhanced error handling for browser APIs
- Improved robustness of IndexedDB operations

### 2. Search Functionality Improvements
- Added multi-tier search strategy with fallbacks
- Implemented direct search capability when index is not available
- Enhanced search relevance by considering partial matches
- Limited results to 100 entries for better performance
- Added case-insensitive searching for better user experience

### 3. UI and UX Enhancements
- Fixed focus management in Search component
- Added autoFocus attribute to search input
- Converted search icon to a button for better accessibility
- Implemented robust click-outside detection
- Improved feedback during long-running operations

### 4. Performance Optimizations
- Implemented debounced search to reduce database load
- Added cleanup functions to prevent memory leaks
- Enhanced chunk processing to better handle large files
- Improved error handling and recovery mechanisms

### 5. Testing Framework Enhancements
- Added Playwright for end-to-end testing
- Improved test coverage for UI components
- Enhanced mocking for IndexedDB in tests
- Added integration tests for search and view functionality

## Key Files and Their Functions

### 1. `src/utils/dataProcessor.js`
The central utility for data management with these key functions:
- `openDB()` - Opens connection to IndexedDB
- `processFile()` - Processes JSONL file in chunks
- `buildSearchIndex()` - Creates search indexes for efficient queries
- `searchCodes()` - Multi-tier search implementation
- `getCode()` - Retrieves specific code details
- `directCodeSearch()` - Fallback search method

### 2. `src/components/Search.jsx`
The search interface component with these features:
- Debounced input handling
- Suggestions display
- Keyboard navigation
- Focus management
- Click-outside detection

### 3. `src/components/SplashScreen.jsx`
Handles data import with these capabilities:
- File upload interface
- Progress tracking
- Error handling
- Database reset option
- Redirect after completion

### 4. `src/context/ThemeContext.jsx`
Manages application theming with:
- System preference detection
- Manual theme override
- Theme persistence
- Context provider for theme consumers

### 5. `src/App.jsx`
Main application component that:
- Sets up routing
- Handles theme context
- Manages main application flow
- Provides error boundaries

## Testing Framework

The project includes comprehensive testing at multiple levels:

### 1. Unit Tests
Located in `src/test` with files like:
- `Header.test.jsx`
- `Footer.test.jsx`
- `ThemeToggle.test.jsx`
- `dataProcessor.test.js`

### 2. Integration Tests
Tests component interactions:
- `SearchAndView.test.jsx` - Tests search-to-detail flow

### 3. End-to-End Tests
Located in `src/test/e2e` using Playwright:
- `basic.spec.js` - Tests core application flows

## Data Format

The application expects data in JSONL format, with each line containing a JSON object:
```json
{"code":"A00.0","description":"Cholera due to Vibrio cholerae","detailed_context":"# Detailed information in Markdown format"}
```

Each entry must include:
- `code` - The ICD-10-CM code identifier (e.g., "E11.9")
- `description` - Brief description of the code
- `detailed_context` - Detailed information formatted in Markdown

## Performance Considerations

To handle large datasets efficiently, the application:
- Processes files in 10MB chunks
- Uses a worker thread for intensive operations
- Implements debounced search
- Limits search results to manageable numbers
- Uses IndexedDB cursors for optimal traversal
- Implements cleanup functions to prevent memory leaks

## Technology Stack

- **React**: UI framework
- **React Router**: For navigation
- **Tailwind CSS**: For styling
- **IndexedDB**: For client-side storage
- **idb Library**: For IndexedDB interactions
- **Markdown-it**: For Markdown rendering
- **Vite**: For development and building
- **Vitest**: For testing
- **Playwright**: For end-to-end testing

## Browser Compatibility

The application is designed to work in modern browsers:
- **Google Chrome**: Primary test platform, best IndexedDB performance
- **Microsoft Edge**: Fully supported
- **Firefox**: Fully supported
- **Safari**: Supported with some IndexedDB limitations

## Troubleshooting Common Issues

### 1. Data Import Failures
- **Possible Causes**: Malformed JSONL, memory constraints, browser limits
- **Solutions**: Verify file format, try smaller chunks, use Chrome/Edge

### 2. Search Not Returning Expected Results
- **Possible Causes**: Missing index, corrupted data, invalid query
- **Solutions**: Reset database and reimport, verify search terms, check browser console

### 3. Display Issues
- **Possible Causes**: CSS conflicts, browser compatibility issues
- **Solutions**: Toggle theme, refresh page, clear browser cache

## Contributing Guidelines

To contribute to the project:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Licensing

This project is licensed under the MIT License, allowing for free use, modification, and distribution with proper attribution. 