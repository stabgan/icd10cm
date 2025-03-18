import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { List, ListItem, ListItemIcon, ListItemText, ListItemButton, Divider, Box, Typography, TextField, IconButton, Tooltip, Collapse, CircularProgress } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import StorageIcon from '@mui/icons-material/Storage';
import HelpIcon from '@mui/icons-material/Help';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FilterListIcon from '@mui/icons-material/FilterList';
import TocIcon from '@mui/icons-material/Toc';

const SidebarContent = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [recentCodes, setRecentCodes] = useState([]);
  const [expandedSection, setExpandedSection] = useState(null);
  const [codeIndex, setCodeIndex] = useState({});
  const [loadingIndex, setLoadingIndex] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [letterCodes, setLetterCodes] = useState([]);
  const [loadingLetterCodes, setLoadingLetterCodes] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load recent codes from localStorage
    const loadRecentCodes = () => {
      try {
        const saved = localStorage.getItem('recentCodes');
        if (saved) {
          setRecentCodes(JSON.parse(saved).slice(0, 5));
        }
      } catch (error) {
        console.error("Error loading recent codes:", error);
      }
    };
    
    loadRecentCodes();
    
    // Listen for storage events from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'recentCodes') {
        loadRecentCodes();
      }
    });
    
    // Custom event for when a code is viewed
    window.addEventListener('codeViewed', loadRecentCodes);
    
    return () => {
      window.removeEventListener('storage', loadRecentCodes);
      window.removeEventListener('codeViewed', loadRecentCodes);
    };
  }, []);

  // Fetch code index data
  useEffect(() => {
    const fetchCodeIndex = async () => {
      try {
        setLoadingIndex(true);
        const response = await fetch('/api/check-data');
        const data = await response.json();
        
        if (data.dataLoaded && data.chunkMap) {
          setCodeIndex(data.chunkMap);
        } else {
          // Fetch the index from a separate endpoint
          const indexResponse = await fetch('/api/code-index');
          const indexData = await indexResponse.json();
          if (indexData.chunkMap) {
            setCodeIndex(indexData.chunkMap);
          }
        }
      } catch (error) {
        console.error("Error loading code index:", error);
      } finally {
        setLoadingIndex(false);
      }
    };
    
    fetchCodeIndex();
  }, []);

  // Load codes for selected letter
  useEffect(() => {
    if (!selectedLetter) {
      setLetterCodes([]);
      return;
    }
    
    const fetchLetterCodes = async () => {
      try {
        setLoadingLetterCodes(true);
        const response = await fetch(`/api/codes/${selectedLetter}`);
        const data = await response.json();
        
        if (data.codes) {
          setLetterCodes(data.codes);
        }
      } catch (error) {
        console.error(`Error loading codes for letter ${selectedLetter}:`, error);
      } finally {
        setLoadingLetterCodes(false);
      }
    };
    
    fetchLetterCodes();
  }, [selectedLetter]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search/${searchTerm.trim()}`);
      if (onNavigate) onNavigate();
    }
  };

  const handleResetRecent = () => {
    localStorage.removeItem('recentCodes');
    setRecentCodes([]);
  };

  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  const handleLetterSelect = (letter) => {
    setSelectedLetter(letter);
    toggleSection('codes'); // Ensure the codes section is expanded
  };

  return (
    <Box sx={{ overflow: 'auto', p: 2 }}>
      <form onSubmit={handleSearch}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Search codes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            endAdornment: (
              <IconButton 
                type="submit" 
                edge="end"
                sx={{ mr: -1 }}
              >
                <SearchIcon />
              </IconButton>
            )
          }}
          sx={{ mb: 2 }}
        />
      </form>
      
      <List>
        <ListItem disablePadding>
          <ListItemButton 
            component={Link} 
            to="/"
            onClick={onNavigate}
          >
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>
        </ListItem>
        
        <Divider sx={{ my: 2 }} />
        
        {/* ICD Code Index */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => toggleSection('codes')}>
            <ListItemIcon>
              <TocIcon />
            </ListItemIcon>
            <ListItemText primary="ICD Code Index" />
            {expandedSection === 'codes' ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={expandedSection === 'codes'} timeout="auto" unmountOnExit>
          <Box sx={{ pl: 2, pt: 1 }}>
            {/* Alphabet selector */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 2 }}>
              {loadingIndex ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                Object.keys(codeIndex).sort().map((letter) => (
                  <Tooltip key={letter} title={`${letter} codes`}>
                    <Box
                      component="button"
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '4px',
                        m: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: selectedLetter === letter ? 'primary.main' : 'background.paper',
                        color: selectedLetter === letter ? 'white' : 'text.primary',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          color: selectedLetter === letter ? 'white' : 'primary.main',
                        },
                        fontWeight: 'medium',
                      }}
                      onClick={() => handleLetterSelect(letter)}
                    >
                      {letter}
                    </Box>
                  </Tooltip>
                ))
              )}
            </Box>
            
            {/* Code list for selected letter */}
            {selectedLetter && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {selectedLetter} Codes {letterCodes.length > 0 && `(${letterCodes.length})`}
                </Typography>
                
                {loadingLetterCodes ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <List dense component="div" disablePadding>
                    {letterCodes.slice(0, 50).map((code) => (
                      <ListItem key={code.code} disablePadding sx={{ display: 'block' }}>
                        <ListItemButton
                          component={Link}
                          to={`/code/${code.code}`}
                          onClick={onNavigate}
                          sx={{ py: 0.5, minHeight: 'auto' }}
                        >
                          <ListItemText
                            primary={code.code}
                            secondary={code.description && code.description.substring(0, 30) + (code.description.length > 30 ? '...' : '')}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                    
                    {letterCodes.length > 50 && (
                      <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                        Showing 50 of {letterCodes.length} codes.
                        <Link 
                          to={`/browse/${selectedLetter}`} 
                          onClick={onNavigate}
                          style={{ display: 'block', marginTop: 4 }}
                        >
                          View all {selectedLetter} codes
                        </Link>
                      </Typography>
                    )}
                  </List>
                )}
              </Box>
            )}
          </Box>
        </Collapse>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography 
          variant="subtitle2" 
          sx={{ 
            px: 2, 
            mb: 1, 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          Recent Codes
          {recentCodes.length > 0 && (
            <Tooltip title="Clear recent codes">
              <IconButton 
                size="small" 
                onClick={handleResetRecent}
              >
                <ClearAllIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Typography>
        
        {recentCodes.length > 0 ? (
          recentCodes.map((code, index) => (
            <ListItem key={index} disablePadding>
              <ListItemButton 
                component={Link}
                to={`/code/${code.code}`}
                onClick={onNavigate}
                sx={{ py: 0.5 }}
              >
                <ListItemText 
                  primary={code.code} 
                  secondary={code.title && code.title.substring(0, 30) + (code.title.length > 30 ? '...' : '')}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItemButton>
            </ListItem>
          ))
        ) : (
          <Typography 
            variant="caption" 
            sx={{ display: 'block', px: 2, color: 'text.secondary' }}
          >
            No recent codes
          </Typography>
        )}
      </List>
    </Box>
  );
};

export default SidebarContent; 