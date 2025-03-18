import { openDB } from 'idb';

// Constants for processing
const CHUNK_SIZE = 1024 * 1024 * 5; // 5MB chunks
const BATCH_SIZE = 200; // Process 200 items at a time

/**
 * Verify the database schema exists and is ready for imports
 */
export const verifyDatabaseSchema = async () => {
  try {
    console.log('Verifying database schema...');
    const db = await openDB('medicodes', 2, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);
        
        // Check if object stores already exist
        const storeNames = Array.from(db.objectStoreNames);
        
        // Create main codes store if it doesn't exist
        if (!storeNames.includes('codes')) {
          const codeStore = db.createObjectStore('codes', { keyPath: 'code' });
          codeStore.createIndex('description', 'description', { unique: false });
          console.log('Created codes object store');
        }
        
        // Create details store for detailed content if it doesn't exist
        if (!storeNames.includes('details')) {
          db.createObjectStore('details', { keyPath: 'code' });
          console.log('Created details object store');
        }
      }
    });
    
    console.log('Database schema verified');
    return db;
  } catch (error) {
    console.error('Failed to verify database schema:', error);
    throw new Error(`Database initialization failed: ${error.message}`);
  }
};

/**
 * Process a large JSONL file in chunks with progress reporting
 */
export const processLargeJSONLFile = async (file, progressMessageCallback, progressCallback) => {
  try {
    // Check for persistent storage permission for large files
    if (file.size > 100 * 1024 * 1024) { // 100MB+
      progressMessageCallback('Requesting storage permission for large file...');
      try {
        if (navigator.storage && navigator.storage.persist) {
          const isPersisted = await navigator.storage.persist();
          progressMessageCallback(`Storage ${isPersisted ? 'will' : 'will not'} be persisted.`);
        }
      } catch (error) {
        console.warn('Failed to request persistent storage:', error);
      }
      
      // Check available storage
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const availableSpace = estimate.quota - estimate.usage;
        const requiredSpace = file.size * 1.5; // Estimate with overhead
        
        if (availableSpace < requiredSpace) {
          throw new Error(`Not enough storage space. Need ~${Math.ceil(requiredSpace / (1024 * 1024))}MB but only have ${Math.floor(availableSpace / (1024 * 1024))}MB available.`);
        }
        
        progressMessageCallback(`Storage: ${Math.floor(availableSpace / (1024 * 1024))}MB available`);
      }
    }
    
    // Open database connection
    const db = await verifyDatabaseSchema();
    
    // Start processing
    progressMessageCallback(`Processing ${file.name}: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
    
    let processedItems = 0;
    let totalValidItems = 0;
    let processedBytes = 0;
    
    // Create file reader for chunks
    const reader = new FileReader();
    
    // Create a function to read chunks
    const readNextChunk = (start) => {
      return new Promise((resolve, reject) => {
        const chunk = file.slice(start, start + CHUNK_SIZE);
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(chunk);
      });
    };
    
    // Process the file in chunks
    let currentPosition = 0;
    let carryover = ''; // For incomplete lines between chunks
    
    while (currentPosition < file.size) {
      // Read the next chunk
      const chunkText = await readNextChunk(currentPosition);
      currentPosition += CHUNK_SIZE;
      processedBytes = currentPosition > file.size ? file.size : currentPosition;
      
      // Update progress based on bytes processed
      const percentComplete = Math.floor((processedBytes / file.size) * 100);
      progressCallback(percentComplete);
      progressMessageCallback(`Processing file: ${percentComplete}% (${Math.floor(processedBytes / (1024 * 1024))}MB of ${Math.floor(file.size / (1024 * 1024))}MB)`);
      
      // Process the chunk (with carryover from previous chunk)
      const textToProcess = carryover + chunkText;
      
      // Split by newlines but keep last potentially incomplete line for next chunk
      const lines = textToProcess.split('\n');
      carryover = currentPosition < file.size ? lines.pop() || '' : '';
      
      // Process in batches to avoid blocking the UI
      for (let i = 0; i < lines.length; i += BATCH_SIZE) {
        const batch = lines.slice(i, i + BATCH_SIZE);
        
        // Process batch items
        const validItems = [];
        const detailItems = [];
        
        for (const line of batch) {
          if (!line.trim()) continue;
          
          try {
            // Parse JSON from line
            const item = JSON.parse(line);
            
            // Validate required fields
            if (!item.code || !item.description) {
              console.warn('Skipping item without required fields:', item);
              continue;
            }
            
            // Standardize the code format (uppercase, trim)
            item.code = item.code.toUpperCase().trim();
            
            // Add to valid items
            validItems.push(item);
            
            // If item has detailed context, add to details store
            if (item.detailed_context) {
              detailItems.push({
                code: item.code,
                detailed_context: item.detailed_context
              });
            }
            
            totalValidItems++;
          } catch (error) {
            console.error('Error parsing line:', error, line);
          }
        }
        
        processedItems += batch.length;
        
        // Store valid items in transaction
        if (validItems.length > 0) {
          const tx = db.transaction(['codes', 'details'], 'readwrite');
          
          // Store all code items
          const codesStore = tx.objectStore('codes');
          for (const item of validItems) {
            await codesStore.put(item);
          }
          
          // Store detail items if any
          if (detailItems.length > 0) {
            const detailsStore = tx.objectStore('details');
            for (const item of detailItems) {
              await detailsStore.put(item);
            }
          }
          
          await tx.done;
          
          // Update progress message
          if (processedItems % 1000 === 0 || processedItems === lines.length) {
            progressMessageCallback(`Processed ${processedItems} lines, stored ${totalValidItems} valid codes`);
          }
        }
      }
    }
    
    progressMessageCallback(`Import complete: ${totalValidItems} valid codes imported`);
    progressCallback(100);
    
    // Close the database
    db.close();
    return totalValidItems;
  } catch (error) {
    console.error('Error processing file:', error);
    throw error;
  }
};

// Default export
export default {
  verifyDatabaseSchema,
  processLargeJSONLFile
}; 