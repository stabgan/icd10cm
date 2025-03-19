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

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created uploads directory: ${uploadsDir}`);
}

const upload = multer({ dest: uploadsDir });

// Static file serving
const distPath = path.join(__dirname, 'dist');
console.log(`Using dist path: ${distPath}`);

// MongoDB connection
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri, {
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000
});
const dbName = 'icd10cm';
const codesCollection = 'codes';
const indexMetaCollection = 'indexMeta';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(distPath));

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
  let retries = 5;
  while (retries > 0) {
    try {
      await client.connect();
      console.log('Connected to MongoDB service');
      return client.db(dbName);
    } catch (error) {
      retries--;
      const remainingAttempts = retries > 0 ? `(${retries} attempts left)` : '(final attempt)';
      console.error(`MongoDB connection error ${remainingAttempts}:`, error.message);
      
      if (retries === 0) {
        console.error('Failed to connect to MongoDB after multiple attempts');
        console.error('Make sure the MongoDB service is running on port 27017');
        console.error('You can check this by running "services.msc" and looking for MongoDB service');
        return null;
      }
      
      console.log(`Connection failed, retrying... ${remainingAttempts}`);
      // Wait longer between retries
      await new Promise(resolve => setTimeout(resolve, 2000));
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

// Endpoint for processing status updates
app.get('/api/processing-status', (req, res) => {
  // Set headers for Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  
  // Write initial status
  res.write(`data: ${JSON.stringify(processingStatus)}\n\n`);
  
  // Function to send updates
  const sendUpdate = () => {
    // Clone the status to avoid reference issues
    const currentStatus = { ...processingStatus };
    
    // Add timestamp for debugging
    currentStatus.timestamp = new Date().toISOString();
    
    // Add more user-friendly messages based on progress
    if (currentStatus.progress < 10) {
      currentStatus.friendlyStatus = 'Initializing...';
    } else if (currentStatus.progress < 20) {
      currentStatus.friendlyStatus = 'Preparing database...';
    } else if (currentStatus.progress < 50) {
      currentStatus.friendlyStatus = 'Reading file data...';
    } else if (currentStatus.progress < 70) {
      currentStatus.friendlyStatus = 'Processing medical codes...';
    } else if (currentStatus.progress < 90) {
      currentStatus.friendlyStatus = 'Organizing data structures...';
    } else if (currentStatus.progress < 95) {
      currentStatus.friendlyStatus = 'Creating database indexes...';
    } else if (currentStatus.progress < 100) {
      currentStatus.friendlyStatus = 'Finalizing...';
    } else {
      currentStatus.friendlyStatus = 'Complete!';
    }
    
    // Send the update
    res.write(`data: ${JSON.stringify(currentStatus)}\n\n`);
    
    // Close connection when processing is complete or on error
    if (!processingStatus.inProgress || processingStatus.error) {
      clearInterval(interval);
      res.end();
    }
  };
  
  // Set up interval to send updates
  const interval = setInterval(sendUpdate, 500);
  
  // Clean up on close
  req.on('close', () => {
    clearInterval(interval);
    res.end();
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
    
    try {
      processingStatus.message = 'Dropping collections...';
      processingStatus.progress = 10;
      
      // Get all collection names
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      const totalCollections = collectionNames.length;
      
      if (totalCollections === 0) {
        processingStatus.message = 'No collections found to reset';
        processingStatus.progress = 50;
      } else {
        // Drop each collection except system collections
        let droppedCount = 0;
        for (const name of collectionNames) {
          if (!name.startsWith('system.')) {
            try {
              // First drop all indexes in the collection (except _id)
              const collection = db.collection(name);
              const indexInfo = await collection.indexInformation().catch(e => ({}));
              
              for (const indexName of Object.keys(indexInfo)) {
                if (indexName !== '_id_') {
                  await collection.dropIndex(indexName).catch(e => {
                    console.warn(`Warning: Failed to drop index ${indexName} in collection ${name}:`, e.message);
                  });
                }
              }
              
              // Then drop the collection
              await collection.drop().catch(err => {
                console.warn(`Warning: Failed to drop collection ${name}:`, err.message);
              });
              
              droppedCount++;
              processingStatus.progress = 10 + Math.floor((droppedCount / totalCollections) * 40);
              processingStatus.message = `Dropped collection ${name} (${droppedCount}/${totalCollections})`;
            } catch (err) {
              console.warn(`Error processing collection ${name}:`, err.message);
            }
          }
        }
      }
      
      processingStatus.progress = 50;
      processingStatus.message = 'Collections reset complete';
      
      // Check if the last uploaded file data exists in processingStatus
      if (processingStatus.fileData && processingStatus.fileData.path && fs.existsSync(processingStatus.fileData.path)) {
        processingStatus.message = 'Reloading data from last uploaded file...';
        processFileInBackground(processingStatus.fileData.path);
      } else {
        // Try to find the most recent file in uploads directory
        const uploadsDir = path.join(__dirname, 'uploads');
        if (fs.existsSync(uploadsDir)) {
          const files = fs.readdirSync(uploadsDir);
          if (files.length > 0) {
            // Sort by creation time, most recent first
            const sortedFiles = files.map(file => {
              return {
                name: file,
                time: fs.statSync(path.join(uploadsDir, file)).mtime.getTime()
              };
            }).sort((a, b) => b.time - a.time);
            
            if (sortedFiles.length > 0) {
              const newestFile = path.join(uploadsDir, sortedFiles[0].name);
              processingStatus.message = `Reloading data from most recent file: ${path.basename(newestFile)}`;
              processFileInBackground(newestFile);
              return;
            }
          }
        }
        
        processingStatus = {
          inProgress: false,
          progress: 100,
          message: 'Reset completed. No file found to reload. Please upload a new file.',
          error: null
        };
      }
    } catch (error) {
      console.error('Error during reset:', error);
      processingStatus = {
        inProgress: false,
        progress: 0,
        message: 'Error during reset',
        error: error.message
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
  // Add start time tracking
  const startTime = Date.now();
  
  try {
    // First check if the file exists and is a regular file, not a directory
    const fileStats = fs.statSync(filePath);
    if (!fileStats.isFile()) {
      processingStatus = {
        inProgress: false,
        progress: 0,
        message: 'Error: Not a valid file',
        error: 'The selected path is not a file'
      };
      return;
    }
    
    const db = await connectToMongo();
    
    if (!db) {
      processingStatus.inProgress = false;
      processingStatus.error = 'Failed to connect to MongoDB. Please check if the service is running.';
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.error('Error cleaning up file:', e);
      }
      return;
    }
    
    const collection = db.collection(codesCollection);
    const indexCollection = db.collection(indexMetaCollection);
    
    try {
      // Clear existing data
      processingStatus.message = 'Clearing existing data...';
      await collection.deleteMany({});
      await indexCollection.deleteMany({});
      
      // Get file size for accurate progress calculation
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      let bytesRead = 0;
      
      processingStatus.message = 'Processing data...';
      
      // Process file line by line
      const fileStream = createReadStream(filePath);
      const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });
      
      let count = 0;
      const batchSize = 500;
      let batch = [];
      let letterChunks = {};
      
      // Process file line by line
      for await (const line of rl) {
        if (!line.trim()) continue;
        
        bytesRead += Buffer.byteLength(line) + 1; // +1 for newline character
        processingStatus.progress = Math.min(90, Math.floor((bytesRead / fileSize) * 100));
        
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
      processingStatus.progress = 95;
      
      // Check for existing indexes and drop them before creating new ones
      try {
        const indexInfo = await collection.indexInformation();
        const indexNames = Object.keys(indexInfo);
        
        // Drop existing indexes except the default _id index
        for (const indexName of indexNames) {
          if (indexName !== '_id_') {
            await collection.dropIndex(indexName);
          }
        }
        
        console.log('Existing indexes dropped successfully');
      } catch (err) {
        console.warn('No existing indexes to drop or error dropping indexes:', err.message);
      }
      
      // Create basic indexes separately
      await collection.createIndex({ code: 1 }, { name: "code_index" });
      processingStatus.progress = 96;
      
      // Only create one text index to avoid conflicts
      // MongoDB only allows one text index per collection
      try {
        processingStatus.progress = 98;
        await collection.createIndex({ 
          description: "text", 
          detail_context: "text" 
        }, {
          weights: {
            description: 3,   // Higher priority
            detail_context: 1 // Lower priority
          },
          name: "text_search_index",
          default_language: "english"
        });
      } catch (indexError) {
        console.error('Error creating text index:', indexError);
        // If there's an error with indexes, try a simpler approach
        try {
          await collection.createIndex({ description: "text" }, { name: "description_text_index" });
        } catch (fallbackError) {
          console.error('Error creating fallback index:', fallbackError);
        }
      }
      
      // Store metadata
      await indexCollection.insertOne({
        id: 'main',
        totalCodes: count,
        chunkCount: Object.keys(letterChunks).length,
        chunkMap: letterChunks,
        processTimeSeconds: (Date.now() - startTime) / 1000,
        lastUpdated: new Date().toISOString()
      });
      
      // Clean up uploaded file - using try/catch to handle permission issues
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.warn('Warning: Could not delete uploaded file:', e.message);
      }
      
      // Update status to complete
      processingStatus = {
        inProgress: false,
        progress: 100,
        message: 'Processing complete',
        error: null,
        totalCodes: count,
        processTimeSeconds: (Date.now() - startTime) / 1000,
        fileData: {
          path: filePath,
          originalName: processingStatus.fileData ? processingStatus.fileData.originalName : 'unknown',
          size: stats.size
        }
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
        console.warn('Warning: Could not delete uploaded file:', e.message);
      }
    }
  } catch (error) {
    console.error('Error processing file:', error);
    processingStatus = {
      inProgress: false,
      progress: 0,
      message: 'Error initializing file processing',
      error: error.message
    };
  }
}

// API endpoint to check if data is loaded
app.get('/api/check-data', async (req, res) => {
  try {
    const db = await connectToMongo();
    if (!db) {
      // Return 200 with empty result if MongoDB is not connected
      return res.json({ 
        loaded: false, 
        error: 'MongoDB not connected',
        message: 'MongoDB service is not running or not accessible'
      });
    }
    
    const collection = db.collection(codesCollection);
    const count = await collection.countDocuments();
    
    res.json({
      loaded: count > 0,
      count: count
    });
  } catch (error) {
    console.error('Error checking data:', error);
    res.status(200).json({ 
      loaded: false, 
      error: error.message 
    });
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

// Catch-all route to serve the frontend (React Router support)
app.get('*', (req, res) => {
  // Ignore API routes
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Try to find the index.html file for client-side routing
  const indexFile = path.join(distPath, 'index.html');
  if (fs.existsSync(indexFile)) {
    console.log(`Serving index.html for path: ${req.path}`);
    res.sendFile(indexFile);
  } else {
    console.error(`Cannot find index.html at ${indexFile}`);
    res.status(500).send(`Server Error: Cannot find index.html. Looked at: ${indexFile}`);
  }
});

// Start server
const startServer = (attemptPort = port) => {
  const server = app.listen(attemptPort, () => {
    console.log(`Server running on port ${attemptPort}`);
    console.log(`Server directory: ${__dirname}`);
    console.log(`Static files served from: ${distPath}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${attemptPort} is in use, trying port ${attemptPort + 1}...`);
      startServer(attemptPort + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer(); 