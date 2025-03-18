import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import CodeDetailPage from './pages/CodeDetailPage';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';
import { useTheme } from './contexts/ThemeContext';
import { checkDataLoaded, getIndexData } from './utils/apiService';
import SplashScreen from './components/SplashScreen';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [dataStatus, setDataStatus] = useState({ loaded: false, error: null });
  const [needsDataUpload, setNeedsDataUpload] = useState(false);
  const { darkMode } = useTheme();

  useEffect(() => {
    // Check if the data is available
    const checkDataAvailability = async () => {
      try {
        // Check if data is available on the server
        const dataLoaded = await checkDataLoaded();
        
        if (dataLoaded) {
          // If data is loaded on the server, get metadata
          const indexData = await getIndexData();
          setDataStatus({ 
            loaded: true, 
            totalCodes: indexData.totalCodes || 0,
            lastUpdated: indexData.lastUpdated || new Date().toISOString(),
            dataAvailable: true
          });
          setNeedsDataUpload(false);
        } else {
          // No data on server, user needs to upload
          console.log('No data available, need user to upload data');
          setNeedsDataUpload(true);
        }
      } catch (error) {
        console.error('Failed to check data availability:', error);
        // Something went wrong, ask user to upload data
        setNeedsDataUpload(true);
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
  
  if (needsDataUpload) {
    return (
      <Router>
        <SplashScreen />
      </Router>
    );
  }

  return (
    <Router>
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