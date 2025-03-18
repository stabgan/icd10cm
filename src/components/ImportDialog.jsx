import React, { useState, useRef } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, LinearProgress, Box, Alert,
  Paper, List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import { verifyDatabaseSchema, processLargeJSONLFile } from './FileProcessor';

const ImportDialog = ({ open, onClose }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setStatus('loading');
      setMessage(`Selected file: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
      setProgress(0);
      setError(null);
      
      // Very large file warning
      if (file.size > 800 * 1024 * 1024) {
        setMessage(`Warning: ${file.name} is very large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Processing may take several minutes.`);
      }
      
      // Check file type
      if (!file.name.endsWith('.jsonl')) {
        throw new Error('Unsupported file format. Please upload a .jsonl file.');
      }
      
      // Ensure database schema is valid
      await verifyDatabaseSchema();
      
      // Process the file
      await processLargeJSONLFile(
        file, 
        (msg) => setMessage(msg),
        (prog) => setProgress(prog)
      );
      
      setStatus('success');
      setMessage('Import completed successfully!');
      setProgress(100);
    } catch (err) {
      console.error('Import error:', err);
      setStatus('error');
      setError(err.message);
      setMessage(`Error: ${err.message}`);
      setProgress(0);
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setMessage('');
    setProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={status !== 'loading' ? onClose : undefined}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 5
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        Import Medical Codes
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            Upload a JSONL file containing medical codes to import into the database.
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Each line in the file should be a valid JSON object with at least a 'code' and 'description' field.
            For best results, include 'detailed_context', 'chapter', 'section', and 'category' fields.
          </Typography>
          
          {status === 'idle' && (
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                borderStyle: 'dashed',
                borderWidth: 2,
                mt: 2,
                bgcolor: 'background.default',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              onClick={handleImportClick}
            >
              <CloudUploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Drop your file here or click to browse</Typography>
              <Typography variant="body2" color="text.secondary">
                Supports .jsonl files
              </Typography>
            </Paper>
          )}
          
          {status === 'loading' && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body1" gutterBottom>{message}</Typography>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ height: 10, borderRadius: 5, my: 1 }} 
              />
              <Typography variant="body2" color="text.secondary" align="right">
                {progress}%
              </Typography>
            </Box>
          )}
          
          {status === 'success' && (
            <Alert 
              severity="success" 
              icon={<CheckCircleIcon />} 
              sx={{ mt: 2, mb: 2 }}
            >
              {message}
            </Alert>
          )}
          
          {status === 'error' && (
            <Alert 
              severity="error" 
              icon={<ErrorIcon />} 
              sx={{ mt: 2, mb: 2 }}
            >
              {message}
            </Alert>
          )}
          
          {(status === 'success' || status === 'error') && (
            <Button
              variant="outlined"
              startIcon={<FileUploadIcon />}
              onClick={handleReset}
              sx={{ mt: 2 }}
            >
              Import Another File
            </Button>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Tips for successful imports:
          </Typography>
        </Box>
        
        <List dense>
          <ListItem>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CheckCircleIcon color="success" fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Make sure your JSONL file has one JSON object per line" 
              secondary="Each line should be parseable as JSON independently"
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CheckCircleIcon color="success" fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="For large files (>500MB), the import may take several minutes" 
              secondary="Don't close the browser during import"
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <WarningIcon color="warning" fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Browser storage is limited" 
              secondary="Files over 1GB may encounter storage limitations depending on your browser and device"
            />
          </ListItem>
        </List>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <input
          type="file"
          accept=".jsonl"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        {status === 'idle' && (
          <Button
            variant="contained"
            startIcon={<FileUploadIcon />}
            onClick={handleImportClick}
            color="primary"
          >
            Select File
          </Button>
        )}
        
        <Button 
          onClick={onClose} 
          color="inherit" 
          disabled={status === 'loading'}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportDialog; 