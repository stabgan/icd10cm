import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getCodesForLetter, getIndexData } from '../utils/apiService';
import { useTheme } from '../contexts/ThemeContext';

function CodeSidebar() {
  const [loading, setLoading] = useState(true);
  const [letters, setLetters] = useState([]);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [codes, setCodes] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const { darkMode } = useTheme();
  const location = useLocation();

  // Load available letters from the index
  useEffect(() => {
    const loadLetters = async () => {
      try {
        const indexData = await getIndexData();
        if (indexData && indexData.chunkMap) {
          const availableLetters = Object.keys(indexData.chunkMap).sort();
          setLetters(availableLetters);
          
          // Select the first letter by default if none is selected
          if (availableLetters.length > 0 && !selectedLetter) {
            handleLetterSelect(availableLetters[0]);
          }
        }
      } catch (error) {
        console.error('Error loading letters:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLetters();
  }, [selectedLetter]);

  // Load codes for the selected letter
  const handleLetterSelect = async (letter) => {
    setSelectedLetter(letter);
    setLoading(true);
    
    try {
      const letterCodes = await getCodesForLetter(letter);
      setCodes(letterCodes);
    } catch (error) {
      console.error(`Error loading codes for letter ${letter}:`, error);
      setCodes([]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle sidebar expansion
  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  // Determine if a code is active based on URL
  const isCodeActive = (code) => {
    return location.pathname === `/code/${code}`;
  };

  return (
    <div 
      className={`fixed left-0 top-0 pt-16 h-screen transition-all duration-300 ease-in-out z-10
                ${isExpanded ? 'w-64' : 'w-16'} 
                ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}
                border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
    >
      <div className="h-full flex flex-col overflow-hidden">
        {/* Toggle button */}
        <button 
          onClick={toggleSidebar}
          className={`absolute right-0 top-20 w-6 h-12 flex items-center justify-center 
                    ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}
                    rounded-r-md`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Sidebar content */}
        <div className="flex flex-col h-full overflow-hidden">
          {/* Alphabet selector */}
          <div className={`p-2 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} flex flex-wrap sticky top-0 z-20`}>
            {letters.map((letter) => (
              <button
                key={letter}
                onClick={() => handleLetterSelect(letter)}
                className={`w-8 h-8 m-0.5 rounded-md flex items-center justify-center text-sm font-medium
                          transition-colors
                          ${selectedLetter === letter 
                            ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                            : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                          }`}
              >
                {letter}
              </button>
            ))}
          </div>

          {/* Code list */}
          <div className="flex-grow overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              isExpanded && (
                <div className="space-y-1">
                  {codes.length > 0 ? (
                    codes.map((code) => (
                      <Link
                        key={code.code}
                        to={`/code/${code.code}`}
                        className={`block px-3 py-2 text-sm rounded-md truncate transition-colors
                                 ${isCodeActive(code.code)
                                    ? (darkMode ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-800')
                                    : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
                                 }`}
                        title={`${code.code}: ${code.description}`}
                      >
                        <span className="font-medium">{code.code}</span>
                        {isExpanded && (
                          <span className="ml-2 text-xs opacity-80 truncate">{code.description.substring(0, 20)}...</span>
                        )}
                      </Link>
                    ))
                  ) : (
                    <div className={`text-center py-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No codes available for letter {selectedLetter}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeSidebar; 