# ICD-10-CM Browser

A modern, responsive web application for browsing, searching, and exploring the International Classification of Diseases, 10th Revision, Clinical Modification (ICD-10-CM) diagnosis codes.

![ICD-10-CM Browser Screenshot](https://github.com/stabgan/icd10cm/raw/main/screenshots/main-screenshot.png)

## Overview

The ICD-10-CM Browser provides healthcare professionals, medical coders, and students with a powerful tool to navigate the comprehensive ICD-10-CM code database. This application offers an intuitive user interface with both light and dark modes, efficient search capabilities, and detailed code information display.

## Features

- **Intuitive Search**: Quickly find codes by description, keywords, or exact code
- **Alphabetical Browsing**: Navigate codes organized by their first letter
- **Detailed Context**: View comprehensive information about each code
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark/Light Mode**: Choose your preferred theme or use system default
- **MongoDB Backend**: Reliable, high-performance data storage
- **Data Import/Export**: Upload JSONL files and download code details as PDF
- **Reset Functionality**: Easily reset and reload the database when needed

## Prerequisites

Before installing the ICD-10-CM Browser, ensure you have the following:

- **Node.js** (v14.0.0 or higher)
- **MongoDB** (v4.0 or higher, installed and running)
- **npm** (v6.0.0 or higher) or **yarn**
- **Git** (for cloning the repository)

## Installation

Follow these steps to set up the ICD-10-CM Browser on your system:

### 1. Clone the Repository

```bash
git clone https://github.com/stabgan/icd10cm.git
cd icd10cm
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Ensure MongoDB is Running

#### Windows
```bash
# Check if MongoDB service is running
sc query MongoDB

# Start MongoDB service if not running
net start MongoDB
```

#### macOS
```bash
# Using Homebrew
brew services start mongodb-community

# Check status
brew services list
```

#### Linux
```bash
# Ubuntu/Debian
sudo systemctl start mongod
sudo systemctl status mongod

# Red Hat/Fedora
sudo service mongod start
```

### 4. Configuration (Optional)

The application uses default configuration for MongoDB (localhost:27017) and server ports. If you need to modify these:

- Create a `.env` file in the root directory:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/icd10cm
```

## Running the Application

### Development Mode

To run the application in development mode with hot-reloading:

```bash
# Start both frontend and backend with concurrent processes
npm run dev:all

# Or start them separately
npm run server    # Start the backend
npm run dev       # Start the frontend development server
```

### Production Mode

For production deployment:

```bash
# Build the frontend
npm run build

# Start the production server (serves both frontend and API)
npm run start
```

### Accessing the Application

Once the server is running, access the application in your browser:

- Development mode: `http://localhost:3000` (frontend) and `http://localhost:5000` (API)
- Production mode: `http://localhost:5000`

## Initial Setup and Data Import

When you first access the application, you'll need to upload an ICD-10-CM data file:

1. On the splash screen, click the "Upload Data File" button or drag and drop a file
2. Select a valid JSONL file containing ICD-10-CM codes
3. The application will process and import the data (this may take a few minutes for large files)
4. A progress bar will indicate the import status
5. Once complete, you'll be redirected to the main interface

## Using the Application

### Searching for Codes

1. Enter a search term in the main search box (e.g., "diabetes", "E11.9", "heart failure")
2. Results will appear as you type
3. Click on any result to view detailed information

### Browsing Alphabetically

1. Use the sidebar on the left to browse codes by their first letter
2. Click on a letter to see all codes starting with that letter
3. Select any code to view its details

### Viewing Code Details

The code detail page provides:
- The official ICD-10-CM code
- Full description
- Detailed context and guidelines
- Option to download the information as PDF

### Resetting the Database

If you need to clear and reload the database:

1. Click the "Reset Database" button in the top-right corner of the home page
2. Confirm the action when prompted
3. The application will clear all data and reload from the last uploaded file
4. The page will refresh automatically when complete

## Data Format

The application expects JSONL files with each line containing a JSON object in this format:

```json
{"code": "A00.0", "description": "Cholera due to Vibrio cholerae 01, biovar cholerae", "detailed_context": "Additional information about the code..."}
```

The `detailed_context` field may contain markdown formatting for better readability.

## Troubleshooting

### MongoDB Connection Issues

If you encounter MongoDB connection errors:

1. Ensure MongoDB is running on your system
2. Check MongoDB service status and logs
3. Verify the connection URI in your environment configuration
4. Ensure you have proper permissions to access the database

### Data Import Problems

If data import fails:

1. Check that your JSONL file is properly formatted
2. Ensure each line is a valid JSON object
3. Verify you have sufficient disk space for database storage
4. Check server logs for specific error messages

### Application Not Starting

If the application won't start:

1. Check for error messages in the console
2. Verify all dependencies are installed correctly
3. Ensure required ports (3000, 5000) are available
4. Check Node.js version compatibility

## Contributing

Contributions to the ICD-10-CM Browser are welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

Please ensure your code follows the existing style and includes appropriate tests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Created by Kaustabh - [GitHub](https://github.com/stabgan)

---

## Acknowledgments

- International Classification of Diseases, 10th Revision, Clinical Modification (ICD-10-CM)
- Centers for Disease Control and Prevention (CDC)
- World Health Organization (WHO)
- All contributors and users of this application 