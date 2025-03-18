# ICD-10-CM Browser Desktop Application

This guide explains how to build the ICD-10-CM Browser as a desktop application for Windows 64-bit using Electron.

## Prerequisites

- Node.js 16 or newer
- npm or yarn
- Windows 64-bit operating system (for building Windows installers)

## Development

To run the application in development mode:

```bash
# Install dependencies
npm install

# Run in development mode
npm run electron:dev
```

This will start both the Vite development server and the Electron application in development mode.

## Building the Desktop Application

To build the desktop application for Windows 64-bit:

```bash
# Install dependencies if you haven't already
npm install

# Build the application
npm run electron:build
```

This will create a Windows installer in the `release` directory.

## Application Structure

The desktop application is built using Electron with the following architecture:

1. **Main Process**: Handles native OS operations like file dialogs and file system access
   - Located in `electron/main.js`
   - Sets up the application window and IPC handlers

2. **Preload Script**: Securely exposes Electron IPC to the renderer process
   - Located in `electron/preload.js`
   - Creates a bridge between main and renderer processes

3. **Renderer Process**: The React application that runs in the browser window
   - Located in the `src` directory
   - Same code as the web application but with additional Electron integration

## Data Processing

The application processes large JSONL files using these optimizations:

1. **Streaming Processing**: Files are read in chunks to minimize memory usage
2. **Node.js File System API**: Used for efficient file access via Electron's IPC
3. **FlexSearch**: High-performance search engine for fast code lookups
4. **IndexedDB**: Local database for persistent storage of processed data
5. **Chunked Storage**: Data is organized by code prefixes for faster retrieval

## Troubleshooting

### Common Issues

1. **"Error reading file chunk"**
   - Solution: Check file permissions and ensure the file is not open in another application.

2. **"FlexSearch indices not available"**
   - Solution: Restart the application and try processing the file again.

3. **"Search is slow"**
   - Solution: For very large datasets (>100,000 codes), consider splitting into multiple files.

## Advanced Configuration

The application can be configured by modifying the following files:

- `electron/main.js`: Main process configuration
- `vite.config.js`: Build and packaging options
- `package.json`: Electron builder settings in the `build` section

## License

This project is licensed under the MIT License. See the LICENSE file for details. 