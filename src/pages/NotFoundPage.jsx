import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const NotFoundPage = () => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 10
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
      
      <Typography variant="h4" component="h1" gutterBottom>
        Page Not Found
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
        The page you're looking for doesn't exist or has been moved.
      </Typography>
      
      <Button 
        component={Link} 
        to="/" 
        variant="contained" 
        color="primary"
      >
        Return to Home
      </Button>
    </Box>
  );
};

export default NotFoundPage; 