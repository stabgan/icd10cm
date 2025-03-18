import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, TextField, InputAdornment, Chip, CircularProgress, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

const CodeIndex = ({ getSearchIndex }) => {
  const [allCodes, setAllCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLetter, setSelectedLetter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const theme = useTheme();

  // Load all codes from the search index and sort alphabetically
  useEffect(() => {
    const loadCodes = async () => {
      try {
        setLoading(true);
        setError(null);
        const searchIndex = await getSearchIndex();
        
        if (!searchIndex || searchIndex.length === 0) {
          setError('No code data available. Please load a data file first.');
          setLoading(false);
          return;
        }
        
        // Sort codes alphabetically
        const sortedCodes = [...searchIndex].sort((a, b) => 
          a.code.localeCompare(b.code)
        );
        
        console.log(`Loaded ${sortedCodes.length} codes for index`);
        setAllCodes(sortedCodes);
        setLoading(false);
      } catch (err) {
        console.error('Error loading codes for index:', err);
        setError(`Failed to load codes: ${err.message || 'Unknown error'}`);
        setLoading(false);
        // Graceful fallback - show empty list instead of crashing
        setAllCodes([]);
      }
    };

    loadCodes();
  }, [getSearchIndex]);

  // Extract all unique first letters for navigation
  const uniqueFirstLetters = useMemo(() => {
    const letters = new Set();
    allCodes.forEach(code => {
      if (code.code && code.code.length > 0) {
        letters.add(code.code.charAt(0).toUpperCase());
      }
    });
    return Array.from(letters).sort();
  }, [allCodes]);

  // Filter codes by selected letter and search term
  const filteredCodes = useMemo(() => {
    let filtered = allCodes;
    
    // Filter by selected letter
    if (selectedLetter) {
      filtered = filtered.filter(code => 
        code.code.charAt(0).toUpperCase() === selectedLetter
      );
    }
    
    // Filter by search term if provided
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(code => 
        code.code.toLowerCase().includes(term) || 
        (code.description && code.description.toLowerCase().includes(term))
      );
    }
    
    return filtered;
  }, [allCodes, selectedLetter, searchTerm]);

  // Row renderer for virtualized list
  const Row = ({ index, style }) => {
    const code = filteredCodes[index];
    return (
      <Box 
        component={Link} 
        to={`/code/${code.code}`}
        style={style} 
        sx={{
          display: 'block',
          p: 1.5,
          textDecoration: 'none',
          borderBottom: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          transition: 'background-color 0.2s',
          '&:hover': {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          }
        }}
      >
        <Typography 
          variant="subtitle2" 
          component="div" 
          fontWeight="bold"
          color="primary"
          sx={{ mb: 0.5 }}
        >
          {code.code}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {code.description}
        </Typography>
      </Box>
    );
  };

  return (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.9)',
        borderRight: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2.5, 
        borderBottom: '1px solid', 
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 100%)' 
          : 'linear-gradient(to bottom, rgba(25,118,210,0.05) 0%, rgba(0,0,0,0) 100%)'
      }}>
        <Typography 
          variant="h6" 
          component="h2" 
          gutterBottom 
          fontWeight={600}
          color="primary"
        >
          ICD-10 Code Index
        </Typography>
        
        {!loading && allCodes.length > 0 && (
          <Box sx={{ 
            display: 'inline-block', 
            px: 1.5, 
            py: 0.5, 
            mb: 2,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(25,118,210,0.2)' : 'rgba(25,118,210,0.1)',
            borderRadius: 1,
            border: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(25,118,210,0.3)' : 'rgba(25,118,210,0.2)'
          }}>
            <Typography variant="caption" fontWeight={500} color="primary">
              Total: {allCodes.length.toLocaleString()} codes
            </Typography>
          </Box>
        )}
        
        <TextField
          fullWidth
          size="small"
          placeholder="Filter codes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
                borderWidth: 2
              }
            }
          }}
        />
        
        {/* Letter navigation */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          <Chip 
            label="All"
            color={!selectedLetter ? "primary" : "default"}
            onClick={() => setSelectedLetter('')}
            size="small"
            sx={{ 
              m: 0.5,
              fontWeight: !selectedLetter ? 600 : 400
            }}
          />
          {uniqueFirstLetters.map(letter => (
            <Chip
              key={letter}
              label={letter}
              color={selectedLetter === letter ? "primary" : "default"}
              onClick={() => setSelectedLetter(letter === selectedLetter ? '' : letter)}
              size="small"
              sx={{ 
                m: 0.5,
                fontWeight: selectedLetter === letter ? 600 : 400
              }}
            />
          ))}
        </Box>
      </Box>
      
      {/* Status bar */}
      <Box 
        sx={{ 
          p: 1.5, 
          borderBottom: '1px solid', 
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)'
        }}
      >
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {filteredCodes.length} codes {selectedLetter ? `starting with ${selectedLetter}` : ''}
          {searchTerm ? ` matching "${searchTerm}"` : ''}
        </Typography>
      </Box>
      
      {/* List of codes */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={40} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : filteredCodes.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography>No codes found matching your filters.</Typography>
          </Box>
        ) : (
          <AutoSizer>
            {({ height, width }) => (
              <List
                height={height}
                width={width}
                itemCount={filteredCodes.length}
                itemSize={70} // Adjust based on your row height
              >
                {Row}
              </List>
            )}
          </AutoSizer>
        )}
      </Box>
    </Box>
  );
};

export default CodeIndex; 