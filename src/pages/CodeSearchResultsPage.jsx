import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  Button, 
  Container, 
  CircularProgress, 
  Alert,
  Chip,
  useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Fuse from 'fuse.js';

const CodeSearchResultsPage = () => {
  const { query } = useParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeoutOccurred, setTimeoutOccurred] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Clean up timeout on unmount or when query changes
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  useEffect(() => {
    const performSearch = async () => {
      if (!query) {
        setResults([]);
        setLoading(false);
        return;
      }

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setLoading(true);
      setError(null);
      setTimeoutOccurred(false);
      
      // Set a timeout to prevent indefinite loading
      timeoutRef.current = setTimeout(() => {
        console.warn(`Search operation timed out for query: ${query}`);
        setTimeoutOccurred(true);
        if (loading) {
          setError("Search operation timed out. Please try again or with a different query.");
          setLoading(false);
        }
      }, 10000); // 10 second timeout

      try {
        // Open database 
        const dbRequest = window.indexedDB.open('medicodes', 2);
        
        dbRequest.onerror = (event) => {
          clearTimeout(timeoutRef.current);
          console.error("Error opening database:", event.target.error);
          setError("Failed to access database: " + event.target.error.message);
          setLoading(false);
        };
        
        dbRequest.onsuccess = (event) => {
          const db = event.target.result;
          
          // Check if searchIndex store exists
          if (!db.objectStoreNames.contains('searchIndex')) {
            clearTimeout(timeoutRef.current);
            setError('No search data available. Please import a data file first.');
            setLoading(false);
            db.close();
            return;
          }
          
          try {
            const transaction = db.transaction(['searchIndex'], 'readonly');
            const store = transaction.objectStore('searchIndex');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
              const index = getAllRequest.result;
              
              if (!index || index.length === 0) {
                clearTimeout(timeoutRef.current);
                setError('No search data available. Please import a data file first.');
                setLoading(false);
                db.close();
                return;
              }
              
              // Create a new Fuse index for searching
              const fuse = new Fuse(index, {
                keys: [
                  { name: 'code', weight: 5 },
                  { name: 'description', weight: 2 }
                ],
                includeScore: true,
                threshold: 0.3,
                ignoreLocation: true,
                useExtendedSearch: true,
                findAllMatches: true
              });
              
              // Perform search
              console.time('search-execution');
              const searchResults = fuse.search(query);
              console.timeEnd('search-execution');
              
              clearTimeout(timeoutRef.current);
              setResults(searchResults);
              setLoading(false);
              db.close();
            };
            
            getAllRequest.onerror = (event) => {
              clearTimeout(timeoutRef.current);
              console.error("Error getting search index:", event.target.error);
              setError("Failed to load search data: " + event.target.error.message);
              setLoading(false);
              db.close();
            };
          } catch (err) {
            clearTimeout(timeoutRef.current);
            console.error("Error in transaction:", err);
            setError("Failed to search: " + err.message);
            setLoading(false);
            db.close();
          }
        };
      } catch (err) {
        clearTimeout(timeoutRef.current);
        console.error("Error during search:", err);
        setError("Search error: " + err.message);
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  const handleCodeClick = (code) => {
    navigate(`/code/${code}`);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Button
        component={Link}
        to="/"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 3 }}
      >
        Back to Home
      </Button>
      
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SearchIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" component="h1">
            Search Results for "{query}"
          </Typography>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Searching...
            </Typography>
            {timeoutOccurred && (
              <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                Search is taking longer than expected...
              </Typography>
            )}
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : results.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body1">
              No results found for "{query}"
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Try using different keywords or check your spelling
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Found {results.length} result{results.length !== 1 ? 's' : ''}
            </Typography>
            
            <List sx={{ width: '100%' }}>
              {results.map((result, index) => (
                <React.Fragment key={result.item.code}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem 
                    alignItems="flex-start"
                    onClick={() => handleCodeClick(result.item.code)}
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                      },
                      borderRadius: 1,
                      py: 2
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Chip 
                            label={result.item.code} 
                            color="primary" 
                            size="small"
                            sx={{ mr: 1, fontWeight: 'medium' }}
                          />
                          <Typography variant="subtitle1" component="span">
                            {result.item.description}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        result.item.detailed_context && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              overflow: 'hidden',
                              WebkitBoxOrient: 'vertical',
                              WebkitLineClamp: 2,
                              mt: 0.5
                            }}
                          >
                            {result.item.detailed_context.substring(0, 150)}
                            {result.item.detailed_context.length > 150 ? '...' : ''}
                          </Typography>
                        )
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default CodeSearchResultsPage; 