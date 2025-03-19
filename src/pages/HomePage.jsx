import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Search from '../components/Search';
import { useTheme } from '../contexts/ThemeContext';
import { resetDatabase } from '../utils/apiService';

// SearchResult component to display enhanced search results
const SearchResult = ({ result, darkMode }) => {
  return (
    <Link 
      to={`/code/${result.code}`} 
      className={`${
        darkMode 
          ? 'bg-medical-darkSurface border-medical-darkBorder hover:border-medical-darkAccent hover:shadow-indigo-900/20'
          : 'bg-medical-lightSurface border-medical-lightBorder hover:border-medical-lightAccent'
      } p-4 rounded-lg hover:shadow-lg transition-all duration-300 border transform hover:-translate-y-1 flex flex-col h-full`}
    >
      <div className="flex justify-between items-center mb-2">
        <span className={`font-bold ${darkMode ? 'text-medical-darkPrimary' : 'text-medical-lightPrimary'} text-lg tracking-wide`}>{result.code}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${darkMode ? 'text-medical-darkMuted' : 'text-medical-lightMuted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <p className={`text-sm ${darkMode ? 'text-medical-darkText' : 'text-medical-lightText'} mb-2`}>{result.description}</p>
      
      {/* Display highlighted context if available */}
      {result.highlightedContext && (
        <div className={`mt-auto pt-2 border-t ${darkMode ? 'border-medical-darkBorder' : 'border-medical-lightBorder'}`}>
          <p className={`text-xs italic ${darkMode ? 'text-medical-darkMuted' : 'text-medical-lightMuted'}`}>
            {result.highlightedContext}
          </p>
        </div>
      )}
    </Link>
  );
};

function HomePage({ dataStatus, onToggleCreator }) {
  const [searchResults, setSearchResults] = useState([]);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const { darkMode } = useTheme();
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const toggleEasterEgg = () => {
    const newState = !showEasterEgg;
    setShowEasterEgg(newState);
    // Pass the state to parent component to update Footer
    if (onToggleCreator) {
      onToggleCreator(newState);
    }
  };

  const handleResetDatabase = async () => {
    if (window.confirm('Are you sure you want to reset the database? This will clear all current data and reload from the original file.')) {
      try {
        setIsResetting(true);
        setResetError(null);
        setResetSuccess(false);
        
        const result = await resetDatabase();
        
        if (result.success) {
          setResetSuccess(true);
          // Set a timer to refresh the page after reset is complete
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          setResetError(result.error || 'Unknown error occurred');
        }
      } catch (error) {
        setResetError(error.message || 'Failed to reset database');
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header with reset button */}
      <div className="flex justify-end items-center mb-4 p-4">
        <button
          onClick={handleResetDatabase}
          disabled={isResetting}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all
                    ${isResetting ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
                    ${darkMode 
                      ? 'bg-red-700/90 hover:bg-red-800 text-white' 
                      : 'bg-red-500/90 hover:bg-red-600 text-white'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{isResetting ? 'Resetting...' : 'Reset Database'}</span>
        </button>
      </div>

      {/* Main Content with scroll */}
      <div className="flex-grow overflow-auto px-4 pb-4">
        <div className="text-center mb-6">
          <h1 className={`text-3xl font-bold mb-3 ${darkMode ? 'text-medical-darkPrimary' : 'text-medical-lightPrimary'}`}>
            Code Browser
          </h1>
          <p className={`text-base ${darkMode ? 'text-medical-darkText' : 'text-medical-lightText'} max-w-lg mx-auto`}>
            Search and explore the International Classification of Diseases, 10th Revision, 
            Clinical Modification codes.
          </p>
          <p className={`text-xs mt-2 ${darkMode ? 'text-medical-darkMuted' : 'text-medical-lightMuted'}`}>
            Database contains {dataStatus.totalCodes?.toLocaleString()} ICD-10-CM codes
          </p>
        </div>

        {/* Search component with enhanced styling */}
        <div className="mb-6 mx-auto max-w-lg">
          <div className={`${darkMode ? 'bg-medical-darkSurface shadow-lg shadow-gray-900/30' : 'bg-medical-lightSurface shadow-lg shadow-gray-200/60'} 
                          p-1 rounded-xl border ${darkMode ? 'border-medical-darkBorder' : 'border-medical-lightBorder'}`}>
            <Search 
              onResultsChange={setSearchResults} 
              placeholderText="Search for an ICD-10-CM code or description..."
            />
          </div>
        </div>

        {/* Reset status messages */}
        {resetSuccess && (
          <div className={`${
            darkMode ? 'bg-green-900/20 border-green-800 text-green-300' : 'bg-green-50 border-green-500 text-green-700'
          } border-l-4 p-3 rounded shadow-md mb-6`} role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className={`h-5 w-5 ${darkMode ? 'text-green-400' : 'text-green-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                  Database reset successful! The page will refresh shortly...
                </p>
              </div>
            </div>
          </div>
        )}

        {resetError && (
          <div className={`${
            darkMode ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-500 text-red-700'
          } border-l-4 p-3 rounded shadow-md mb-6`} role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className={`h-5 w-5 ${darkMode ? 'text-red-400' : 'text-red-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                  {resetError}
                </p>
              </div>
            </div>
          </div>
        )}

        {showEasterEgg && (
          <div className="text-center mb-6 animate-fadeIn">
            <p className="text-pink-500 font-cursive text-lg animate-pulse" 
               style={{ 
                 fontFamily: 'cursive', 
                 background: 'linear-gradient(to right, #ff5e95, #ff9eb6)', 
                 WebkitBackgroundClip: 'text', 
                 WebkitTextFillColor: 'transparent',
                 textShadow: '0 0 5px rgba(255, 105, 180, 0.3)'
               }}>
              Created with love for the most beautiful girl in the world, Queen Pukai ❤️
            </p>
            <p className="mt-1 text-indigo-500 font-bold text-sm">
              CREATED BY MUSAFIR
            </p>
          </div>
        )}
        
        {searchResults.length > 0 && (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-baseline mb-3">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-medical-darkText' : 'text-medical-lightText'}`}>Search Results</h2>
              <div className="flex items-center">
                <span className={`text-xs ${darkMode ? 'text-medical-darkMuted' : 'text-medical-lightMuted'}`}>
                  Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </span>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-medical-darkPrimary/30 text-medical-darkText' : 'bg-medical-lightPrimary/20 text-medical-lightPrimary'}`}>
                  Top {Math.min(searchResults.length, 50)} shown
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {/* Display only top 50 results */}
              {searchResults.slice(0, 50).map((result) => (
                <SearchResult 
                  key={result.code} 
                  result={result} 
                  darkMode={darkMode} 
                />
              ))}
            </div>
          </div>
        )}
        
        {searchResults.length === 0 && (
          <div className={`${
            darkMode 
              ? 'bg-medical-darkSurface text-medical-darkText border-medical-darkBorder shadow-black/30'
              : 'bg-medical-lightSurface text-medical-lightText border-medical-lightBorder'
          } p-4 rounded-lg shadow-md border`}>
            <h2 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-medical-darkText' : 'text-medical-lightText'}`}>How to use this tool</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Search by ICD-10-CM code (e.g., "E11.9")</li>
              <li>Search by medical condition (e.g., "diabetes")</li>
              <li>Search by symptoms or keywords</li>
              <li>Click on any result to view detailed information</li>
              <li>Download information for offline reference</li>
              <li>Use the sidebar to browse codes by letter</li>
            </ul>
          </div>
        )}
      </div>
      
      {/* Easter egg button */}
      <button 
        onClick={toggleEasterEgg}
        className={`absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
          darkMode
            ? 'bg-medical-darkAccent hover:bg-medical-darkAccent/80 text-white shadow-lg shadow-indigo-900/50'
            : 'bg-medical-lightAccent hover:bg-medical-lightAccent/80 text-white shadow-md'
        }`}
        aria-label="Fun Surprise"
        title="Funsie Button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </div>
  );
}

export default HomePage; 