import { useState } from 'react';
import { Link } from 'react-router-dom';
import Search from '../components/Search';
import { useTheme } from '../contexts/ThemeContext';

function HomePage({ dataStatus }) {
  const [searchResults, setSearchResults] = useState([]);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const { darkMode } = useTheme();

  const toggleEasterEgg = () => {
    setShowEasterEgg(!showEasterEgg);
  };

  return (
    <div className="max-w-6xl mx-auto relative min-h-screen pb-20">
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
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((result) => (
              <Link 
                key={result.code} 
                to={`/code/${result.code}`} 
                className={`${
                  darkMode 
                    ? 'bg-dark-surface border-gray-800 hover:border-blue-700 hover:shadow-blue-900/20'
                    : 'bg-white border-gray-200 hover:border-blue-300'
                } p-4 rounded-lg hover:shadow-lg transition-all duration-300 border transform hover:-translate-y-1`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'} text-lg tracking-wide`}>{result.code}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-700'} line-clamp-2`}>{result.description}</p>
              </Link>
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