import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { processICD10Data } from '../utils/dataProcessor';

function SplashScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.jsonl') && !file.name.endsWith('.json')) {
      setError('Please upload a JSONL or JSON file');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setProgress(0);
      
      // Process the file
      await processICD10Data(file, (progressValue) => {
        setProgress(progressValue);
      });
      
      // Once processing is complete, redirect to home page
      setTimeout(() => {
        // Use window.location.reload() to ensure a complete refresh
        // This is more reliable than navigate('/') in this context
        window.location.reload();
      }, 1000);
      
    } catch (err) {
      console.error('Error processing file:', err);
      setError(`Error processing file: ${err.message}`);
      setIsProcessing(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current.click();
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-md w-full p-8 rounded-lg shadow-lg text-center mb-8 
                    transition-all transform hover:scale-105
                    border-2 border-blue-500
                    bg-opacity-20 backdrop-blur-sm
                    bg-gradient-to-br from-blue-100 to-blue-50
                    dark:from-blue-900 dark:to-gray-800">
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
          ICD-10-CM Browser
        </h1>
        <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
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
          <button
            onClick={triggerFileUpload}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all 
                      ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}
                      flex items-center justify-center shadow-md hover:shadow-lg`}
            disabled={isProcessing}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Data File
          </button>
        ) : (
          <div className="w-full">
            <div className="mb-2 text-sm font-medium text-center">
              Processing data... {Math.round(progress)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {error && (
          <div className={`mt-4 p-3 rounded-lg ${darkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-600'}`}>
            {error}
          </div>
        )}
      </div>
      
      <div className={`max-w-md w-full text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <h2 className="font-semibold mb-2">Instructions:</h2>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Obtain the ICD-10-CM data file from your administrator</li>
          <li>Click the "Upload Data File" button above to select your file</li>
          <li>Wait for the data to be processed (this may take a few minutes)</li>
          <li>Once complete, you'll be redirected to the ICD-10 browser automatically</li>
        </ol>
        <div className="mt-4 p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
          <p><strong>Note:</strong> Data is stored locally in your browser and never uploaded to any server.</p>
        </div>
      </div>
    </div>
  );
}

export default SplashScreen; 