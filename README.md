# ICD-10-CM Browser with MongoDB Backend

A web application for browsing and searching ICD-10-CM diagnosis codes with a Node.js/MongoDB backend and optional Electron desktop app.

## Project Structure

This application uses a client-server architecture:

- **Frontend**: React.js single-page application
- **Backend**: Express.js server handling file uploads and data processing
- **Database**: MongoDB for storing ICD-10 codes and search indexes
- **Desktop App**: Optional Electron wrapper for standalone use

## Setup Instructions

### Prerequisites

- Node.js 14+ installed
- MongoDB installed (or Docker with MongoDB image)
- 2GB+ RAM for processing large datasets

### Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Install MongoDB if not already installed:
   - **Windows**: [MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - **macOS**: `brew install mongodb-community`
   - **Linux**: Follow the [MongoDB installation guide](https://docs.mongodb.com/manual/administration/install-on-linux/)

### Running the Application

#### Option 1: Start Everything with One Command
```
npm run start:all
```
This will:
- Start MongoDB (or use already running instance)
- Start the Express backend server
- Start the React development server
- Open your browser at http://localhost:3000

#### Option 2: Start Components Separately

1. Make sure MongoDB is running
   ```
   # Windows
   net start MongoDB

   # Linux/macOS
   sudo systemctl start mongod
   ```

2. Start the server
   ```
   npm run server
   ```

3. Start the frontend (in a separate terminal)
   ```
   npm run dev
   ```

4. Open http://localhost:3000 in your browser

#### Option 3: Run as Desktop Application

To run as a desktop application using Electron:

```
npm run electron:start
```

To build the desktop application:

```
npm run electron:build
```

This will create executable files in the `release` directory for your operating system.

### Importing Data

1. Start the application
2. You will see the upload screen if no data is present
3. Upload your ICD-10-CM data file (JSONL format)
4. Wait for processing to complete (this may take several minutes for large files)
5. After completion, you'll be redirected to the main application

### Resetting Data

If you need to reload data from the original JSONL file:

1. Click the "Reset Database" button at the top right of the application
2. Confirm the reset when prompted
3. Wait for the process to complete (the page will refresh automatically)

## Features

### Code Browser

- **Search**: Find codes by text or code number
- **Code Sidebar**: Browse codes alphabetically using the left sidebar
  - Click on a letter to load codes starting with that letter
  - Collapse/expand the sidebar as needed
- **Code Details**: View detailed information about each code
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop and mobile devices

## Data Format

The application expects JSONL files with each line containing a JSON object:

```json
{
  "code": "A00.0",
  "description": "Cholera due to Vibrio cholerae 01, biovar cholerae",
  "detailed_context": "# Detailed information...\nMore details about the code..."
}
```

## Building for Production

To build the application for production:

```
npm run build
npm run start
```

The server will serve both the API and the static frontend files.

## Project Structure

```
/
├── server.js            - Express server with MongoDB integration
├── start.js             - Helper script to start everything
├── uploads/             - Temporary directory for file uploads
├── mongo_data/          - MongoDB data directory (created on first run)
├── src/                 - React frontend application
│   ├── components/      - UI components
│   │   └── CodeSidebar.jsx - Alphabetical code browser sidebar
│   ├── contexts/        - React context providers
│   ├── pages/           - Page components
│   └── utils/           - Utility functions including API service
├── public/              - Static assets
└── electron/            - Electron configuration for desktop app
```

## Troubleshooting

### MongoDB Issues

- **MongoDB Not Found**: Ensure MongoDB is installed and added to your PATH. You can verify this by running `mongod --version` in your terminal.
- **Connection Issues**: Make sure MongoDB is running on the default port (27017). If it's using a different port, update the URI in server.js.
- **Permission Issues**: On Linux/macOS, you might need to run MongoDB with sudo or fix the permissions on the mongo_data directory.

### Server Issues

- **Port Conflicts**: The server runs on port 5000 by default. If another application is using this port, change the `port` variable in server.js.
- **ES Module Errors**: This application uses ES modules. Ensure you're using Node.js version 14+ and that all import/export statements are correct.

### Desktop App Issues

- **File Selection**: If file selection doesn't work in the desktop app, try using the web version to upload your data first.
- **MongoDB Connection**: The desktop app requires MongoDB to be installed and running on your system.

## License

MIT License - See LICENSE file for details. 