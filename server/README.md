# ICD-10-CM Elasticsearch API

This is a Node.js server that uses Elasticsearch to provide fast and powerful search capabilities for the ICD-10-CM browser application.

## Prerequisites

Before running this server, you need to have:

1. Node.js (v14+) installed on your system
2. Elasticsearch (v7.x or v8.x) installed and running
   - You can download Elasticsearch from: https://www.elastic.co/downloads/elasticsearch
   - Or use Docker: `docker run -d -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:8.12.0`

## Setup

1. Install dependencies:
   ```
   cd server
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env` (if not already done)
   - Edit `.env` to match your Elasticsearch setup (default should work with local installation)

3. Index the data:
   ```
   npm run index
   ```
   This will:
   - Create the Elasticsearch index with appropriate mappings
   - Read the JSONL file and index all ICD-10-CM codes
   - This process might take several minutes depending on your hardware

## Running the Server

1. Start the server in development mode:
   ```
   npm run dev
   ```

2. For production, use:
   ```
   npm start
   ```

The server will run on port 5000 by default (configurable in `.env`).

## API Endpoints

### GET /api/health
Check server and Elasticsearch health.

### GET /api/search
Search for ICD-10-CM codes.

Parameters:
- `q`: Search query (required)
- `limit`: Maximum number of results (optional, default: 100)
- `page`: Page number for pagination (optional, default: 1)

Example:
```
GET /api/search?q=diabetes&limit=20&page=1
```

### GET /api/code/:codeId
Get details for a specific ICD-10-CM code.

Example:
```
GET /api/code/E11.9
```

## Integration with Frontend

To connect your React application to this API:

1. Update your frontend API calls to point to this server
2. Use the search endpoint for the search functionality
3. Use the code endpoint to fetch detailed information about a specific code

## Common Issues

### Elasticsearch Connection Refused
- Make sure Elasticsearch is running and accessible on the configured port
- Check your firewall settings if running on a remote server

### CORS Issues
- The server has CORS enabled by default
- If you have CORS issues, make sure the frontend URL is allowed 