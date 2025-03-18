import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;
const upload = multer({ dest: 'uploads/' });

// MongoDB connection
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri, {
  connectTimeoutMS: 5000,
  serverSelectionTimeoutMS: 5000
});
const dbName = 'icd10cm';
const codesCollection = 'codes';
const indexMetaCollection = 'indexMeta';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Store processing state globally
let processingStatus = {
  inProgress: false,
  progress: 0,
  message: '',
  error: null,
  fileData: null
};

// Connect to MongoDB with retry
async function connectToMongo() {
  let retries = 3;
  while (retries > 0) {
    try {
      await client.connect();
      console.log('Connected to MongoDB service');
      return client.db(dbName);
    } catch (error) {
      retries--;
      if (retries === 0) {
        console.error('MongoDB connection error after multiple attempts:', error);
        console.error('Make sure the MongoDB service is running on port 27017');
        console.error('You can check this by running "services.msc" and looking for MongoDB service');
        return null;
      }
      console.log(`Connection failed, retrying... (${retries} attempts left)`);
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

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

// SSE endpoint for progress updates
app.get('/api/processing-status', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send initial status
  res.write(`data: ${JSON.stringify(processingStatus)}\n\n`);
  
  // Set up interval to send updates
  const intervalId = setInterval(() => {
    res.write(`data: ${JSON.stringify(processingStatus)}\n\n`);
    
    // If processing is complete or errored, end the connection
    if (!processingStatus.inProgress) {
      clearInterval(intervalId);
      res.end();
    }
  }, 1000);
  
  // Handle client disconnect
  req.on('close', () => {
    clearInterval(intervalId);
  });
});

// Add endpoint to reset database and reload data from a file
app.post('/api/reset-database', async (req, res) => {
  // Check if a file has been uploaded previously
  try {
    const db = await connectToMongo();
    
    if (!db) {
      return res.status(500).json({ 
        error: 'Failed to connect to MongoDB',
        success: false
      });
    }
    
    // Find last processed file info from indexMetaCollection
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
    
    // Reset database in background (reuse same function that processes uploads)
    const collection = db.collection(codesCollection);
    await collection.deleteMany({});
    await indexCollection.deleteMany({});
    
    // Check if the last uploaded file data exists in processingStatus
    if (processingStatus.fileData && processingStatus.fileData.path && fs.existsSync(processingStatus.fileData.path)) {
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
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Error resetting database: ' + error.message,
        success: false
      });
    }
  }
});

// Process file in background
async function processFileInBackground(filePath) {
  const db = await connectToMongo();
  
  if (!db) {
    processingStatus.inProgress = false;
    processingStatus.error = 'Failed to connect to MongoDB. Please check if the service is running.';
    fs.unlinkSync(filePath);
    return;
  }
  
  const collection = db.collection(codesCollection);
  const indexCollection = db.collection(indexMetaCollection);
  
  try {
    // Clear existing data
    processingStatus.message = 'Clearing existing data...';
    await collection.deleteMany({});
    await indexCollection.deleteMany({});
    
    const startTime = Date.now();
    const fileStream = createReadStream(filePath);
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    let count = 0;
    const batchSize = 500;
    let batch = [];
    let letterChunks = {};
    
    // Get file size for accurate progress calculation
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    let bytesRead = 0;
    
    processingStatus.message = 'Processing data...';
    
    // Process file line by line
    for await (const line of rl) {
      if (!line.trim()) continue;
      
      bytesRead += Buffer.byteLength(line) + 1; // +1 for newline character
      processingStatus.progress = Math.min(99, Math.floor((bytesRead / fileSize) * 100));
      
      try {
        const codeData = JSON.parse(line);
        if (codeData.code && codeData.description) {
          // Add to batch
          batch.push(codeData);
          count++;
          
          // Organize by first letter for letter chunks
          const firstChar = codeData.code.charAt(0);
          if (!letterChunks[firstChar]) {
            letterChunks[firstChar] = [];
          }
          letterChunks[firstChar].push(codeData.code);
          
          // Insert batch when it reaches batchSize
          if (batch.length >= batchSize) {
            await collection.insertMany(batch);
            batch = [];
          }
        }
      } catch (error) {
        console.error('Error parsing line:', error);
        // Continue processing even if one line has an error
      }
    }
    
    // Insert any remaining documents
    if (batch.length > 0) {
      await collection.insertMany(batch);
    }
    
    // Create indexes for faster searching
    processingStatus.message = 'Creating indexes...';
    processingStatus.progress = 99;
    await collection.createIndex({ code: 1 });
    await collection.createIndex({ description: "text" });
    // Add additional indexes for enhanced search
    await collection.createIndex({ "detail_context": "text" });
    // Compound text index on multiple fields
    await collection.createIndex({ 
      code: "text", 
      description: "text", 
      detail_context: "text" 
    }, {
      weights: {
        code: 10,        // Highest priority
        description: 5,   // Medium priority
        detail_context: 2 // Lower priority
      },
      name: "comprehensive_search_index"
    });
    
    // Store metadata
    await indexCollection.insertOne({
      id: 'main',
      totalCodes: count,
      chunkCount: Object.keys(letterChunks).length,
      chunkMap: letterChunks,
      processTimeSeconds: (Date.now() - startTime) / 1000,
      lastUpdated: new Date().toISOString()
    });
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);
    
    // Update status to complete
    processingStatus = {
      inProgress: false,
      progress: 100,
      message: 'Processing complete',
      error: null,
      totalCodes: count,
      processTimeSeconds: (Date.now() - startTime) / 1000
    };
  } catch (error) {
    console.error('Error processing file:', error);
    processingStatus = {
      inProgress: false,
      progress: 0,
      message: 'Error processing file',
      error: error.message
    };
    
    // Clean up in case of error
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.error('Error cleaning up file:', e);
    }
  }
}

// Check if data is loaded
app.get('/api/check-data', async (req, res) => {
  try {
    const db = await connectToMongo();
    if (!db) {
      return res.status(500).json({ 
        error: 'Failed to connect to MongoDB',
        dataLoaded: false 
      });
    }
    
    const indexCollection = db.collection(indexMetaCollection);
    const indexData = await indexCollection.findOne({ id: 'main' });
    
    res.json({ 
      dataLoaded: !!indexData,
      totalCodes: indexData ? indexData.totalCodes : 0,
      lastUpdated: indexData ? indexData.lastUpdated : null,
      chunkMap: indexData ? indexData.chunkMap : null
    });
  } catch (error) {
    res.status(500).json({ error: 'Error checking data: ' + error.message });
  }
});

// Get code index structure
app.get('/api/code-index', async (req, res) => {
  try {
    const db = await connectToMongo();
    if (!db) {
      return res.status(500).json({ 
        error: 'Failed to connect to MongoDB'
      });
    }
    
    const indexCollection = db.collection(indexMetaCollection);
    const indexData = await indexCollection.findOne({ id: 'main' });
    
    if (!indexData) {
      return res.status(404).json({ error: 'Index data not found' });
    }
    
    res.json({ 
      totalCodes: indexData.totalCodes,
      chunkMap: indexData.chunkMap,
      lastUpdated: indexData.lastUpdated
    });
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving code index: ' + error.message });
  }
});

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
    
    // Highlight matching terms in results
    const processedResults = results.map(result => {
      // Create a processed copy to avoid modifying the original
      const processed = { ...result };
      
      // Only include highlightedContext if detail_context exists
      if (result.detail_context) {
        // Find the position of the query in the detail_context
        const lowerQuery = query.toLowerCase();
        const lowerContext = result.detail_context.toLowerCase();
        const index = lowerContext.indexOf(lowerQuery);
        
        if (index !== -1) {
          // Get a snippet around the matching text
          const startPos = Math.max(0, index - 50);
          const endPos = Math.min(result.detail_context.length, index + query.length + 100);
          let snippet = result.detail_context.substring(startPos, endPos);
          
          // Add ellipsis if we're not at the beginning/end
          if (startPos > 0) snippet = '...' + snippet;
          if (endPos < result.detail_context.length) snippet = snippet + '...';
          
          processed.highlightedContext = snippet;
        }
      }
      
      return processed;
    });
    
    res.json({ results: processedResults });
  } catch (error) {
    res.status(500).json({ error: 'Error searching: ' + error.message });
  }
});

// Get code by ID
app.get('/api/code/:id', async (req, res) => {
  const codeId = req.params.id;
  if (!codeId) {
    return res.status(400).json({ error: 'Code ID required' });
  }
  
  try {
    const db = await connectToMongo();
    if (!db) {
      return res.status(500).json({ 
        error: 'Failed to connect to MongoDB'
      });
    }
    
    const collection = db.collection(codesCollection);
    const code = await collection.findOne({ code: codeId });
    
    if (!code) {
      return res.status(404).json({ error: 'Code not found' });
    }
    
    res.json({ code });
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving code: ' + error.message });
  }
});

// Get codes for a letter
app.get('/api/codes/:letter', async (req, res) => {
  const letter = req.params.letter;
  
  try {
    const db = await connectToMongo();
    if (!db) {
      return res.status(500).json({ 
        error: 'Failed to connect to MongoDB',
        codes: [] 
      });
    }
    
    const collection = db.collection(codesCollection);
    
    const codes = await collection.find({
      code: { $regex: `^${letter}`, $options: 'i' }
    }).limit(1000).toArray();
    
    res.json({ codes });
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving codes: ' + error.message });
  }
});

// Catch-all route to serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 