import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { List, ListItem, ListItemIcon, ListItemText, ListItemButton, Divider, Box, Typography, TextField, IconButton, Tooltip } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import StorageIcon from '@mui/icons-material/Storage';
import HelpIcon from '@mui/icons-material/Help';
import ClearAllIcon from '@mui/icons-material/ClearAll';

const SidebarContent = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [recentCodes, setRecentCodes] = useState([]);
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