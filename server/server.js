import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create Elasticsearch client
const esClient = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Check Elasticsearch connection
async function checkEsConnection() {
  try {
    const info = await esClient.info();
    console.log(`Connected to Elasticsearch cluster: ${info.cluster_name}`);
    
    // Check if our index exists
    const indexExists = await esClient.indices.exists({
      index: process.env.ELASTICSEARCH_INDEX
    });
    
    if (!indexExists) {
      console.warn(`Index ${process.env.ELASTICSEARCH_INDEX} does not exist. Run the indexer.js script to create it.`);
    } else {
      console.log(`Index ${process.env.ELASTICSEARCH_INDEX} is ready for search`);
    }
  } catch (error) {
    console.error('Error connecting to Elasticsearch:', error);
    process.exit(1);
  }
}

// API Routes

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await esClient.info();
    res.json({
      status: 'ok',
      elasticsearch: result
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Search endpoint
app.get('/api/search', async (req, res) => {
  try {
    const { q, limit = 100, page = 1 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        status: 'error',
        message: 'Query parameter "q" is required'
      });
    }
    
    const size = parseInt(limit);
    const from = (parseInt(page) - 1) * size;
    
    const result = await esClient.search({
      index: process.env.ELASTICSEARCH_INDEX,
      body: {
        from,
        size,
        query: {
          multi_match: {
            query: q,
            fields: ['code^3', 'description^2', 'detailed_context'],
            fuzziness: 'AUTO',
            minimum_should_match: '70%'
          }
        },
        highlight: {
          fields: {
            description: {
              pre_tags: ['<mark>'],
              post_tags: ['</mark>']
            },
            detailed_context: {
              fragment_size: 150,
              number_of_fragments: 1,
              pre_tags: ['<mark>'],
              post_tags: ['</mark>']
            }
          }
        }
      }
    });
    
    const hits = result.hits.hits;
    const total = result.hits.total.value;
    
    const searchResults = hits.map(hit => {
      return {
        code: hit._source.code,
        description: hit._source.description,
        contextSnippet: hit.highlight?.detailed_context?.[0] || null,
        score: hit._score
      };
    });
    
    res.json({
      status: 'success',
      total,
      page: parseInt(page),
      limit: size,
      results: searchResults
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Get a single ICD-10 code by ID
app.get('/api/code/:codeId', async (req, res) => {
  try {
    const { codeId } = req.params;
    
    const result = await esClient.search({
      index: process.env.ELASTICSEARCH_INDEX,
      body: {
        query: {
          term: {
            code: {
              value: codeId
            }
          }
        }
      }
    });
    
    if (result.hits.total.value === 0) {
      return res.status(404).json({
        status: 'error',
        message: `ICD-10-CM code ${codeId} not found`
      });
    }
    
    res.json({
      status: 'success',
      data: result.hits.hits[0]._source
    });
    
  } catch (error) {
    console.error('Error fetching code:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await checkEsConnection();
});

export default app; 