import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { searchCodes } from '../utils/dataProcessor';

function Search({ onSearchResults }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const searchTimerRef = useRef(null);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setSuggestions([]);
        setFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Perform search and maintain focus
  const performSearch = useCallback(
    async (value) => {
      if (!value || !value.trim()) {
        setSuggestions([]);
        if (onSearchResults) {
          onSearchResults([]);
        }
        return;
      }
      
      setLoading(true);
      
      try {
        // Search using the dataProcessor utility
        const results = await searchCodes(value);
        
        // Ensure we keep focus on the input
        if (inputRef.current) {
          inputRef.current.focus();
        }
        
        // Update suggestions (top 10)
        setSuggestions(results.slice(0, 10));
        
        // Update search results (all results)
        if (onSearchResults) {
          onSearchResults(results);
        }
      } catch (error) {
        console.error('Error searching codes:', error);
      } finally {
        setLoading(false);
      }
    },
    [onSearchResults]
  );

  // Handle input change with debounce
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    // Clear any existing timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    
    // Set a new timer
    searchTimerRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  // Handle item selection
  const handleSelectItem = (code) => {
    navigate(`/code/${code}`);
    setSuggestions([]);
  };

  // Handle key press events
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      performSearch(query);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto relative">
      <div className="relative">
        <div className={`relative rounded-xl transition-all duration-300 ${
          focused 
            ? darkMode
              ? 'ring-4 ring-blue-700 shadow-lg shadow-blue-900/20'
              : 'ring-4 ring-blue-200 shadow-lg'
            : darkMode
              ? 'shadow shadow-gray-900'
              : 'shadow'
        }`}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search for an ICD-10-CM code or description..."
            className={`w-full p-5 pr-16 text-lg rounded-xl border-0 outline-none focus:ring-0 ${
              darkMode 
                ? 'bg-dark-surface text-gray-200 placeholder-gray-500'
                : 'bg-white text-gray-800 placeholder-gray-400'
            }`}
            disabled={loading}
            aria-label="Search"
            autoFocus
          />
          
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex">
            {query.length > 0 && (
              <button 
                className={`mr-2 ${
                  darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                } transition`}
                onClick={() => {
                  setQuery('');
                  setSuggestions([]);
                  if (onSearchResults) onSearchResults([]);
                  // Return focus to input after clearing
                  if (inputRef.current) inputRef.current.focus();
                }}
                aria-label="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            
            {loading ? (
              <div className={`animate-spin ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <button 
                onClick={() => performSearch(query)}
                className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-700'} transition-colors`}
                aria-label="Search"
                disabled={loading || !query.trim()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className={`absolute z-10 w-full mt-2 ${
            darkMode 
              ? 'bg-dark-surface rounded-xl shadow-lg shadow-black/50 border border-gray-800'
              : 'bg-white rounded-xl shadow-lg border border-gray-200'
          } overflow-hidden`}
          style={{ maxHeight: '380px', overflowY: 'auto' }}
        >
          <ul>
            {suggestions.map((item) => (
              <li 
                key={item.code} 
                className={`transition ${
                  darkMode 
                    ? 'hover:bg-gray-800/50 cursor-pointer'
                    : 'hover:bg-blue-50 cursor-pointer'
                }`}
                onClick={() => handleSelectItem(item.code)}
              >
                <div className={`p-4 border-b last:border-b-0 ${
                  darkMode ? 'border-gray-800' : 'border-gray-100'
                }`}>
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <span className={`${
                        darkMode 
                          ? 'bg-blue-900/50 text-blue-300'
                          : 'bg-blue-100 text-blue-800'
                      } text-sm font-medium px-2.5 py-0.5 rounded-md`}>
                        {item.code}
                      </span>
                    </div>
                  </div>
                  <p className={`text-sm mt-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-700'
                  }`}>{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Search;