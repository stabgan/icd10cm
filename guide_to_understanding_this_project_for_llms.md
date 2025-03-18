# ICD-10-CM Browser: Comprehensive Guide for LLMs

This guide provides a detailed overview of the ICD-10-CM Browser application, designed to help LLMs and AI agents understand the architecture, data flow, implementation details, and recent optimizations.

## Project Overview

The ICD-10-CM Browser is a full-stack application that allows users to search and browse International Classification of Diseases, 10th Revision, Clinical Modification (ICD-10-CM) codes. It consists of a React frontend and a Node.js/Express backend with MongoDB for data storage.

### Repository Information
- **Repository**: [https://github.com/stabgan/icd10cm](https://github.com/stabgan/icd10cm)
- **Primary Branch**: main
- **Author**: Kaustabh (GitHub: stabgan, Email: mail@stabgan.com)

### Key Capabilities
- Process and store large JSONL files of ICD-10-CM codes in MongoDB
- Provide a responsive UI that works across all device sizes
- Support dark/light mode theming based on user preference
- Display detailed code information with proper formatting
- Available as both web application and Electron desktop app
- Feature alphabetical browsing of codes via sidebar
- Allow database reset and reload functionality
- Operate with MongoDB backend for robust data management

## Architecture Overview

The application follows a modern full-stack architecture with these key components:

### Main Application Structure
```
/
├── server.js            - Express server with MongoDB integration
├── start.js             - Helper script to start everything together
├── electron/            - Electron app configuration files
│   ├── main.cjs         - Main Electron process
│   └── preload.js       - Preload script for secure IPC
├── src/                 - React frontend application
│   ├── components/      - UI components
│   │   └── CodeSidebar.jsx - Alphabetical code browser sidebar
│   ├── contexts/        - React context providers
│   ├── pages/           - Page components
│   └── utils/           - Utility functions including API service
├── scripts/             - Build and utility scripts
│   └── build-windows.cjs - Windows-specific build script
└── build/               - Build assets and icons
```

### Core Components

#### Backend
1. **Express Server** - Handles API requests and data management
2. **MongoDB Integration** - Stores and indexes ICD-10-CM codes
3. **File Processing** - Parses and indexes JSONL data files
4. **Search API** - Provides efficient multi-tiered search capabilities

#### Frontend
1. `App.jsx` - Main application component with routing
2. `HomePage` - Primary interface with search functionality
3. `CodeDetailPage` - Displays detailed code information
4. `CodeSidebar` - Alphabetical navigation of codes
5. `SplashScreen` - Handles file upload and initial data setup
6. `Search` - Provides search interface with real-time results
7. `ThemeContext` - Manages dark/light mode preferences

#### Desktop App
1. `electron/main.cjs` - Main Electron process managing app lifecycle
2. `electron/preload.js` - Secure bridge between renderer and main processes
3. `forge.config.js` - Electron Forge configuration for packaging

## Data Flow

The application's data flow follows this pattern:

1. **Initial Load**:
   - Express server connects to MongoDB
   - Frontend checks if data is available in MongoDB
   - If no data, show SplashScreen for data upload
   - If data exists, show main interface

2. **Data Import Process**:
   - User uploads JSONL file via SplashScreen
   - File is transferred to server via multipart form
   - Server processes file in chunks to avoid memory issues
   - Each chunk is parsed and stored in MongoDB collections
   - Indexes are created for efficient searching
   - UI is refreshed to show search interface

3. **Search Flow**:
   - User enters query in Search component
   - Request is sent to the backend API
   - Server searches MongoDB with multi-tier strategy:
     - First attempts exact code match
     - Then searches through text indexes
     - Uses regex for partial matches
   - Results are returned to frontend
   - Results are displayed in search results grid

4. **Detail View Flow**:
   - User selects code from search results
   - App navigates to CodeDetailPage route
   - Code data is fetched from server by ID
   - Detailed information is displayed with proper formatting

5. **Reset Database Flow**:
   - User clicks "Reset Database" button
   - Confirmation dialog is displayed
   - Request is sent to reset-database endpoint
   - Server clears MongoDB collections
   - Server reloads data from last uploaded file
   - UI is refreshed to show updated data

6. **Alphabetical Browsing Flow**:
   - Sidebar shows letters with available codes
   - User selects a letter to see all codes starting with that letter
   - Codes are fetched from server by letter prefix
   - User can select code to view details

## Database Structure

The application uses MongoDB with multiple collections:

1. **`codes`** - Stores the actual code data:
   - Key: Code ID (e.g., "A00.0")
   - Value: Complete code object with description and detailed context

2. **`indexMeta`** - Stores metadata about the imported dataset:
   - Total code count
   - Letter-based code mapping
   - Last update timestamp
   - Processing statistics

## Implementation Details

### Backend Data Processing

The server handles data processing through these key operations:

1. **File Upload and Processing**:
   ```javascript
   // Process file and store in MongoDB
   app.post('/api/process-file', upload.single('file'), async (req, res) => {
     if (!req.file) {
       return res.status(400).json({ error: 'No file uploaded' });
     }

     const filePath = req.file.path;
     processingStatus = {
       inProgress: true,
       progress: 0,
       message: 'Starting processing...',
       error: null,
       fileData: {
         path: filePath,
         originalName: req.file.originalname,
         size: req.file.size
       }
     };
     
     // Return immediately with acknowledgment
     res.status(200).json({ 
       message: 'File upload received, processing started',
       status: 'processing'
     });
     
     // Start processing in the background
     processFileInBackground(filePath);
   });
   ```

2. **Database Reset**:
   ```javascript
   // Add endpoint to reset database and reload data from a file
   app.post('/api/reset-database', async (req, res) => {
     try {
       const db = await connectToMongo();
       
       if (!db) {
         return res.status(500).json({ 
           error: 'Failed to connect to MongoDB',
           success: false
         });
       }
       
       // Find last processed file info
       const indexCollection = db.collection(indexMetaCollection);
       const indexData = await indexCollection.findOne({ id: 'main' });
       
       if (!indexData) {
         return res.status(404).json({ 
           error: 'No data has been loaded before, cannot reset',
           success: false
         });
       }
       
       // Store processing status
       processingStatus = {
         inProgress: true,
         progress: 0,
         message: 'Resetting database...',
         error: null
       };
       
       // Return immediately with acknowledgment
       res.status(200).json({ 
         message: 'Database reset started',
         status: 'processing'
       });
       
       // Reset database in background
       const collection = db.collection(codesCollection);
       await collection.deleteMany({});
       await indexCollection.deleteMany({});
       
       // Check if the last uploaded file data exists
       if (processingStatus.fileData && processingStatus.fileData.path) {
         processFileInBackground(processingStatus.fileData.path);
       } else {
         processingStatus = {
           inProgress: false,
           progress: 0,
           message: 'Reset completed but no previous file data found to reload',
           error: null
         };
       }
     } catch (error) {
       console.error('Error resetting database:', error);
       processingStatus = {
         inProgress: false,
         progress: 0,
         message: 'Error resetting database',
         error: error.message
       };
     }
   });
   ```

3. **Search Implementation**:
   ```javascript
   // Search codes
   app.get('/api/search', async (req, res) => {
     const query = req.query.q;
     if (!query) {
       return res.json({ results: [] });
     }
     
     try {
       const db = await connectToMongo();
       if (!db) {
         return res.status(500).json({ 
           error: 'Failed to connect to MongoDB',
           results: [] 
         });
       }
       
       const collection = db.collection(codesCollection);
       
       // First try exact code match
       const exactMatch = await collection.findOne({ code: query.toUpperCase() });
       if (exactMatch) {
         return res.json({ results: [exactMatch] });
       }
       
       // Then try text search on multiple fields
       const results = await collection.find({
         $or: [
           { code: { $regex: query, $options: 'i' } },
           { $text: { 
             $search: query,
             $caseSensitive: false,
             $diacriticSensitive: false
           }}
         ]
       })
       .project({
         code: 1,
         description: 1,
         detail_context: 1,
         score: { $meta: "textScore" }
       })
       .sort({ score: { $meta: "textScore" } })
       .limit(50)
       .toArray();
       
       // Process results to highlight matching terms
       const processedResults = results.map(result => {
         // Processing logic for highlighting
         return processed;
       });
       
       res.json({ results: processedResults });
     } catch (error) {
       res.status(500).json({ error: 'Error searching: ' + error.message });
     }
   });
   ```

### Frontend Components

**HomePage Component**:
- Provides main search interface
- Displays search results
- Contains reset database functionality
- Shows usage instructions

**CodeSidebar Component**:
- Shows alphabetical listing of codes
- Allows collapsing/expanding for space efficiency
- Fetches codes by letter prefix
- Highlights currently selected code

**Search Component**:
- Provides search input with real-time results
- Uses debounced API requests to prevent flooding
- Displays clear results with highlighting

**ThemeContext**:
- Detects system color scheme preference
- Allows manual override of theme
- Persists preference in localStorage

## Desktop Application

The project includes an Electron desktop application with these features:

1. **Integrated Server**:
   - Runs the Express server within the Electron process
   - Manages MongoDB connection automatically
   - Handles graceful shutdown of services

2. **File Selection**:
   - Uses native file dialogs for selecting data files
   - Securely transfers file data to the server process

3. **Windows Integration**:
   - Creates desktop shortcuts
   - Provides start menu entries
   - Includes proper installer with MongoDB dependency check

4. **Build Configuration**:
   - Uses Electron Forge for packaging
   - Provides multiple installer options (Squirrel, Inno Setup)
   - Cross-platform compatibility

## Build and Deployment

### Web Application
```bash
# Build for production web deployment
npm run build
npm run server
```

### Desktop Application
```bash
# Development mode
npm run electron:dev

# Package application
npm run electron:package

# Create installers
npm run electron:make

# Windows-specific builds
npm run electron:make:windows
```

## Performance Considerations

To handle large datasets efficiently, the application:
- Processes files in chunks on the server
- Uses MongoDB indexing for fast searches
- Implements pagination for large result sets
- Uses debouncing for search inputs
- Optimizes the rendering of large code lists with virtualization

## Technology Stack

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web server framework
- **MongoDB**: NoSQL database
- **Multer**: File upload handling

### Frontend
- **React**: UI framework
- **React Router**: For navigation
- **Tailwind CSS**: For styling
- **Context API**: For state management

### Desktop App
- **Electron**: Desktop application framework
- **Electron Forge**: Build and packaging tool
- **Inno Setup**: Advanced Windows installer (optional)

## Browser and Platform Compatibility

The application is designed to work on:
- **Web Browsers**: Chrome, Firefox, Edge, Safari
- **Desktop Platforms**: Windows, macOS, Linux
- **Minimum Requirements**: 
  - 2GB RAM for processing large datasets
  - MongoDB 4.0+ for backend storage
  - Node.js 14+ for server runtime

## Troubleshooting Common Issues

### 1. MongoDB Connection Issues
- **Possible Causes**: MongoDB not running, connection refused, wrong port
- **Solutions**: Ensure MongoDB service is running, check port configuration, check authentication settings

### 2. File Upload Failures
- **Possible Causes**: File too large, wrong format, temporary directory permissions
- **Solutions**: Check file format, ensure uploads directory is writable, increase server timeout settings

### 3. Search Not Working
- **Possible Causes**: No data loaded, indexes not created, search term issues
- **Solutions**: Upload data first, reset database to rebuild indexes, check search term format

### 4. Desktop App Issues
- **Possible Causes**: MongoDB not installed, path issues, permission problems
- **Solutions**: Install MongoDB before running, run as administrator, check app logs

## Future Enhancements

Planned or potential enhancements include:
- Advanced filtering by code categories
- Data export capabilities (CSV, PDF)
- Integration with medical terminology APIs
- Analytics dashboard for usage patterns
- Multi-language support
- Offline mode with service workers

## Recent Updates and Enhancements

1. **Sidebar Navigation**:
   - Added alphabetical code browsing capability
   - Implemented collapsible sidebar for better space management
   - Added letter-based filtering of codes

2. **Database Management**:
   - Added reset database functionality
   - Improved data reloading from original files
   - Enhanced progress tracking and error handling

3. **Desktop Application**:
   - Added Electron desktop application support
   - Created Windows-specific build configuration
   - Added installers with MongoDB dependency checks

4. **UI Enhancements**:
   - Improved dark mode support
   - Added creator credit toggle functionality
   - Enhanced responsive design for all screen sizes

## Licensing and Attribution

This project is licensed under the MIT License, created by Kaustabh (GitHub: stabgan) and contributors.

---

This guide is intended to provide a comprehensive understanding of the ICD-10-CM Browser application for LLMs and AI agents working on enhancements or fixes. For any questions not covered in this guide, please refer to the code documentation or contact the author directly. 