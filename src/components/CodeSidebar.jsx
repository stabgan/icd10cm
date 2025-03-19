import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getCodesForLetter, getIndexData } from '../utils/apiService';
import { useTheme } from '../contexts/ThemeContext';

function CodeSidebar() {
  const [loading, setLoading] = useState(true);
  const [letters, setLetters] = useState([]);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [codes, setCodes] = useState([]);
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

  // Determine if a code is active based on URL
  const isCodeActive = (code) => {
    return location.pathname === `/code/${code}`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`p-4 ${darkMode ? 'bg-indigo-950/40' : 'bg-indigo-100'} shadow-sm`}>
        <h1 className={`text-xl font-bold ${darkMode ? 'text-indigo-200' : 'text-indigo-800'}`}>
          ICD-10-CM Browser
        </h1>
        <p className={`text-xs mt-1 ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>
          Browse codes by letter
        </p>
      </div>

      {/* Alphabet selector */}
      <div className={`p-2 ${darkMode ? 'bg-indigo-950/30' : 'bg-indigo-100/80'} shadow-sm z-10 border-b border-t ${darkMode ? 'border-indigo-800/50' : 'border-indigo-200'}`}>
        <div className="flex flex-wrap justify-center gap-1">
          {letters.map((letter) => (
            <button
              key={letter}
              onClick={() => handleLetterSelect(letter)}
              className={`w-7 h-7 rounded-md flex items-center justify-center text-sm font-medium
                        transition-colors
                        ${selectedLetter === letter 
                          ? (darkMode ? 'bg-teal-600 text-white shadow-md' : 'bg-teal-500 text-white shadow-md')
                          : (darkMode ? 'bg-indigo-800/50 text-indigo-300 hover:bg-indigo-700/50' 
                                      : 'bg-indigo-200/80 text-indigo-700 hover:bg-indigo-300/80')
                        }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Code list */}
      <div className="flex-grow overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-indigo-400 scrollbar-track-transparent">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500"></div>
          </div>
        ) : (
          <div className="space-y-1">
            {codes.length > 0 ? (
              codes.map((code) => (
                <Link
                  key={code.code}
                  to={`/code/${code.code}`}
                  className={`block px-3 py-2 text-sm rounded-md transition-all
                           ${isCodeActive(code.code)
                              ? (darkMode ? 'bg-teal-700/30 text-teal-200 border-l-4 border-teal-500' 
                                         : 'bg-teal-100/80 text-teal-800 border-l-4 border-teal-500')
                              : (darkMode ? 'hover:bg-indigo-800/30 border-l-4 border-transparent' 
                                         : 'hover:bg-indigo-100 border-l-4 border-transparent')
                           }`}
                  title={`${code.code}: ${code.description}`}
                >
                  <div className="flex flex-col">
                    <span className={`font-medium ${darkMode ? 'text-teal-300' : 'text-teal-600'}`}>{code.code}</span>
                    <span className={`text-xs truncate ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                      {code.description.length > 40 
                        ? `${code.description.substring(0, 40)}...` 
                        : code.description}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className={`text-center py-6 ${darkMode ? 'text-indigo-400' : 'text-indigo-500'} bg-opacity-20 rounded-lg`}>
                <svg className="h-10 w-10 mx-auto mb-2 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">No codes available for letter {selectedLetter}</p>
                <p className="text-xs mt-1">Try selecting a different letter</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CodeSidebar; 