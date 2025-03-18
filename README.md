# ICD-10-CM Browser

A web application for browsing and searching ICD-10-CM diagnosis codes.

## Features

- Process and store large JSONL files of ICD-10-CM codes in MongoDB
- Provide a responsive UI that works across all device sizes
- Support dark/light mode theming based on user preference
- Display detailed code information with proper formatting
- Alphabetical browsing of codes via sidebar
- Database reset and reload functionality
- MongoDB backend for robust data management

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (installed and running as a service)
- NPM or Yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/stabgan/icd10cm.git
cd icd10cm
```

2. Install dependencies:
```bash
npm install
```

3. Ensure MongoDB is running:
```bash
# On Windows, check if the MongoDB service is running
services.msc

# On macOS/Linux
sudo systemctl status mongodb
# or
brew services list
```

## Usage

### Development Mode

Run the application in development mode:

```bash
npm run dev:all
```

This starts both the React frontend and Express backend with hot-reloading.

### Production Mode

Build and run the application in production mode:

```bash
npm run start
```

This builds the React frontend and starts the Express server.

### Access the Application

Open your browser and navigate to:

```
http://localhost:5000
```

### Initial Setup

1. When you first access the application, you'll be prompted to upload an ICD-10-CM JSONL file.
2. After uploading, the file will be processed and loaded into the MongoDB database.
3. Once processing is complete, you can search and browse codes.

## Data Format

The application expects JSONL files with ICD-10-CM codes in the following format:

```json
{"code": "A00.0", "description": "Cholera due to Vibrio cholerae 01, biovar cholerae", "detail_context": "..."}
```

## Resetting the Database

To clear the database and reload data:

1. Click the "Reset Database" button on the main page
2. Confirm the action
3. The application will clear the database and reload from the last uploaded file

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Kaustabh - [GitHub](https://github.com/stabgan) 