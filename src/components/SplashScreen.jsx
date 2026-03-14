import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

// Backend API URL
const BASE_API_URL = 'http://localhost:5000/api';

function SplashScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isElectron, setIsElectron] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  // Check if running in Electron
  useEffect(() => {
    // Check if Electron API is available
    setIsElectron(typeof window !== 'undefined' && window.electronAPI !== undefined);
    
    // Check if data is already loaded
    checkDataLoaded();
  }, []);
  
  // Check if data is already loaded on the server
  const checkDataLoaded = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/check-data`, {
        headers: { 'Accept': 'application/json' },
        // Add cache control to avoid caching issues
        cache: 'no-cache'
      });
      const data = await response.json();
      
      if (data.loaded) {
        console.log("Data already loaded, redirecting to home page");
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      } else if (data.error === 'MongoDB not connected') {
        setError('MongoDB is not running. Please ensure MongoDB is installed and running before uploading data.');
      }
    } catch (error) {
      console.error('Error checking data loaded:', error);
      setError('Cannot connect to the server. Please ensure the server is running.');
    }
  };

  const processFile = async (file) => {
    if (!file) return;
    
    if (!file.name.endsWith('.jsonl') && !file.name.endsWith('.json')) {
      setError('Please upload a JSONL or JSON file');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setProgress(0);
      setStatusMessage('Preparing to upload...');
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Send file to the server
      setStatusMessage('Uploading file to server...');
      const uploadResponse = await fetch(`${BASE_API_URL}/process-file`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Error uploading file');
      }
      
      setStatusMessage('Beginning data processing...');
      
      // Setup EventSource to monitor processing progress
      const eventSource = new EventSource(`${BASE_API_URL}/processing-status`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        setProgress(data.progress);
        
        // Use friendly status message if available
        if (data.friendlyStatus) {
          setStatusMessage(data.friendlyStatus);
        } else if (data.message) {
          setStatusMessage(data.message);
        }
        
        if (!data.inProgress) {
          eventSource.close();
          
          if (data.error) {
            setError(data.error);
            setIsProcessing(false);
          } else {
            // Successful processing
            setStatusMessage('Processing complete! Click below to continue.');
            setProgress(100);
            // Add a slight delay before changing processing state to show the complete state
            setTimeout(() => {
              setIsProcessing(false);
            }, 500);
          }
        }
      };
      
      eventSource.onerror = () => {
        eventSource.close();
        setError('Connection to server lost. Please check if the server is running.');
        setIsProcessing(false);
      };
      
    } catch (error) {
      console.error('Error processing file:', error);
      setError(error.message);
      setIsProcessing(false);
    }
  };
  
  const handleFileSelect = (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      processFile(file);
    }
  };
  
  const triggerFileUpload = () => {
    fileInputRef.current.click();
  };

  // Handle file selection from Electron (if applicable)
  useEffect(() => {
    if (isElectron && window.electronAPI) {
      window.electronAPI.onFileSelected((file) => {
        if (file && file.path) {
          processFile(file);
        }
      });
    }
  }, [isElectron]);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${darkMode ? 'bg-gradient-to-br from-gray-900 to-indigo-950' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <div className="max-w-md w-full p-8 rounded-xl shadow-xl text-center mb-8 
                      transition-all duration-300 transform hover:shadow-2xl
                      border border-opacity-30 
                      bg-opacity-95 backdrop-filter backdrop-blur-sm
                      bg-white dark:bg-gray-800">
        
        {/* Medical icon SVG */}
        <div className="flex justify-center mb-4">
          <svg className="w-16 h-16 text-blue-500 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
            <path d="M10 6h4" />
            <path d="M12 18v-8" />
            <path d="M8 14h8" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
          ICD-10-CM Browser
        </h1>
        <p className={`mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Upload your ICD-10-CM data file to start browsing medical codes.
        </p>
        
        <input 
          type="file" 
          accept=".jsonl,.json" 
          onChange={handleFileSelect} 
          className="hidden" 
          ref={fileInputRef}
          disabled={isProcessing}
        />
        
        {!isProcessing ? (
          progress === 100 ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                console.log('Continue button clicked, redirecting to homepage');
                // Use direct navigation instead of React Router
                window.location.href = '/';
              }}
              className={`w-full py-4 px-6 rounded-lg font-medium transition-all 
                        ${darkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}
                        flex items-center justify-center shadow-lg hover:shadow-xl
                        focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Continue to ICD-10-CM Browser
            </button>
          ) : (
            <button
              onClick={triggerFileUpload}
              className={`w-full py-4 px-6 rounded-lg font-medium transition-all 
                        ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}
                        flex items-center justify-center shadow-lg hover:shadow-xl
                        focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800`}
              disabled={isProcessing}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {isElectron ? "Select Data File" : "Upload Data File"}
            </button>
          )
        ) : (
          <div className="w-full p-6 rounded-lg bg-white dark:bg-gray-700 shadow-md">
            <div className="mb-3 text-md font-medium text-center">
              {statusMessage || 'Processing data...'}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-600 mb-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-300 ease-in-out relative"
                style={{ width: `${progress}%` }}
              >
                {progress > 25 && progress < 100 && (
                  <div className="absolute inset-0 bg-white opacity-20" 
                       style={{
                         backgroundImage: 'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.4) 50%, transparent 75%)',
                         backgroundSize: '150% 100%',
                         animation: 'shimmer 1.5s infinite linear'
                       }}></div>
                )}
              </div>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <div className="text-gray-500 dark:text-gray-300">
                {Math.round(progress)}% complete
              </div>
              <div className="text-gray-500 dark:text-gray-300">
                {progress === 100 ? 'Done!' : 'Processing...'}
              </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes shimmer {
                0% { background-position: -50% 0; }
                100% { background-position: 150% 0; }
              }
            ` }} />
          </div>
        )}
        
        {error && (
          <div className={`mt-6 p-4 rounded-lg border ${darkMode ? 'bg-red-900/30 text-red-200 border-red-800' : 'bg-red-50 text-red-700 border-red-200'}`}>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className={`max-w-md w-full p-6 rounded-xl bg-white bg-opacity-90 dark:bg-gray-800 dark:bg-opacity-90 shadow-md ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        <h2 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200">Instructions:</h2>
        <ol className="list-decimal pl-6 space-y-2 mb-4">
          <li>Obtain the ICD-10-CM data file from your administrator</li>
          <li>Click the {isElectron ? '"Select Data File"' : '"Upload Data File"'} button above to select your file</li>
          <li>Wait for the data to be processed (this may take a few minutes)</li>
          <li>Once complete, you'll be redirected to the ICD-10 browser automatically</li>
        </ol>
        <div className="mt-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span><strong>Note:</strong> {isElectron ? 'Data is processed on the local server and stored in MongoDB.' : 'Data is uploaded to your local server and stored in MongoDB.'}</span>
          </div>
        </div>

        {isElectron && (
          <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              <span><strong>Desktop App:</strong> You're using the desktop version of ICD-10-CM Browser.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SplashScreen; 