import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Button, 
  CircularProgress, 
  Divider, 
  Alert,
  Tooltip,
  IconButton,
  Fade,
  useTheme,
  Container,
  Snackbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GetAppIcon from '@mui/icons-material/GetApp';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { generatePDF, formatPdfTitle } from '../utils/pdfUtils';
import ErrorIcon from '@mui/icons-material/Error';

const CodeDetailsPage = () => {
  const { codeId } = useParams();
  const [codeData, setCodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const contentRef = useRef(null);
  const theme = useTheme();
  const [timeoutOccurred, setTimeoutOccurred] = useState(false);
  const timeoutRef = useRef(null);
  const navigate = useNavigate();
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // Format the detailed context as markdown if it's not already
  const getFormattedContext = () => {
    if (!codeData) return '';
    
    const contextText = codeData.loadedDetailedContext || codeData.detailed_context || '';
    
    if (!contextText) return '';
    
    // Check if the content is already in markdown format
    const hasMarkdownSyntax = /[#*_`~]/.test(contextText);
    
    if (hasMarkdownSyntax) {
      return contextText;
    }
    
    // Convert plain text with line breaks to markdown format
    return contextText
      .split('\n')
      .map(line => {
        // Convert section headers (detected by patterns like "- **Title:**")
        if (line.match(/^- \*\*[\w\s]+:\*\*/)) {
          return `### ${line.replace(/^- \*\*([\w\s]+):\*\*/, '$1')}\n`;
        }
        // Format bullet points
        if (line.startsWith('* ')) {
          return line;
        }
        // Format numbered lists
        if (line.match(/^\d+\. /)) {
          return line;
        }
        return line;
      })
      .join('\n\n');
  };

  // Handle PDF generation
  const handleDownloadPDF = async () => {
    if (!contentRef.current || !codeData) return;
    
    try {
      setPdfGenerating(true);
      
      const fileName = `icd10_${codeData.code.replace(/\./g, '_')}.pdf`;
      const title = formatPdfTitle(codeData.code, codeData.description);
      
      await generatePDF(contentRef.current, fileName, {
        title,
        headerText: `ICD-10-CM Code: ${codeData.code}`,
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setPdfGenerating(false);
    }
  };

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setLoading(true);
    setError(null);
    setTimeoutOccurred(false);
    
    // Set a timeout to prevent infinite loading
    timeoutRef.current = setTimeout(() => {
      console.warn(`Data loading timed out for code ${codeId}`);
      setTimeoutOccurred(true);
      setLoading(false);
      setError("Loading timed out. The data may not be available or the database may need to be reset. Please try importing the file again.");
    }, 10000); // 10 second timeout

    searchInIndex(codeId);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [codeId]);

  const searchInIndex = async (code) => {
    try {
      if (!code) {
        throw new Error("No code specified");
      }

      console.log(`Searching for code: ${code}`);
      const dbRequest = window.indexedDB.open('medicodes', 2);

      dbRequest.onerror = (event) => {
        clearTimeout(timeoutRef.current);
        console.error("Error opening database:", event.target.error);
        setError("Database error: " + event.target.error.message);
        setLoading(false);
      };

      dbRequest.onsuccess = (event) => {
        const db = event.target.result;
        console.log("Database opened successfully");
        console.log("Available object stores:", Array.from(db.objectStoreNames));
        
        try {
          // First check if the searchIndex store exists
          if (!db.objectStoreNames.contains('searchIndex')) {
            clearTimeout(timeoutRef.current);
            console.error("searchIndex store not found");
            setError("Database not initialized. Please import a file first.");
            setLoading(false);
            db.close();
            return;
          }
          
          const transaction = db.transaction(['searchIndex'], 'readonly');
          const store = transaction.objectStore('searchIndex');
          
          const request = store.get(code);
          
          request.onsuccess = (event) => {
            const result = event.target.result;
            
            if (result) {
              console.log(`Found code ${code} in searchIndex:`, result);
              setCodeData(result);
              
              // Add this to store visited codes in localStorage for the sidebar history
              try {
                const recentCodes = JSON.parse(localStorage.getItem('recentCodes') || '[]');
                const newRecentCodes = [
                  { code: result.code, title: result.description },
                  ...recentCodes.filter(item => item.code !== result.code)
                ].slice(0, 10); // Keep only the 10 most recent codes
                
                localStorage.setItem('recentCodes', JSON.stringify(newRecentCodes));
                
                // Dispatch event to update the sidebar
                window.dispatchEvent(new Event('codeViewed'));
              } catch (err) {
                console.error("Error updating recent codes:", err);
              }
              
              // If this code has details in a separate store, load them
              if (result.has_details && db.objectStoreNames.contains('details')) {
                console.log(`Code ${code} has details stored separately`);
                
                try {
                  const detailsTransaction = db.transaction(['details'], 'readonly');
                  const detailsStore = detailsTransaction.objectStore('details');
                  const detailsRequest = detailsStore.get(code);
                  
                  detailsRequest.onsuccess = (e) => {
                    clearTimeout(timeoutRef.current);
                    const detailsResult = e.target.result;
                    
                    if (detailsResult) {
                      console.log(`Loaded details for ${code}`);
                      // Merge the details with the main code data
                      setCodeData(prevData => ({
                        ...prevData,
                        detailed_context: detailsResult.detailed_context
                      }));
                    } else {
                      console.warn(`No details found for ${code} in details store`);
                      // Remove the has_details flag since we couldn't find the details
                      setCodeData(prevData => ({
                        ...prevData,
                        has_details: false
                      }));
                    }
                    
                    setLoading(false);
                  };
                  
                  detailsRequest.onerror = (e) => {
                    clearTimeout(timeoutRef.current);
                    console.error("Error loading details:", e.target.error);
                    // Remove the has_details flag since we couldn't load the details
                    setCodeData(prevData => ({
                      ...prevData,
                      has_details: false
                    }));
                    setLoading(false);
                  };
                } catch (err) {
                  clearTimeout(timeoutRef.current);
                  console.error("Error in details transaction:", err);
                  // Remove the has_details flag
                  setCodeData(prevData => ({
                    ...prevData,
                    has_details: false
                  }));
                  setLoading(false);
                }
              } else {
                clearTimeout(timeoutRef.current);
                if (result.has_details) {
                  console.warn("Code has details flag but details store not found");
                  // Remove the has_details flag
                  setCodeData(prevData => ({
                    ...prevData,
                    has_details: false
                  }));
                }
                setLoading(false);
              }
            } else {
              clearTimeout(timeoutRef.current);
              console.warn(`Code ${code} not found in searchIndex`);
              setError(`Code "${code}" not found in the database. Please check the code or import the data again.`);
              setLoading(false);
              
              // You could add a redirect here after a delay
              setTimeout(() => {
                if (navigate) {
                  navigate('/');
                }
              }, 5000);
            }
          };
          
          request.onerror = (event) => {
            clearTimeout(timeoutRef.current);
            console.error("Error searching for code:", event.target.error);
            setError("Error searching: " + event.target.error.message);
            setLoading(false);
          };
          
          transaction.oncomplete = () => {
            db.close();
          };
          
          transaction.onerror = (event) => {
            clearTimeout(timeoutRef.current);
            console.error("Transaction error:", event.target.error);
            setError("Database transaction error: " + event.target.error.message);
            setLoading(false);
            db.close();
          };
        } catch (err) {
          clearTimeout(timeoutRef.current);
          console.error("Error in database transaction:", err);
          setError("Database error: " + err.message);
          setLoading(false);
          db.close();
        }
      };
    } catch (err) {
      clearTimeout(timeoutRef.current);
      console.error("Error searching for code:", err);
      setError("Error: " + err.message);
      setLoading(false);
    }
  };

  // Add the handleShareClick function
  const handleShareClick = () => {
    if (navigator.share) {
      navigator.share({
        title: `Medical Code ${codeData.code}`,
        text: `${codeData.code} - ${codeData.description}`,
        url: window.location.href
      }).catch(err => {
        console.error('Error sharing:', err);
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          setNotification({
            open: true,
            message: 'Link copied to clipboard!',
            severity: 'success'
          });
        })
        .catch(err => {
          console.error('Failed to copy link:', err);
        });
    }
  };

  // Add close notification handler
  const handleNotificationClose = () => {
    setNotification({ ...notification, open: false });
  };

  // Modify the content display part
  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 6 }}>
      <Button
        component={Link}
        to="/"
        startIcon={<ArrowBackIcon />}
        variant="outlined"
        sx={{ mb: 3 }}
      >
        Back to Home
      </Button>
      
      {loading ? (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 4, 
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px'
          }}
        >
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 3, fontWeight: 500 }}>
            Loading Code Details
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', textAlign: 'center' }}>
            Please wait while we retrieve the information for code {codeId}
          </Typography>
          {timeoutOccurred && (
            <Alert severity="warning" sx={{ mt: 3, width: '100%', maxWidth: '500px' }}>
              Loading is taking longer than expected. You may need to reload or try a different code.
            </Alert>
          )}
        </Paper>
      ) : error ? (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 4, 
            borderRadius: 2,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,0,0,0.1)' : 'rgba(255,0,0,0.05)'
          }}
        >
          <ErrorIcon color="error" sx={{ fontSize: 60 }} />
          <Typography variant="h5" color="error">
            {error}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Redirecting to home page in 5 seconds...
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              component={Link}
              to="/"
              sx={{ mr: 2 }}
            >
              Return to Home
            </Button>
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </Box>
        </Paper>
      ) : codeData ? (
        <Fade in={!loading} timeout={500}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: { xs: 3, sm: 4 }, 
              borderRadius: '12px',
              boxShadow: theme => theme.palette.mode === 'dark' 
                ? '0 8px 32px rgba(0,0,0,0.4)' 
                : '0 8px 32px rgba(0,0,0,0.1)',
            }}
            ref={contentRef}
          >
            {/* Header section */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              flexWrap: { xs: 'wrap', sm: 'nowrap' }, 
              gap: 2,
              mb: 3
            }}>
              <Box>
                <Chip 
                  label={codeData.code} 
                  color="primary" 
                  size="large"
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: '1.1rem', 
                    height: 38, 
                    mb: 1.5,
                    boxShadow: theme => theme.palette.mode === 'dark' 
                      ? '0 2px 8px rgba(0,0,0,0.4)' 
                      : '0 2px 8px rgba(25,118,210,0.2)'
                  }} 
                />
                <Typography 
                  variant="h4" 
                  component="h1" 
                  fontWeight={600}
                  sx={{ mb: 1, lineHeight: 1.3 }}
                >
                  {codeData.description}
                </Typography>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                flexShrink: 0,
                mt: { xs: 0, sm: 1 }
              }}>
                <Tooltip title="Download PDF">
                  <IconButton 
                    onClick={handleDownloadPDF} 
                    color="primary"
                    disabled={pdfGenerating}
                    sx={{ 
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 1,
                      '&:hover': {
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    {pdfGenerating ? <CircularProgress size={24} /> : <GetAppIcon />}
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Print">
                  <IconButton 
                    onClick={handlePrintClick} 
                    color="primary"
                    sx={{ 
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 1,
                      '&:hover': {
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <PrintIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Share">
                  <IconButton 
                    onClick={handleShareClick} 
                    color="primary"
                    sx={{ 
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 1,
                      '&:hover': {
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <ShareIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            {/* Add a divider */}
            <Divider sx={{ mb: 4 }} />
            
            {/* Detailed context */}
            {(codeData.detailed_context || detailedContext) && (
              <Box sx={{ mt: 2 }}>
                <Typography 
                  variant="h6" 
                  fontWeight={600}
                  color="primary"
                  sx={{ mb: 2 }}
                >
                  Detailed Information
                </Typography>
                
                <Box sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  bgcolor: theme => theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.05)' 
                    : 'rgba(0,0,0,0.02)',
                  border: '1px solid',
                  borderColor: theme => theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease'
                }}>
                  {(codeData.detailed_context || detailedContext) ? (
                    <MarkdownRenderer content={getFormattedContext()} />
                  ) : loadingDetails ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <CircularProgress size={40} />
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        Loading detailed information...
                      </Typography>
                    </Box>
                  ) : (
                    <Typography color="text.secondary">
                      No detailed information available for this code.
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
            
            {/* Disclaimer */}
            <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">
                Note: This information is provided for reference purposes only. Always consult official coding guidelines and documentation.
              </Typography>
            </Box>
          </Paper>
        </Fade>
      ) : null}
      
      {/* Add Snackbar notification */}
      <Snackbar 
        open={notification.open}
        autoHideDuration={4000} 
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleNotificationClose} 
          severity={notification.severity} 
          variant="filled"
          sx={{ 
            width: '100%',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CodeDetailsPage; 