import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import CodeDetailPage from './pages/CodeDetailPage';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';
import { useTheme } from './contexts/ThemeContext';

// Helper component to check for GitHub Pages redirects
const GithubPagesRedirectHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Check if we have a redirect from 404.html
    const redirect = sessionStorage.getItem('redirect');
    if (redirect) {
      // Clear the redirect param
      sessionStorage.removeItem('redirect');
      
      // Extract the path from the stored redirect path
      const redirectPath = redirect.split('?p=/')[1] || '/';
      if (redirectPath && redirectPath !== location.pathname) {
        navigate(redirectPath);
      }
      return;
    }
    
    // Check for query param redirect from GitHub Pages
    const query = new URLSearchParams(location.search);
    const path = query.get('p');
    if (path) {
      // Remove the 'p' query parameter but keep others
      const newSearch = new URLSearchParams(location.search);
      newSearch.delete('p');
      
      // Navigate to the path while preserving other query params
      navigate({
        pathname: path,
        search: newSearch.toString()
      });
    }
  }, [navigate, location]);
  
  return null;
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [dataStatus, setDataStatus] = useState({ loaded: false, error: null });
  const { darkMode } = useTheme();

  useEffect(() => {
    // Check if the data is available
    const checkDataAvailability = async () => {
      try {
        // Get the base URL for the current environment
        const basePath = import.meta.env.BASE_URL || '/';
        // Ensure basePath ends with a slash
        const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
        
        // Construct the full URL for the data file
        const dataPath = 'data/index.json';
        let dataUrl;
        
        // Handle different environments
        if (window.location.hostname === 'stabgan.com') {
          // For custom domain
          dataUrl = `${window.location.origin}/icd10cm/${dataPath}`;
        } else if (window.location.hostname.includes('github.io')) {
          // For GitHub Pages
          dataUrl = `${window.location.origin}/icd10cm/${dataPath}`;
        } else {
          // For development
          dataUrl = `${window.location.origin}${normalizedBasePath}${dataPath}`;
        }
        
        console.log('Fetching data from:', dataUrl);
        const response = await fetch(dataUrl);
        if (!response.ok)
          throw new Error("Data not available");
        const data = await response.json();
        setDataStatus({ 
          loaded: true, 
          totalCodes: data.totalCodes, 
          chunkCount: data.chunkCount,
          lastUpdated: data.lastUpdated
        });
      } catch (error) {
        console.error('Failed to load data:', error);
        setDataStatus({ 
          loaded: false, 
          error: 'Failed to load ICD-10 code data. Please make sure the data files are properly processed.' 
        });
      } finally {
        // Simulate a minimum loading time for better UX
        setTimeout(() => setIsLoading(false), 800);
      }
    };

    checkDataAvailability();
  }, []);

  if (isLoading) {
    return <LoadingScreen message="Loading ICD-10-CM Code Browser..." />;
  }

  // Get the base URL for GitHub Pages
  const getBasename = () => {
    // In development, use root
    if (process.env.NODE_ENV !== 'production') {
      return '/';
    }
    
    // In production, use the icd10cm subdirectory path
    return '/icd10cm';
  };

  return (
    <Router basename={getBasename()}>
      <GithubPagesRedirectHandler />
      <div className={`min-h-screen flex flex-col ${
        darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
      } transition-colors duration-300`}>
        <Header />
        {/* Add padding-top to account for fixed header */}
        <main className="flex-grow container mx-auto px-4 py-8 pt-28">
          {!dataStatus.loaded && dataStatus.error ? (
            <div className={`${
              darkMode ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-500 text-red-700'
            } border-l-4 p-4 rounded shadow-md`} role="alert">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className={`h-5 w-5 ${darkMode ? 'text-red-400' : 'text-red-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                    {dataStatus.error}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<HomePage dataStatus={dataStatus} />} />
              <Route path="/code/:codeId" element={<CodeDetailPage />} />
              <Route path="*" element={
                <div className="text-center py-12">
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Page Not Found</h2>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>The page you're looking for doesn't exist.</p>
                </div>
              } />
            </Routes>
          )}
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;