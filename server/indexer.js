import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Set up paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFolder = path.join(__dirname, '../data');
const jsonlFilePath = path.join(dataFolder, 'icd10_cm_code_detailed.jsonl');

// Elasticsearch client
const esClient = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200'
});

// Index name
const INDEX_NAME = process.env.ELASTICSEARCH_INDEX || 'icd10cm';

// Batch size for bulk indexing
const BATCH_SIZE = 1000;

// Define index mapping
const indexMapping = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    analysis: {
      analyzer: {
        custom_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'asciifolding', 'snowball']
        }
      }
    }
  },
  mappings: {
    properties: {
      code: { 
        type: 'keyword' 
      },
      description: { 
        type: 'text',
        analyzer: 'custom_analyzer',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256
          }
        }
      },
      detailed_context: { 
        type: 'text',
        analyzer: 'custom_analyzer'
      }
    }
  }
};

async function createIndex() {
  try {
    // Check if index already exists
    const indexExists = await esClient.indices.exists({
      index: INDEX_NAME
    });
    
    if (indexExists) {
      console.log(`Index ${INDEX_NAME} already exists. Deleting...`);
      await esClient.indices.delete({
        index: INDEX_NAME
      });
    }
    
    // Create index with mappings
    console.log(`Creating index ${INDEX_NAME} with mappings...`);
    await esClient.indices.create({
      index: INDEX_NAME,
      body: indexMapping
    });
    
    console.log(`Index ${INDEX_NAME} created successfully!`);
  } catch (error) {
    console.error('Error creating index:', error);
    process.exit(1);
  }
}

async function indexData() {
  try {
    // Check if JSONL file exists
    if (!fs.existsSync(jsonlFilePath)) {
      console.error(`JSONL file not found: ${jsonlFilePath}`);
      console.error('Please make sure the file exists at the correct location.');
      process.exit(1);
    }
    
    // Create readable stream
    const fileStream = fs.createReadStream(jsonlFilePath);
    
    // Create interface to read line by line
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    let batch = [];
    let totalIndexed = 0;
    let batchCount = 0;
    
    console.log('Starting to index documents...');
    console.time('Indexing time');
    
    // Process each line (each JSON object)
    for await (const line of rl) {
      if (!line.trim()) continue;
      
      try {
        const document = JSON.parse(line);
        
        // Add to current batch
        batch.push({
          index: { _index: INDEX_NAME }
        });
        batch.push(document);
        
        // If batch is full, index it
        if (batch.length >= BATCH_SIZE * 2) {
          await esClient.bulk({ body: batch });
          totalIndexed += batch.length / 2;
          batchCount++;
          console.log(`Indexed batch ${batchCount} (${totalIndexed} documents so far)`);
          batch = [];
        }
      } catch (err) {
        console.error('Error parsing JSON line:', err);
      }
    }
    
    // Index any remaining documents
    if (batch.length > 0) {
      await esClient.bulk({ body: batch });
      totalIndexed += batch.length / 2;
      console.log(`Indexed final batch (${totalIndexed} total documents)`);
    }
    
    console.timeEnd('Indexing time');
    console.log(`Successfully indexed ${totalIndexed} documents into ${INDEX_NAME}`);
    
    // Refresh the index
    await esClient.indices.refresh({ index: INDEX_NAME });
    console.log('Index refreshed.');
    
    // Get index stats
    const stats = await esClient.indices.stats({ index: INDEX_NAME });
    console.log(`Documents in index: ${stats.indices[INDEX_NAME].total.docs.count}`);
    console.log(`Index size: ${(stats.indices[INDEX_NAME].total.store.size_in_bytes / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('Error indexing data:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('Elasticsearch Indexer for ICD-10-CM');
  console.log('===================================');
  
  try {
    // Check Elasticsearch connection
    const info = await esClient.info();
    console.log(`Connected to Elasticsearch cluster: ${info.cluster_name}`);
    
    // Create index and index data
    await createIndex();
    await indexData();
    
    console.log('Indexing process completed successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 