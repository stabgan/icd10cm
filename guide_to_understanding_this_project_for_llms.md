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
- Feature alphabetical browsing of codes via sidebar
- Allow database reset and reload functionality
- Operate with MongoDB backend for robust data management
- Download code details as PDF format
- 50/50 split layout for optimal browsing and viewing experience

## Architecture Overview

The application follows a modern full-stack architecture with these key components:

### Main Application Structure
```
/
├── server.js            - Express server with MongoDB integration
├── start.js             - Helper script to start everything together
├── check-mongodb.js     - Script to verify MongoDB connection before startup
├── src/                 - React frontend application
│   ├── components/      - UI components
│   │   ├── CodeSidebar.jsx - Alphabetical code browser sidebar
│   │   ├── Search.jsx      - Search component with real-time results
│   │   ├── Header.jsx      - Application header with theme toggle
│   │   ├── Footer.jsx      - Application footer
│   │   └── SplashScreen.jsx - Initial data upload interface
│   ├── contexts/        - React context providers
│   │   └── ThemeContext.jsx - Dark/light mode management
│   ├── pages/           - Page components
│   │   ├── HomePage.jsx      - Main search interface
│   │   └── CodeDetailPage.jsx - Detailed code view
│   └── utils/           - Utility functions including API service
├── tailwind.config.js   - Tailwind CSS configuration with custom theme
└── vite.config.js       - Vite bundler configuration
```

### Core Components

#### Backend
1. **Express Server** - Handles API requests and data management
2. **MongoDB Integration** - Stores and indexes ICD-10-CM codes
3. **File Processing** - Parses and indexes JSONL data files
4. **Search API** - Provides efficient multi-tiered search capabilities
5. **MongoDB Health Check** - Verifies database connectivity before startup

#### Frontend
1. `App.jsx` - Main application component with routing and 50/50 layout
2. `HomePage.jsx` - Primary interface with search functionality
3. `CodeDetailPage.jsx` - Displays detailed code information
4. `CodeSidebar.jsx` - Alphabetical navigation of codes in the left 50% panel
5. `SplashScreen.jsx` - Handles file upload and initial data setup
6. `Search.jsx` - Provides search interface with real-time results
7. `ThemeContext.jsx` - Manages dark/light mode preferences with system detection
8. `Header.jsx` - Application header with navigation and theme controls
9. `Footer.jsx` - Application footer with attribution information

## Data Flow

The application's data flow follows this pattern:

1. **Initial Load**:
   - Express server connects to MongoDB
   - Frontend checks if data is available in MongoDB
   - If no data, show SplashScreen for data upload
   - If data exists, show main interface with 50/50 split layout

2. **Data Import Process**:
   - User uploads JSONL file via SplashScreen
   - File is transferred to server via multipart form
   - Server processes file in chunks to avoid memory issues
   - Each chunk is parsed and stored in MongoDB collections
   - Indexes are created for efficient searching
   - UI is refreshed to show search interface
   - Progress is reported in real-time via EventSource

3. **Search Flow**:
   - User enters query in Search component
   - Request is sent to the backend API
   - Server searches MongoDB with multi-tier strategy:
     - First attempts exact code match
     - Then searches through text indexes
     - Uses regex for partial matches
   - Results are returned to frontend
   - Results are displayed in search results grid

4. **Sidebar Navigation Flow**:
   - User interacts with alphabet buttons in the left sidebar
   - Selected letter triggers API request for codes starting with that letter
   - Codes are displayed in the left panel
   - User can scroll through codes and select one for detailed view
   - Selected code is highlighted for better visibility

5. **Detail View Flow**:
   - User selects code from search results or sidebar
   - App navigates to CodeDetailPage route
   - Code data is fetched from server by ID
   - Detailed information is displayed in right 50% panel
   - PDF download option is available for exporting code details

6. **Reset Database Flow**:
   - User clicks "Reset Database" button
   - Confirmation dialog is displayed
   - Request is sent to reset-database endpoint
   - Server clears MongoDB collections
   - Server reloads data from last uploaded file
   - UI is refreshed to show updated data
   - Success/failure messages are shown to the user

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
         detailed_context: 1,
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

**App.jsx**:
```jsx
function App() {
  // ...state definitions...

  return (
    <Router>
      <div className={`min-h-screen flex flex-col ${
        darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
      } transition-colors duration-300`}>
        <Header />
        
        {/* Main container with 50/50 split */}
        <div className="flex flex-row w-full h-[calc(100vh-64px)] pt-16">
          {/* Left sidebar - exactly 50% width */}
          {dataStatus.loaded && !dataStatus.error && (
            <div className="w-1/2 h-full overflow-auto border-r border-gray-200 dark:border-gray-700">
              <CodeSidebar />
            </div>
          )}
          
          {/* Main content area - exactly 50% width */}
          <main className={`${
            dataStatus.loaded && !dataStatus.error ? 'w-1/2' : 'w-full'
          } h-full overflow-auto p-6`}>
            <Routes>
              <Route path="/" element={<HomePage dataStatus={dataStatus} onToggleCreator={toggleCreatorCredit} />} />
              <Route path="/code/:codeId" element={<CodeDetailPage />} />
              {/* ...other routes... */}
            </Routes>
          </main>
        </div>
        
        <Footer showCreator={showCreator} />
      </div>
    </Router>
  );
}
```

**HomePage Component**:
- Provides main search interface
- Displays search results
- Contains reset database functionality
- Shows usage instructions
- Adapts to the right 50% panel

**CodeSidebar Component**:
- Shows alphabetical listing of codes
- Allows browsing by letter
- Fetches codes by letter prefix
- Highlights currently selected code
- Fits within the left 50% panel

**Search Component**:
- Provides search input with real-time results
- Uses debounced API requests to prevent flooding
- Displays clear results with highlighting
- Adapts to container width for optimal display

**ThemeContext**:
- Detects system color scheme preference
- Allows manual override of theme
- Persists preference in localStorage
- Supports dark and light mode with custom color scheme

**CodeDetailPage**:
- Displays detailed code information
- Shows proper heading and description
- Renders markdown-formatted detailed context
- Provides PDF download functionality
- Adapted to fit within the right 50% panel

## User Interface Design

The application uses a custom color palette with:

1. **Light Mode Colors**:
   - Primary: Soft blue (#5a9bd5)
   - Secondary: Mint green (#7ccfae)
   - Accent: Lavender (#b38cc4)
   - Background: Very light blue (#f5f8fc)
   - Text: Slate gray (#334155)

2. **Dark Mode Colors**:
   - Primary: Deeper blue (#4981b3)
   - Secondary: Darker mint (#5db495)
   - Accent: Deep lavender (#9670ab)
   - Background: Dark blue-gray (#1a202c)
   - Text: Light gray-blue (#e2e8f0)

3. **Layout Structure**:
   - Header: Fixed at top with app title and controls
   - 50/50 Split: Left panel for browsing, right panel for search/details
   - Each panel has independent scrolling
   - Responsive adaptation for different screen sizes

## Performance Considerations

To handle large datasets efficiently, the application:
- Processes files in chunks on the server
- Uses MongoDB indexing for fast searches
- Limits result sets to 50 items maximum
- Uses debouncing for search inputs (300ms)
- Implements virtual scrolling for large code lists
- Properly handles overflow with independent scrolling panels
- Optimizes styling and layout for minimal reflow

## Technology Stack

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web server framework
- **MongoDB**: NoSQL database
- **Multer**: File upload handling
- **EventSource**: Real-time progress updates

### Frontend
- **React**: UI framework
- **React Router**: For navigation
- **Tailwind CSS**: For styling
- **Context API**: For state management
- **jsPDF**: For PDF generation
- **Vite**: Fast bundler and development server

## Browser and Platform Compatibility

The application is designed to work on:
- **Web Browsers**: Chrome, Firefox, Edge, Safari
- **Desktop Platforms**: Windows, macOS, Linux
- **Minimum Requirements**: 
  - 2GB RAM for processing large datasets
  - MongoDB 4.0+ for backend storage
  - Node.js 14+ for server runtime

## Recent Updates and Enhancements

1. **UI Layout Improvements**:
   - Implemented 50/50 split layout for sidebar and content
   - Enhanced responsive design with better overflow handling
   - Updated color palette with medical-themed pastel colors

2. **SplashScreen Enhancements**:
   - Improved file upload UI with drag-and-drop functionality
   - Added progress indication with real-time updates
   - Enhanced error handling and validation feedback

3. **CodeDetailPage Fixes**:
   - Fixed property name mismatch for detailed context display
   - Improved layout to fit within the right panel
   - Enhanced PDF export functionality

4. **Accessibility Improvements**:
   - Better color contrast ratios for all UI elements
   - Proper focus management for keyboard navigation
   - Semantic HTML structure for screen readers

5. **Performance Optimizations**:
   - Reduced bundle size with code splitting
   - Optimized MongoDB queries for faster search
   - Improved rendering performance for large code lists

## Common Error States and Handling

1. **MongoDB Connection Errors**:
   - Application checks MongoDB connection at startup
   - User-friendly error messages for connection issues
   - Automatic retry mechanisms for temporary connection problems

2. **File Processing Errors**:
   - Validation of file format before processing
   - Detailed error messages for invalid file formats
   - Progress tracking for large file uploads

3. **Search Failures**:
   - Graceful handling of empty results
   - Error messages for failed search queries
   - Fallback to simple text search when advanced search fails

4. **UI Rendering Issues**:
   - Error boundaries for component failures
   - Fallback UI for data loading states
   - Responsive design adaptations for different screen sizes

## Licensing and Attribution

This project is licensed under the MIT License, created by Kaustabh (GitHub: stabgan) and contributors.

---

This guide is intended to provide a comprehensive understanding of the ICD-10-CM Browser application for LLMs and AI agents working on enhancements or fixes. For any questions not covered in this guide, please refer to the code documentation or contact the author directly. 