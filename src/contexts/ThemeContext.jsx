import { createContext, useContext, useEffect, useState } from 'react';

// Create theme context
export const ThemeContext = createContext({
  darkMode: false,
  toggleDarkMode: () => {},
});

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export function ThemeProvider({ children }) {
  // Check for system preference or saved preference
  const getInitialTheme = () => {
    // Check if a theme preference is stored in localStorage
    try {
      const savedTheme = localStorage.getItem('darkMode');
      
      if (savedTheme !== null) {
        return savedTheme === 'true';
      }
      
      // Check for system preference if matchMedia is available
      if (typeof window !== 'undefined' && window.matchMedia) {
        try {
          const matcher = window.matchMedia('(prefers-color-scheme: dark)');
          return matcher.matches;
        } catch (mediaError) {
          console.error('Error with matchMedia:', mediaError);
          return false; // Default to light if matchMedia fails
        }
      }
    } catch (error) {
      console.error('Error detecting theme preference:', error);
    }
    
    // Default to light theme
    return false;
  };

  const [darkMode, setDarkMode] = useState(false);
  
  // Initialize after component mounts to avoid hydration issues
  useEffect(() => {
    setDarkMode(getInitialTheme());
  }, []);

  // Update the DOM when dark mode changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Save preference to localStorage
      try {
        localStorage.setItem('darkMode', String(darkMode));
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    }
  }, [darkMode]);

  // Toggle dark mode function
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
} 