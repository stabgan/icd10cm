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
          ? 'bg-dark-surface border-gray-800 hover:border-blue-700 hover:shadow-blue-900/20'
          : 'bg-white border-gray-200 hover:border-blue-300'
      } p-4 rounded-lg hover:shadow-lg transition-all duration-300 border transform hover:-translate-y-1 flex flex-col h-full`}
    >
      <div className="flex justify-between items-center mb-2">
        <span className={`font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'} text-lg tracking-wide`}>{result.code}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-700'} mb-2`}>{result.description}</p>
      
      {/* Display highlighted context if available */}
      {result.highlightedContext && (
        <div className={`mt-auto pt-2 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <p className={`text-xs italic ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
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
    <div className="max-w-6xl mx-auto relative min-h-screen pb-20">
      {/* Reset Database Button - Added at the top */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleResetDatabase}
          disabled={isResetting}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${isResetting ? 'opacity-50 cursor-not-allowed' : ''}
                    ${darkMode 
                      ? 'bg-red-700 hover:bg-red-800 text-white' 
                      : 'bg-red-500 hover:bg-red-600 text-white'}`}
        >
          {isResetting ? 'Resetting...' : 'Reset Database'}
        </button>
      </div>

      {/* Reset feedback messages */}
      {resetError && (
        <div className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-600'}`}>
          Error: {resetError}
        </div>
      )}
      
      {resetSuccess && (
        <div className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-green-900/30 text-green-200' : 'bg-green-100 text-green-600'}`}>
          Database reset initiated. The page will refresh automatically in a few seconds.
        </div>
      )}

      {showEasterEgg && (
        <div className="text-center mb-4 animate-fadeIn">
          <p className="text-pink-500 font-cursive text-xl animate-pulse" 
             style={{ 
               fontFamily: 'cursive', 
               background: 'linear-gradient(to right, #ff5e95, #ff9eb6)', 
               WebkitBackgroundClip: 'text', 
               WebkitTextFillColor: 'transparent',
               textShadow: '0 0 5px rgba(255, 105, 180, 0.3)'
             }}>
            Created with love for the most beautiful girl in the world, Queen Pukai ❤️
          </p>
          <p className="mt-2 text-indigo-500 font-bold">
            CREATED BY MUSAFIR
          </p>
          <p className="mt-1 text-indigo-400 italic">
            🦁 Lord of the Night & King of All Animals
          </p>
        </div>
      )}
      
      <div className="text-center mb-12">
        <h1 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>
          ICD-10-CM Code Browser
        </h1>
        <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}>
          Search and explore the International Classification of Diseases, 
          10th Revision, Clinical Modification codes.
        </p>
        {dataStatus.totalCodes && (
          <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Database contains {dataStatus.totalCodes.toLocaleString()} ICD-10-CM codes
          </p>
        )}
      </div>
      
      <div className="mb-16">
        <Search onSearchResults={setSearchResults} />
      </div>
      
      {searchResults.length > 0 && (
        <div className="mt-8 animate-fadeIn">
          <div className="flex justify-between items-baseline mb-4">
            <h2 className={`text-2xl font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Search Results</h2>
            <div className="flex items-center">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </span>
              <span className={`ml-2 text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                Top {Math.min(searchResults.length, 50)} shown
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            ? 'bg-dark-surface text-gray-200 border-gray-800 shadow-black/30'
            : 'bg-white text-gray-800 border-gray-200'
        } p-6 rounded-lg shadow-md border`}>
          <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>How to use this tool</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Search by ICD-10-CM code (e.g., "E11.9")</li>
            <li>Search by medical condition (e.g., "diabetes")</li>
            <li>Search by symptoms or keywords</li>
            <li>Click on any result to view detailed information</li>
            <li>Download information for offline reference</li>
            <li>Use the sidebar to browse codes by letter</li>
          </ul>
        </div>
      )}
      
      {/* Easter egg button */}
      <button 
        onClick={toggleEasterEgg}
        className={`fixed bottom-5 left-5 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
          darkMode
            ? 'bg-blue-800 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/50'
            : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md'
        }`}
        aria-label="Fun Surprise"
        title="Funsie Button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </div>
  );
}

export default HomePage; 