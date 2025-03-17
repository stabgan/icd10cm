import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import CodeDetailPage from './pages/CodeDetailPage';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [dataStatus, setDataStatus] = useState({ loaded: false, error: null });

  useEffect(() => {
    // Check if the data is available
    const checkDataAvailability = async () => {
      try {
        const response = await fetch('/data/index.json');
        if (!response.ok) {
          throw new Error('Data not available');
        }
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

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        {/* Add padding-top to account for fixed header */}
        <main className="flex-grow container mx-auto px-4 py-8 pt-28">
          {!dataStatus.loaded && dataStatus.error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-md" role="alert">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
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
                  <h2 className="text-2xl font-bold text-gray-700 mb-2">Page Not Found</h2>
                  <p className="text-gray-500">The page you're looking for doesn't exist.</p>
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