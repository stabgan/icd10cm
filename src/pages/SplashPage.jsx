import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  Container, 
  CircularProgress, 
  LinearProgress,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileProcessor from '../components/FileProcessor';

const SplashPage = ({ onDataLoaded }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const theme = useTheme();

  const handleFileChange = (selectedFile) => {
    setFile(selectedFile);
  };

  const handleProcessingProgress = (progress) => {
    setUploadProgress(progress);
  };

  const handleProcessingStart = () => {
    setIsUploading(true);
  };

  const handleProcessingComplete = () => {
    setIsUploading(false);
    setUploadProgress(100);
    if (onDataLoaded) {
      onDataLoaded();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        mb: 8
      }}>
        <Typography 
          variant="h1" 
          component="h1" 
          gutterBottom
          fontWeight={800}
          sx={{ 
            fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(90deg, #90caf9 0%, #4dabf5 100%)' 
              : 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
            mb: 3
          }}
        >
          ICD-10-CM Explorer
        </Typography>
        
        <Typography 
          variant="h6" 
          component="h2" 
          color="text.secondary"
          textAlign="center"
          sx={{ 
            maxWidth: '700px', 
            mb: 6,
            px: 2,
            fontWeight: 400
          }}
        >
          Your comprehensive tool for browsing, searching, and understanding 
          ICD-10-CM codes with intelligent features
        </Typography>
        
        <Card 
          elevation={6} 
          sx={{ 
            width: '100%', 
            maxWidth: '700px',
            borderRadius: '16px',
            overflow: 'hidden',
            position: 'relative',
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(145deg, #1e1e2e 0%, #11111d 100%)' 
              : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
            <Typography 
              variant="h4" 
              component="h3" 
              gutterBottom 
              fontWeight={700} 
              textAlign="center"
              sx={{ mb: 3 }}
            >
              Get Started
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 5 }} textAlign="center">
              Upload your ICD-10-CM codes file to begin exploring the comprehensive database
            </Typography>
            
            {isUploading ? (
              <Box sx={{ width: '100%', mt: 5, mb: 3 }}>
                <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                  Processing data... {Math.round(uploadProgress)}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={uploadProgress} 
                  sx={{ 
                    height: 12, 
                    borderRadius: 6,
                    mb: 3,
                    '& .MuiLinearProgress-bar': {
                      transition: 'transform 0.3s ease'
                    }
                  }} 
                />
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ display: 'block' }}>
                  This may take a few minutes for large files. Please don't close the browser.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <FileProcessor 
                  onFileSelected={handleFileChange}
                  onProcessingStart={handleProcessingStart}
                  onProcessingProgress={handleProcessingProgress}
                  onProcessingComplete={handleProcessingComplete}
                  showUiElements={false}
                />
                <Button
                  variant="contained"
                  component="label"
                  size="large"
                  startIcon={<CloudUploadIcon />}
                  sx={{ 
                    mt: 2,
                    py: 2,
                    px: 5,
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    boxShadow: 3
                  }}
                  onClick={() => document.getElementById('file-input').click()}
                >
                  Upload ICD-10 Data File
                </Button>
                <Typography variant="caption" sx={{ display: 'block', mt: 3, color: 'text.secondary' }}>
                  Accepts JSONL format files containing ICD-10-CM codes
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
        
        <Box sx={{ mt: 8, maxWidth: '700px', width: '100%', px: 2 }}>
          <Typography variant="h5" component="h3" gutterBottom fontWeight={600}>
            About This Tool
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            This application allows you to browse through the comprehensive database of ICD-10-CM 
            (International Classification of Diseases, 10th Revision, Clinical Modification) codes.
            With powerful search capabilities and an alphabetical sidebar, you can quickly find
            the codes you need.
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            All data is processed locally in your browser, ensuring your privacy and security.
            No data is sent to external servers, making this tool ideal for healthcare professionals
            who need quick and confidential access to ICD-10 codes.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default SplashPage; 