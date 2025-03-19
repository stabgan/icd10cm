import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { searchCodes } from '../utils/apiService';

function Search({ onResultsChange, placeholderText }) {
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
        // Don't set focused to false - allows input to keep focus
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Maintain focus on the input - new effect
  useEffect(() => {
    // This ensures the input remains focused during interactions
    if (inputRef.current && focused) {
      inputRef.current.focus();
    }
  }, [focused, suggestions, loading]);

  // Perform search and maintain focus
  const performSearch = useCallback(
    async (value) => {
      if (!value || !value.trim()) {
        setSuggestions([]);
        if (onResultsChange) {
          onResultsChange([]);
        }
        return;
      }
      
      setLoading(true);
      
      try {
        // Search using the API service
        const results = await searchCodes(value);
        
        // Ensure we keep focus on the input
        if (inputRef.current) {
          inputRef.current.focus();
        }
        
        // Update suggestions (top 10)
        setSuggestions(results.slice(0, 10));
        
        // Update search results (all results)
        if (onResultsChange) {
          onResultsChange(results);
        }
      } catch (error) {
        console.error('Error searching codes:', error);
      } finally {
        setLoading(false);
        // Keep input focused after search completes
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    },
    [onResultsChange]
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

  // Ensure input maintains focus when clicking within the component
  const handleComponentClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
      setFocused(true);
    }
  };

  return (
    <div className="relative">
      <div className={`relative flex items-center overflow-hidden rounded-lg ${
        darkMode 
          ? 'bg-medical-darkSurface border-medical-darkBorder shadow-inner shadow-black/10' 
          : 'bg-medical-lightSurface border-medical-lightBorder shadow-inner shadow-gray-100'
      }`}>
        <div className={`pl-4 pr-2 ${darkMode ? 'text-medical-darkMuted' : 'text-medical-lightMuted'} flex-shrink-0`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText || "Search for a code or disease..."}
          className={`w-full py-4 px-3 outline-none text-base transition-colors duration-200 ${
            darkMode 
              ? 'bg-medical-darkSurface text-medical-darkText placeholder:text-medical-darkMuted focus:ring-1 focus:ring-medical-darkAccent/30' 
              : 'bg-medical-lightSurface text-medical-lightText placeholder:text-medical-lightMuted focus:ring-1 focus:ring-medical-lightAccent/30'
          }`}
          autoComplete="off"
        />
        {loading && (
          <div className="pr-4 flex-shrink-0">
            <div className={`h-5 w-5 rounded-full border-2 border-t-transparent animate-spin ${
              darkMode ? 'border-medical-darkAccent' : 'border-medical-lightAccent'
            }`}></div>
          </div>
        )}
        {query && !loading && (
          <button 
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              if (onResultsChange) onResultsChange([]);
              if (inputRef.current) inputRef.current.focus();
            }}
            className={`pr-4 flex-shrink-0 ${darkMode ? 'text-medical-darkMuted hover:text-medical-darkText' : 'text-medical-lightMuted hover:text-medical-lightText'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search suggestions dropdown */}
      {suggestions.length > 0 && focused && (
        <ul 
          ref={suggestionsRef}
          className={`absolute z-30 mt-1 w-full rounded-lg shadow-lg border overflow-hidden max-h-80 overflow-y-auto ${
            darkMode 
              ? 'bg-medical-darkSurface border-medical-darkBorder text-medical-darkText' 
              : 'bg-medical-lightSurface border-medical-lightBorder text-medical-lightText'
          }`}
        >
          {suggestions.map(item => (
            <li 
              key={item.code} 
              className={`px-4 py-3 cursor-pointer flex items-start transition-colors ${
                darkMode 
                  ? 'hover:bg-medical-darkBorder/50' 
                  : 'hover:bg-medical-lightBorder/50'
              }`}
              onClick={() => handleSelectItem(item.code)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <span className={`font-bold ${darkMode ? 'text-medical-darkPrimary' : 'text-medical-lightPrimary'}`}>{item.code}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-2 ${darkMode ? 'text-medical-darkMuted' : 'text-medical-lightMuted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className={`text-sm truncate ${darkMode ? 'text-medical-darkText' : 'text-medical-lightText'} mt-1`}>
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Search;