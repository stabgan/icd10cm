# Guide to Understanding the ICD-10-CM Browser Project for LLMs

## Project Overview

This is a client-side web application designed to browse and search the International Classification of Diseases, 10th Revision, Clinical Modification (ICD-10-CM) codes. The application is built to handle large datasets (up to 1.2GB) containing 74,260 medical codes while running entirely in the browser without requiring server-side processing.

### Key Challenges & Solutions

1. **GitHub Size Constraints**: 
   - GitHub has a 1GB total repository size limit and a 100MB individual file limit
   - Solution: Instead of hosting the large data files in the repository, users bring their own data files

2. **Large File Processing**:
   - Processing a 1.2GB JSONL file in the browser could crash it
   - Solution: The application reads and processes the file in 10MB chunks

3. **Fast Search and Retrieval**:
   - Users need fast search capabilities across 74,260 detailed medical codes
   - Solution: Data is indexed and stored in IndexedDB with custom search functionality

## Architecture

### Core Components

The application is a React single-page application with the following key components:

1. **SplashScreen**: Shown when no data is loaded, prompts users to upload their data file
2. **App**: Main component handling routing and global state
3. **HomePage**: Landing page with search functionality
4. **CodeDetailPage**: Detailed view of a specific ICD code
5. **DataProcessor**: Utility for processing and storing ICD-10-CM data

### Data Flow

1. User uploads a JSONL data file containing ICD-10-CM codes
2. The file is processed in chunks by the dataProcessor utility
3. Processed data is stored in the browser's IndexedDB
4. The application loads data from IndexedDB for searching and displaying details
5. Users can search for codes and view detailed information

### Storage Strategy

The application uses IndexedDB with four object stores:
- `codes`: Stores individual code records
- `chunks`: Stores codes organized by their first letter 
- `index`: Stores metadata about the dataset
- `search-index`: Stores indexed terms for efficient searching

## Key Files and Their Roles

### `src/App.jsx`

The main application component that:
- Checks if data is already loaded in IndexedDB
- Falls back to checking for pre-packaged data
- Shows the SplashScreen if no data is found
- Handles routing and page structure

### `src/utils/dataProcessor.js`

This is the core utility that handles:
- File reading in chunks (10MB at a time)
- Data parsing from JSONL format
- Organization of codes by first letter
- Building of search indices
- Storage in IndexedDB
- Retrieval functions for searching and fetching codes

Key functions:
- `processICD10Data`: Processes the uploaded file
- `readFileInChunks`: Reads large files in manageable pieces
- `searchCodes`: Searches the indexed data
- `getCode`: Retrieves a specific code

### `src/components/SplashScreen.jsx`

The upload interface that:
- Presents a file upload button to the user
- Handles file selection and validation
- Shows progress during processing
- Redirects to the main application when complete

### `src/components/Search.jsx`

The search component that:
- Provides an input field for searching
- Implements debounced search
- Displays suggestions as users type
- Triggers search result display

### `src/pages/CodeDetailPage.jsx`

Displays detailed information about a selected code:
- Shows the code, description, and detailed context
- Renders the detailed context as Markdown
- Provides PDF export functionality
- Handles loading states and errors

### `src/pages/HomePage.jsx`

The main landing page that:
- Displays a search interface
- Shows search results in a grid
- Displays statistics about the loaded data
- Provides instructions for use

## Data Format

The application expects a JSONL file where each line is a JSON object with these fields:
- `code`: The ICD-10-CM code (e.g., "E11.9")
- `description`: A short description of the code
- `detailed_context`: Markdown text with detailed information about the code

Example:
```jsonl
{"code":"A00.0","description":"Cholera due to Vibrio cholerae 01, biovar cholerae","detailed_context":"# Cholera due to Vibrio cholerae 01, biovar cholerae\n\n**Clinical Information**\n* An acute diarrheal illness caused by toxigenic VIBRIO CHOLERAE..."}
{"code":"A00.1","description":"Cholera due to Vibrio cholerae 01, biovar eltor","detailed_context":"# Cholera due to Vibrio cholerae 01, biovar eltor\n\n**Clinical Information**\n* An acute diarrheal disease caused by VIBRIO CHOLERAE..."}
```

## Data Processing Workflow

1. **File Upload**:
   - User selects a JSONL file containing ICD-10-CM codes
   - The file is validated for format

2. **Chunked Reading**:
   - The file is read in 10MB chunks to avoid memory issues
   - Complete lines are extracted and processed

3. **Data Organization**:
   - Codes are grouped by their first letter (A-Z)
   - A search index is built based on code IDs and descriptions

4. **Storage**:
   - Processed data is stored in IndexedDB
   - Metadata about the dataset is saved

5. **Usage**:
   - The application reads from IndexedDB for searching and display
   - No further processing is needed until a new file is uploaded

## Search Implementation

The search function:
1. Takes the user's query and splits it into terms
2. Checks for exact code matches first
3. Looks for keyword matches in the search index
4. Returns a unified list of results
5. Displays up to 10 suggestions while typing
6. Shows all results on the HomePage

## Technical Details

- **UI Framework**: React with React Router for navigation
- **Styling**: Tailwind CSS for responsive design
- **Storage**: IndexedDB via the idb library
- **PDF Generation**: jsPDF for exporting code details
- **Markdown Rendering**: ReactMarkdown for detailed context

## Performance Optimizations

1. **Chunked File Reading**: Prevents browser crashes with large files
2. **Indexed Search**: Makes searching fast even with 74,000+ codes
3. **Debounced Search**: Prevents excessive search operations while typing
4. **Code Organization by Letter**: Enables efficient retrieval by code prefix
5. **Client-side Processing**: No server needed, works entirely in the browser

## Deployment Considerations

The application is designed to be deployed on GitHub Pages with:
- A base path of `/icd10cm/`
- A 404.html for handling client-side routing
- Placeholder data files when no user data is uploaded

## User Experience Flow

1. First Visit:
   - User sees a SplashScreen prompting for data upload
   - User selects their ICD-10-CM data file
   - File is processed with progress indication
   - User is redirected to the main application

2. Returning Visits:
   - Data is already in IndexedDB
   - User goes directly to the main application
   - No need to re-upload data

3. Searching:
   - User types in the search box
   - Suggestions appear as they type
   - Results are displayed in a grid below
   - User can click on any result for details

4. Viewing Details:
   - Code and short description are shown
   - Detailed context is rendered as formatted Markdown
   - User can download a PDF of the details

## Summary

This project is a sophisticated client-side solution for browsing large medical code datasets. It demonstrates advanced techniques for handling large files in the browser, efficient data storage, and fast search capabilities - all while maintaining a modern, responsive user interface with dark mode support and accessibility features.

The architecture allows users to bring their own data while keeping the application itself lightweight and deployable on GitHub Pages, effectively working around GitHub's size limitations. 