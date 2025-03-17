import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';

function Search({ onSearchResults }) {
  const [query, setQuery] = useState('');
  const [searchIndex, setSearchIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const navigate = useNavigate();

  // Load search index
  useEffect(() => {
    const loadSearchIndex = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data/search-index.json');
        
        if (!response.ok) {
          throw new Error('Failed to load search index');
        }
        
        const data = await response.json();
        
        // Create Fuse.js index
        const fuse = new Fuse(data, {
          keys: ['code', 'description', 'category'],
          threshold: 0.3,
          includeScore: true
        });
        
        setSearchIndex(fuse);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load search index:', error);
        setLoading(false);
      }
    };
    
    loadSearchIndex();
  }, []);

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

  // Debounced search function
  const debouncedSearch = useCallback(
    (value) => {
      if (!searchIndex || !value.trim()) {
        setSuggestions([]);
        if (onSearchResults) {
          onSearchResults([]);
        }
        return;
      }
      
      const results = searchIndex.search(value);
      setSuggestions(results.slice(0, 10).map(result => result.item));
      
      if (onSearchResults) {
        onSearchResults(results.slice(0, 50).map(result => result.item));
      }
    },
    [searchIndex, onSearchResults]
  );

  // Handle input change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSearch(query);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query, debouncedSearch]);

  // Handle item selection
  const handleSelectItem = (code) => {
    navigate(`/code/${code}`);
    setSuggestions([]);
    setFocused(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto relative">
      <div className="relative">
        <div className={`relative rounded-xl transition-all duration-300 ${
          focused ? 'ring-4 ring-blue-200 shadow-lg' : 'shadow'
        }`}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Search for an ICD-10-CM code or description..."
            className="w-full p-5 pr-16 text-lg rounded-xl border-0 outline-none focus:ring-0 bg-white"
            disabled={loading}
            aria-label="Search"
          />
          
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex">
            {query.length > 0 && (
              <button 
                className="mr-2 text-gray-400 hover:text-gray-600 transition"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            
            {loading ? (
              <div className="animate-spin text-blue-500">
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <div className="text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
          style={{ maxHeight: '380px', overflowY: 'auto' }}
        >
          <ul>
            {suggestions.map((item) => (
              <li 
                key={item.code} 
                className="transition hover:bg-blue-50 cursor-pointer"
                onClick={() => handleSelectItem(item.code)}
              >
                <div className="p-4 border-b last:border-b-0 border-gray-100">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-md">
                        {item.code}
                      </span>
                      <span className="text-xs font-medium bg-gray-100 text-gray-700 ml-2 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm mt-1 text-gray-700">{item.description}</p>
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