# Medical Codes Website (OMC)

A modern, efficient web application for browsing and searching medical diagnosis codes. Built with React, Material UI, and IndexedDB for client-side data storage and processing.

## Features

- ⚡️ **Blazing fast search** across all medical codes and descriptions
- 🎨 **Clean, intuitive UI** with responsive design that works on all devices
- 💾 **Client-side storage** using IndexedDB for efficient data handling without a server
- 🔍 **Detailed code view** with full context and information in formatted layout
- 📱 **Responsive design** that works seamlessly across desktop and mobile devices
- 🔄 **Easy data import** with progress tracking for large datasets
- 🌙 **Dark/Light mode** for comfortable viewing in any environment
- 📎 **Sharing capabilities** to easily share specific codes

## Detailed Installation Guide

Follow these step-by-step instructions to set up the project on a new machine.

### Prerequisites

- Node.js 16+ and npm (or yarn)
- Git
- A JSONL file containing medical codes data (e.g., `medical_codes.jsonl`)
- A modern web browser (Chrome, Firefox, Edge recommended)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/OMC_website.git
cd OMC_website
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- React and React DOM
- Material UI components and icons
- React Router for navigation
- IndexedDB for client-side storage

### Step 3: Verify Configuration

Make sure the following files exist and are properly configured:

1. Check that `vite.config.js` has the correct port configuration (default is 3030):
   ```js
   export default defineConfig({
     plugins: [react()],
     server: {
       port: 3030
     }
   })
   ```

2. Ensure that `public/index.html` includes the necessary metadata and font imports.

### Step 4: Start the Development Server

```bash
npm start
# or
npm run dev
```

This will start the development server. Navigate to http://localhost:3030 in your browser to see the application.

### Step 5: Import Medical Codes Data

1. Once the application is running, click on the "Import" button in the top navigation bar.
2. In the Import Dialog, click "Select File" and choose your JSONL file (e.g., `medical_codes.jsonl`).
3. The application will process the file and store the medical codes in the browser's IndexedDB.
4. Watch the progress bar to monitor the import process. For large files (>500MB), this may take several minutes.
5. Once complete, you'll see a success message.

### JSONL File Format

Your JSONL file should contain records with the following structure (one JSON object per line):

```json
{"code":"A00.0","description":"Cholera due to Vibrio cholerae","chapter":"Certain infectious and parasitic diseases","section":"Intestinal infectious diseases","category":"Cholera","detailed_context":"# A00.0 Cholera due to Vibrio cholerae\n\n## Description\nCholera is an acute diarrheal illness..."}
```

Key fields:
- `code`: The medical code identifier (required)
- `description`: A short description of the code (required)
- `chapter`, `section`, `category`: Hierarchical classification (optional)
- `detailed_context`: Detailed information about the code, can include Markdown formatting (optional)

### Handling Large JSONL Files

This application is designed to handle large JSONL files (1GB+) efficiently. The import process works as follows:

1. **Chunked Processing**: The file is read in chunks (10MB at a time) to prevent memory issues
2. **Batch Transactions**: Records are processed in batches of 200 items to optimize database writes
3. **Progress Tracking**: The UI displays real-time progress updates during import
4. **IndexedDB Storage**: Data is stored in two object stores:
   - `searchIndex`: Contains basic information for quick searching
   - `details`: Contains detailed context information loaded only when needed

#### Tips for Large Files

When working with very large files (>500MB):

1. **Browser Storage**: 
   - Chrome and Edge provide the most storage space (typically several GB)
   - For Chrome/Edge, go to Settings > Site Settings > Storage to allow more space

2. **Import Process**:
   - Keep the browser tab active during import
   - Don't navigate away from the import page
   - For very large files, the browser may prompt for storage permission
   - If the import fails, try splitting the file into smaller chunks (250-500MB each)

3. **Memory Management**:
   - Close other browser tabs to free up memory
   - Restart your browser before importing large files
   - Ensure your system has enough free RAM (8GB+ recommended for 1GB+ files)

4. **Verification**:
   - After import, the search function will return results from the imported data
   - Check a few random codes to ensure their detailed content appears correctly

### Step 6: Using the Application

After importing the data, you can:

1. **Search for codes**: Use the search box at the top of the page to find codes by ID or description
2. **View code details**: Click on any code in the search results to view its detailed information
3. **Browse categories**: Use the sidebar navigation to browse codes by chapter, section, or category
4. **Share codes**: Use the share button on the details page to share a link to a specific code

### Troubleshooting

If you encounter issues with the database:

1. Click on the import button again
2. In the import dialog, use the "Reset Database" option
3. Try importing the data again

If large files fail to import:
1. Ensure your browser has sufficient storage allocation
2. Try splitting the file into smaller chunks
3. Make sure you don't close the browser during import

### Production Deployment

To build the application for production:

```bash
npm run build
```

This creates a `dist` folder with optimized production files. You can serve these using any static file server:

```bash
npm install -g serve
serve -s dist
```

## Performance Considerations

For optimal performance with large datasets:
- Ensure the browser has adequate storage space
- Consider using Chrome or Edge for best IndexedDB performance
- Large files (>1GB) may require additional memory allocation

## Technology Stack

- **Frontend Framework**: React
- **UI Components**: Material UI
- **Routing**: React Router
- **Data Storage**: IndexedDB
- **Build Tool**: Vite
- **Language**: JavaScript/JSX
- **Styling**: CSS with Material UI theming

## Browser Compatibility

This application has been tested and works well in:
- Google Chrome (recommended for best IndexedDB performance)
- Microsoft Edge
- Firefox
- Safari (with limited IndexedDB storage in some versions)

## Troubleshooting Common Issues

### Import Process Hangs

If the import process hangs:
1. Try refreshing the page and importing again
2. Check browser console for any errors
3. Ensure your JSONL file is properly formatted

### Storage Issues

If you encounter storage-related issues:
1. In Chrome/Edge, go to Settings > Site Settings > Storage and allow more storage
2. Clear your browser cache and try again
3. For very large datasets, consider splitting the file into smaller chunks

### Display Issues

If you encounter display issues:
1. Try toggling between light and dark mode
2. Refresh the page
3. Clear your browser cache

## Contributing

Contributions to improve this application are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgements

- React team for the amazing frontend library
- Material UI team for the component library
- All contributors to the project 