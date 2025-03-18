# ICD-10-CM Browser

[![Tests](https://github.com/stabgan/icd10cm-browser/actions/workflows/test.yml/badge.svg)](https://github.com/stabgan/icd10cm-browser/actions/workflows/test.yml)

A modern, client-side web application for browsing and searching ICD-10-CM diagnosis codes. Built with React, Tailwind CSS, and IndexedDB for local data storage and processing.

## Key Features

- 🚀 **Efficient Large Data Handling**: Process up to 1.2GB of JSONL data directly in your browser
- 🔍 **Advanced Multi-Level Search**: Quickly find codes by ID or keywords with smart fallbacks
- 💾 **Fully Local Operation**: All data stays on your computer with IndexedDB storage
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- 🌙 **Dark/Light Mode**: Automatically detects system preference with manual toggle option
- 📊 **Detailed Code Views**: Format and display complex medical information with Markdown support
- 🚦 **Progress Tracking**: Visual feedback during lengthy data processing operations

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, or Edge recommended)
- Node.js 16+ and npm for development
- An ICD-10-CM data file in JSONL format

### Quick Start

1. **Clone and Install**
   ```bash
   git clone https://github.com/stabgan/icd10cm-browser.git
   cd icd10cm-browser
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npm run dev
   ```

3. **Import Your Data**
   - Launch the application in your browser
   - Click "Upload Data File" and select your JSONL file
   - Wait for processing to complete (progress bar will show status)
   - Start searching and browsing codes!

## Data Format

The application expects a JSONL file with each line containing a JSON object in this format:

```json
{"code":"A00.0","description":"Cholera due to Vibrio cholerae","detailed_context":"# Detailed information in Markdown format"}
```

Each entry must include:
- `code`: The ICD-10-CM code identifier (e.g., "E11.9")
- `description`: A brief description of the code
- `detailed_context`: Detailed information formatted in Markdown

## Usage Guide

### Searching for Codes

The search functionality offers multiple ways to find what you need:

- **Direct Code Search**: Enter a code ID like "A00.1" for exact matches
- **Keyword Search**: Enter terms like "diabetes" to find related codes
- **Real-time Suggestions**: See up to 10 matching suggestions as you type
- **Full Results View**: View complete search results in the grid layout

Search tips:
- Press Enter to execute a search
- Clear the search with the X button to start over
- Click any suggestion to view its details

### Viewing Code Details

When viewing a specific code:
- See the formal code ID and short description
- Read the detailed context with proper Markdown formatting
- Use the browser's back button to return to your search results

### Data Management

Your data is stored locally in your browser using IndexedDB:
- No data is sent to any server
- Your browser needs permission to use local storage
- Data persists between sessions until you clear it

## Development Features

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run end-to-end tests with Playwright
npm run test:e2e
```

### Building for Production

```bash
npm run build
```

This creates optimized assets in the `dist` folder that can be served from any static file server.

## Troubleshooting

### Import Issues

If you encounter problems during data import:
- Ensure your JSONL file is properly formatted
- Try a smaller file first to test the import process
- Check the browser console for specific error messages
- Use Chrome or Edge for best IndexedDB performance

### Search Not Working

If search isn't returning expected results:
- Check that your data was successfully imported (you should see results count)
- Try searching for specific codes to verify indexing
- Clear the search and try again with different terms
- Reload the page if the interface becomes unresponsive

### Browser Compatibility

This application works best in:
- Google Chrome (recommended)
- Microsoft Edge
- Firefox
- Safari (with some limitations)

## Technical Details

- **UI Framework**: React with React Router for navigation
- **Styling**: Tailwind CSS for responsive design
- **Data Storage**: IndexedDB via the idb library
- **Search Algorithm**: Multi-level with exact matching and fallbacks
- **Testing**: Vitest with React Testing Library and Playwright
- **Build System**: Vite for fast development and optimized builds

## License

This project is licensed under the MIT License. 